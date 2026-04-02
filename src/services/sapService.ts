import { supabase } from '../lib/supabase';
import { implementationService } from './implementationService';
import { businessPartnersService } from './businessPartnersService';
import { receitaFederalService } from './receitaFederalService';
import { ordersService, Order } from './ordersService';
import { TenantContextHelper } from '../utils/tenantContext';

export const sapIntegrationService = {
  /**
   * Orchestrates fetching the latest Order from SAP, checking/enriching the partner via 
   * Receita Federal, and persisting to `orders` and `order_items` tables.
   */
  async importLatestSAPOrder(): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const context = await TenantContextHelper.getCurrentContext();

      // 1. Fetch ERP Config
      const erpConfig = await implementationService.getERPConfig(
        context?.organizationId || undefined,
        context?.environmentId || undefined,
        context?.establishmentId || undefined
      );

      if (!erpConfig || !erpConfig.service_layer_address) {
        return { success: false, error: 'Sistemas ERP não configurado. Por favor, acesse o Centro de Implementação.' };
      }

      // 2. Invoke Node.js Proxy (Cloud Run VPC)
      const proxyUrl = import.meta.env.VITE_ERP_PROXY_URL || 'http://localhost:8080';
      const payload = {
        endpointSystem: erpConfig.service_layer_address,
        port: erpConfig.port,
        username: erpConfig.username,
        password: erpConfig.password,
        companyDb: erpConfig.database
      };

      const response = await fetch(`${proxyUrl}/api/fetch-sap-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      let data = null;
      try { data = await response.json(); } catch(e) {}

      if (!response.ok || !data) {
        return { success: false, error: data?.error || `Falha de comunicação com o Proxy Cloud Run (${response.status}).` };
      }

      if (!data?.success) {
        return { success: false, error: data?.error || 'Erro ignorado pelo SAP B1.' };
      }

      const sapOrder = data.order;
      if (!sapOrder) {
        return { success: false, error: 'O Pedido retornado pela integração do SAP está vazio.' };
      }

      // 3. Partner / CNPJ Enrichment Logic
      let finalBusinessPartnerId = null;
      let finalBusinessPartnerName = sapOrder.customer.name;

      if (sapOrder.customer.document) {
        const rawCnpj = sapOrder.customer.document.replace(/\D/g, '');
        // Busca se já existe no banco
        const { data: existingBPData } = await supabase!
          .from('business_partners')
          .select('id, razao_social')
          .eq('cpf_cnpj', rawCnpj)
          .eq('organization_id', context?.organizationId || '')
          .maybeSingle();
          
        const existingBP = existingBPData as any;

        if (existingBP) {
          finalBusinessPartnerId = existingBP.id;
          finalBusinessPartnerName = existingBP.razao_social;
        } else if (rawCnpj.length === 14) {
          // 4. Fallback para API Receita Federal
          try {
            const receitaData = await receitaFederalService.consultarCNPJ(rawCnpj) as any;
            if (receitaData) {
              const newPartnerPayload: any = {
                name: receitaData.razao_social || sapOrder.customer.name || 'Nova Empresa LTDA',
                document: rawCnpj,
                documentType: 'cnpj',
                type: 'both',
                status: 'active',
                email: receitaData.email || '',
                phone: receitaData.telefone || receitaData.ddd_telefone_1 || '',
                taxRegime: receitaData.simples?.optante ? 'simples_nacional' : 'regime_normal',
                addresses: [{
                  type: 'commercial',
                  street: receitaData.logradouro || '',
                  number: receitaData.numero || '',
                  complement: receitaData.complemento || '',
                  neighborhood: receitaData.bairro || '',
                  city: receitaData.municipio || '',
                  state: receitaData.uf || '',
                  zipCode: receitaData.cep ? receitaData.cep.replace(/\D/g, '') : '',
                  isPrimary: true
                }]
              };
              
              const createdPartner = await businessPartnersService.create(newPartnerPayload, 1);
              if (createdPartner.success && createdPartner.id) {
                finalBusinessPartnerId = createdPartner.id;
                finalBusinessPartnerName = newPartnerPayload.name;
              } else {
                throw new Error(`Falha ao autocadastrar Cliente (Receita Federal): ${createdPartner.error || 'Motivo desconhecido'}`);
              }
            }
          } catch (receitaErr: any) {
            console.error('Falha na automação da Receita Federal:', receitaErr);
            throw new Error(`Não foi possível auto-cadastrar o CNPJ ${rawCnpj}: ${receitaErr.message || receitaErr}`);
          }
        }
      }

      // 5. Structure TMS Order Object
      const tmsOrder: Order = {
        order_number: sapOrder.order_number,
        issue_date: sapOrder.issue_date,
        entry_date: sapOrder.entry_date,
        expected_delivery: sapOrder.expected_delivery,
        customer_id: finalBusinessPartnerId || undefined,
        customer_name: finalBusinessPartnerName,
        freight_value: 0,
        order_value: sapOrder.order_value,
        weight: sapOrder.weight,
        volume_qty: Math.ceil(sapOrder.volume_qty || 1),
        cubic_meters: sapOrder.cubic_meters,
        destination_zip_code: sapOrder.destination?.zip_code,
        destination_street: sapOrder.destination?.street,
        destination_number: sapOrder.destination?.number,
        destination_neighborhood: sapOrder.destination?.neighborhood,
        destination_city: sapOrder.destination?.city,
        destination_state: sapOrder.destination?.state,
        observations: sapOrder.observations,
        status: 'pending',
        tracking_code: sapOrder.order_number,
        created_by: 1
      };

      // 6. Persist Order
      const createOrderResult = await ordersService.create(tmsOrder);
      if (!createOrderResult.success || !createOrderResult.id) {
        return { success: false, error: createOrderResult.error || 'Erro ao persistir pedido no banco de dados.' };
      }

      // 7. Persist Items mapping from SAP Lines
      if (sapOrder.items && sapOrder.items.length > 0) {
        const orderItemsObj = sapOrder.items.map((it: any) => ({
          ...it,
          quantity: Math.ceil(it.quantity || 1), // garante casting de casas decimais para inteiros no banco
          order_id: createOrderResult.id
        }));
        await ordersService.addItems(createOrderResult.id, orderItemsObj);
      }

      return { 
        success: true, 
        message: `Pedido ${sapOrder.order_number} do cliente ${finalBusinessPartnerName} importado e mapeado com sucesso! Peso: ${sapOrder.weight}kg | Vol: ${sapOrder.volume_qty}.` 
      };

    } catch (error: any) {
      console.error('Integracao SAP Error:', error);
      return { success: false, error: error.message || 'Exceção fatal na orquestração SAP.' };
    }
  }
};
