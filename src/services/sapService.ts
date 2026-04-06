import { supabase } from '../lib/supabase';
import { implementationService } from './implementationService';
import { businessPartnersService } from './businessPartnersService';
import { receitaFederalService } from './receitaFederalService';
import { ordersService, Order } from './ordersService';
import { establishmentsService } from './establishmentsService';
import { generateTrackingCode } from '../utils/trackingCodeGenerator';
import { TenantContextHelper } from '../utils/tenantContext';
import { freightQuoteService } from './freightQuoteService';

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
      const proxyUrl = import.meta.env.VITE_ERP_PROXY_URL || 'https://tms-erp-proxy-303812479794.us-east1.run.app';
      const payload = {
        endpointSystem: erpConfig.service_layer_address,
        port: erpConfig.port,
        username: erpConfig.username,
        password: erpConfig.password,
        companyDb: erpConfig.database,
        sap_bpl_id: erpConfig.sap_bpl_id || null,
        lastSyncTime: null // Manual fetch pulls last 3 days
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

      const sapOrders = data.orders;
      if (!sapOrders || sapOrders.length === 0) {
        return { success: false, error: 'Lista de Pedidos retornada pela integração do SAP está vazia ou já foram importados.' };
      }

      let insertedCount = 0;
      let lastMessage = '';

      for (const sapOrder of sapOrders) {



      // 3. Partner / CNPJ Enrichment Logic
      let finalBusinessPartnerId: string | null = null;
      let finalBusinessPartnerName = sapOrder.customer.name;
      let finalBusinessPartnerZipCode = '';
      let finalBusinessPartnerStreet = '';
      let finalBusinessPartnerNeighborhood = '';
      let finalBusinessPartnerNumber = '';
      let finalBusinessPartnerCity = '';
      let finalBusinessPartnerState = '';

      if (sapOrder.customer.document) {
        const rawCnpj = sapOrder.customer.document.replace(/\D/g, '');
        // Busca se já existe no banco
        const { data: existingBPData } = await supabase!
          .from('business_partners')
          .select('id, razao_social, addresses:business_partner_addresses(zip_code, street, number, neighborhood, city, state)')
          .eq('cpf_cnpj', rawCnpj)
          .eq('organization_id', context?.organizationId || '')
          .maybeSingle();
          
        const existingBP = existingBPData as any;

        if (existingBP) {
          finalBusinessPartnerId = existingBP.id;
          finalBusinessPartnerName = existingBP.razao_social;
          if (existingBP.addresses && existingBP.addresses.length > 0) {
             const addr = existingBP.addresses[0];
             finalBusinessPartnerZipCode = addr.zip_code;
             finalBusinessPartnerStreet = addr.street;
             finalBusinessPartnerNeighborhood = addr.neighborhood;
             finalBusinessPartnerNumber = addr.number;
             finalBusinessPartnerCity = addr.city;
             finalBusinessPartnerState = addr.state;
          }
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
                finalBusinessPartnerCity = newPartnerPayload.addresses[0].city;
                finalBusinessPartnerState = newPartnerPayload.addresses[0].state;
                finalBusinessPartnerZipCode = newPartnerPayload.addresses[0].zipCode;
                finalBusinessPartnerStreet = newPartnerPayload.addresses[0].street;
                finalBusinessPartnerNeighborhood = newPartnerPayload.addresses[0].neighborhood;
                finalBusinessPartnerNumber = newPartnerPayload.addresses[0].number;
              } else {
                throw new Error(`Falha ao autocadastrar Cliente (Receita Federal): ${createdPartner.error || 'Motivo desconhecido'}`);
              }
            }
          } catch (receitaErr: any) {

            throw new Error(`Não foi possível auto-cadastrar o CNPJ ${rawCnpj}: ${receitaErr.message || receitaErr}`);
          }
        }
      }

      // Fetch Carrier Partner from TMS Database using carrier_document from proxy
      let finalCarrierId: string | null = null;
      
      if (sapOrder.carrier_document) {
        const rawCarrierCnpj = sapOrder.carrier_document.replace(/\D/g, '');
        if (rawCarrierCnpj) {
          try {
            const { data: existingCarrierData } = await supabase!
              .from('carriers')
              .select('id')
              .eq('cnpj', rawCarrierCnpj)
              .eq('organization_id', context?.organizationId || '')
              .eq('environment_id', context?.environmentId || '')
              .maybeSingle();

            if (existingCarrierData) {
              finalCarrierId = (existingCarrierData as any).id;
            }
          } catch (e) {

          }
        }
      }

      // Fetch Establishment Code for Tracking
      let estabCode = '0001';
      let estabPrefix = 'TGL';

      if (context?.establishmentId) {
         try {
           const estab = await establishmentsService.getById(context.establishmentId);
           if (estab) {
              estabCode = estab.codigo || '0001';
              estabPrefix = estab.tracking_prefix || 'TGL';
           }
         } catch(e) {}
      }

      const trackingCode = generateTrackingCode(
         sapOrder.order_number, 
         new Date(sapOrder.issue_date || new Date()),
         estabCode,
         estabPrefix
      );

      // 5. Structure TMS Order Object
      let freightResults: any[] = [];
      let finalFreightValue = 0;
      let calculatedBestCarrier = finalCarrierId;

      try {
        const destZipCodeStr = sapOrder.destination?.zip_code || finalBusinessPartnerZipCode || '';
        const destZipCode = destZipCodeStr.replace(/\D/g, '');
        const w = parseFloat(sapOrder.weight || '0');
        const ov = parseFloat(sapOrder.order_value || '0');

        if (destZipCode && w > 0 && ov > 0) {
          const results = await freightQuoteService.calculateQuote(
            {
              destinationZipCode: destZipCode,
              weight: w,
              volumeQty: Math.ceil(sapOrder.volume_qty || 1),
              cubicMeters: sapOrder.cubic_meters || 0,
              cargoValue: ov,
              selectedModals: ['rodoviario', 'aereo', 'aquaviario', 'ferroviario']
            },
            'SYSTEM', // Fake user_id since it's automated
            'Integração SAP',
            ''
          );

          if (results && results.length > 0) {
            freightResults = results;
            // Se já tem transportadora do SAP, força usar o valor da tabela dela se existir no resultado
            let carrierResult = finalCarrierId ? results.find(r => r.carrierId === finalCarrierId) : null;
            
            // Senão, usa a mais barata cotada
            if (!carrierResult) {
              carrierResult = results[0];
            }

            if (carrierResult) {
              finalFreightValue = carrierResult.totalValue;
              if (!calculatedBestCarrier) {
                calculatedBestCarrier = carrierResult.carrierId;
              }
            }
          }
        }
      } catch (err) {

      }

      const tmsOrder: Order = {
        order_number: sapOrder.order_number,
        issue_date: sapOrder.issue_date,
        entry_date: new Date().toISOString().split('T')[0],
        expected_delivery: sapOrder.expected_delivery || null,
        customer_id: finalBusinessPartnerId || undefined,
        customer_name: finalBusinessPartnerName,
        carrier_id: calculatedBestCarrier || undefined,
        best_carrier_id: calculatedBestCarrier || undefined,
        freight_results: freightResults as any,
        freight_value: finalFreightValue,
        order_value: sapOrder.order_value,
        weight: sapOrder.weight,
        volume_qty: Math.ceil(sapOrder.volume_qty || 1),
        cubic_meters: sapOrder.cubic_meters,
        destination_zip_code: sapOrder.destination?.zip_code || finalBusinessPartnerZipCode || null,
        destination_street: sapOrder.destination?.street || finalBusinessPartnerStreet || null,
        destination_number: sapOrder.destination?.number || finalBusinessPartnerNumber || null,
        destination_neighborhood: sapOrder.destination?.neighborhood || finalBusinessPartnerNeighborhood || null,
        destination_city: sapOrder.destination?.city || finalBusinessPartnerCity || null,
        destination_state: sapOrder.destination?.state || finalBusinessPartnerState || null,
        observations: sapOrder.observations || null,
        status: 'pending',
        tracking_code: trackingCode,
        created_by: 1
      };



      // 6. Check if Order already exists
      const { data: existingOrder } = await supabase!
        .from('orders')
        .select('id')
        .eq('numero_pedido', String(sapOrder.order_number))
        .eq('organization_id', context?.organizationId || 0)
        .eq('environment_id', context?.environmentId || 0)
        .maybeSingle();

      if (existingOrder) {
        continue;
      }

      const createOrderResult = await ordersService.create(tmsOrder);
      if (!createOrderResult.success || !createOrderResult.id) {
        continue;
      }

      // 8. Persist Items mapping from SAP Lines
      if (sapOrder.items && sapOrder.items.length > 0) {
        const orderItemsObj = sapOrder.items.map((it: any) => ({
          ...it,
          quantity: Math.ceil(it.quantity || 1), // garante casting de casas decimais para inteiros no banco
          order_id: createOrderResult.id
        }));
        await ordersService.addItems(createOrderResult.id, orderItemsObj);
      }

      insertedCount++;
      lastMessage = `Pedido ${sapOrder.order_number} importado!`;

      }

      return { 
        success: true, 
        message: insertedCount > 0 ? `${insertedCount} pedido(s) sincronizado(s). Último: ${lastMessage}` : 'Nenhum pedido novo foi sincronizado.'
      };

    } catch (error: any) {

      return { success: false, error: error.message || 'Exceção fatal na orquestração SAP.' };
    }
  },

  /**
   * Orchestrates fetching the latest Invoice from SAP, checking/enriching the partner via 
   * Receita Federal, and persisting to `invoices` and `invoice_items` tables.
   */
  async importLatestSAPInvoice(): Promise<{ success: boolean; message?: string; error?: string }> {
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
      const proxyUrl = import.meta.env.VITE_ERP_PROXY_URL || 'https://tms-erp-proxy-303812479794.us-east1.run.app';
      const payload = {
        endpointSystem: erpConfig.service_layer_address,
        port: erpConfig.port,
        username: erpConfig.username,
        password: erpConfig.password,
        companyDb: erpConfig.database,
        sap_bpl_id: erpConfig.sap_bpl_id || null,
        lastSyncTime: null
      };

      const response = await fetch(`${proxyUrl}/api/fetch-sap-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      let data;
      try {
         data = await response.json();
      } catch (jsonErr) {
         return { success: false, error: 'Resposta inválida do Proxy (Não é JSON).' };
      }

      if (!data?.success) {
        return { success: false, error: data?.error || 'Erro desconhecido retornado pelo Proxy SAP.' };
      }

      const sapInvoices = data.invoices;
      if (!sapInvoices || sapInvoices.length === 0) {
        return { success: false, error: 'A lista de Notas Fiscais retornada pelo SAP está vazia.' };
      }

      let insertedCountInvoice = 0;
      let lastInvoiceMessage = '';

      for (const sapInvoice of sapInvoices) {



      // 3. Extract Customer / Business Partner
      let finalBusinessPartnerId: string | null = null;
      let finalBusinessPartnerName = sapInvoice.customer?.name || '';
      let finalBusinessPartnerZipCode = '';
      let finalBusinessPartnerStreet = '';
      let finalBusinessPartnerNeighborhood = '';
      let finalBusinessPartnerNumber = '';
      let finalBusinessPartnerCity = '';
      let finalBusinessPartnerState = '';

      if (sapInvoice.customer?.document) {
        const rawCnpj = sapInvoice.customer.document.replace(/\D/g, '');
        if (rawCnpj) {
          try {
            // First look up internally in Business Partners
            const { data: existingPartnerData } = await (supabase as any)
              .from('business_partners')
              .select('id, razao_social, addresses:business_partner_addresses(zip_code, street, number, neighborhood, city, state)')
              .eq('cpf_cnpj', rawCnpj)
              .eq('organization_id', context?.organizationId || 0)
              .maybeSingle();

            if (existingPartnerData) {
              finalBusinessPartnerId = existingPartnerData.id;
              finalBusinessPartnerName = existingPartnerData.razao_social || finalBusinessPartnerName;

              if (existingPartnerData.addresses && (existingPartnerData.addresses as any).length > 0) {
                 const addr = (existingPartnerData.addresses as any)[0];
                 finalBusinessPartnerZipCode = addr.zip_code;
                 finalBusinessPartnerStreet = addr.street;
                 finalBusinessPartnerNeighborhood = addr.neighborhood;
                 finalBusinessPartnerNumber = addr.number;
                 finalBusinessPartnerCity = addr.city;
                 finalBusinessPartnerState = addr.state;
              }
            } else {
              // Not found locally? Auto-register using Receita Federal!
              const receitaData = await receitaFederalService.consultarCNPJ(rawCnpj) as any;
              
              if (!receitaData || !receitaData.razao_social) {
                throw new Error(`Dados inválidos retornados pela Receita Federal para CNPJ ${rawCnpj}`);
              }

              const newPartnerPayload = {
                name: receitaData.razao_social,
                document: rawCnpj,
                documentType: 'cnpj',
                type: 'both',
                status: 'active',
                email: receitaData.email || '',
                phone: receitaData.telefone || receitaData.ddd_telefone_1 || '',
                taxRegime: receitaData.simples?.optante ? 'simples_nacional' : 'regime_normal',
                addresses: [{
                  type: 'commercial',
                  zipCode: receitaData.cep ? receitaData.cep.replace(/\D/g, '') : '',
                  street: receitaData.logradouro || '',
                  number: receitaData.numero || '',
                  complement: receitaData.complemento || '',
                  neighborhood: receitaData.bairro || '',
                  city: receitaData.municipio || '',
                  state: receitaData.uf || '',
                  isPrimary: true
                }]
              };

              const createdPartner = await businessPartnersService.create(newPartnerPayload as any, 1);
              if (createdPartner.success && createdPartner.id) {
                finalBusinessPartnerId = createdPartner.id;
                finalBusinessPartnerName = newPartnerPayload.name;
                finalBusinessPartnerZipCode = newPartnerPayload.addresses[0].zipCode;
                finalBusinessPartnerCity = newPartnerPayload.addresses[0].city;
                finalBusinessPartnerState = newPartnerPayload.addresses[0].state;
                finalBusinessPartnerStreet = newPartnerPayload.addresses[0].street;
                finalBusinessPartnerNeighborhood = newPartnerPayload.addresses[0].neighborhood;
                finalBusinessPartnerNumber = newPartnerPayload.addresses[0].number;
              } else {
                throw new Error(`Falha ao autocadastrar Cliente (Receita Federal): ${createdPartner.error || 'Motivo desconhecido'}`);
              }
            }
          } catch (receitaErr: any) {

             throw new Error(`Não foi possível auto-cadastrar o CNPJ ${rawCnpj}: ${receitaErr.message || receitaErr}`);
          }
        }
      }

      // 4. Fetch Carrier Partner from TMS Database using carrier_document from proxy
      let finalCarrierId: string | null = null;
      
      if (sapInvoice.carrier_document) {
        const rawCarrierCnpj = sapInvoice.carrier_document.replace(/\D/g, '');
        if (rawCarrierCnpj) {
          try {
            const { data: existingCarrierData } = await supabase!
              .from('carriers')
              .select('id')
              .eq('cnpj', rawCarrierCnpj)
              .eq('organization_id', context?.organizationId || '')
              .eq('environment_id', context?.environmentId || '')
              .maybeSingle();

            if (existingCarrierData) {
              finalCarrierId = (existingCarrierData as any).id;
            }
          } catch (e) {

          }
        }
      }

      // 5. Calculate Freight Automatically
      let freightResults: any[] = [];
      let finalFreightValue = 0;
      let calculatedBestCarrier = finalCarrierId;

      try {
        const destZipCodeStr = sapInvoice.destination?.zip_code || finalBusinessPartnerZipCode || '';
        const destZipCode = destZipCodeStr.replace(/\D/g, '');
        const w = parseFloat(sapInvoice.weight || '0');
        const ov = parseFloat(sapInvoice.order_value || sapInvoice.invoice_value || '0');

        if (destZipCode && w > 0 && ov > 0) {
          const results = await freightQuoteService.calculateQuote(
            {
              destinationZipCode: destZipCode,
              weight: w,
              volumeQty: Math.ceil(sapInvoice.volume_qty || 1),
              cubicMeters: sapInvoice.cubic_meters || 0,
              cargoValue: ov,
              selectedModals: ['rodoviario', 'aereo', 'aquaviario', 'ferroviario']
            },
            'SYSTEM',
            'Integração SAP',
            ''
          );

          if (results && results.length > 0) {
            freightResults = results;
            let carrierResult = finalCarrierId ? results.find(r => r.carrierId === finalCarrierId) : null;
            if (!carrierResult) carrierResult = results[0];

            if (carrierResult) {
              finalFreightValue = carrierResult.totalValue;
              if (!calculatedBestCarrier) calculatedBestCarrier = carrierResult.carrierId;
            }
          }
        }
      } catch (err) {

      }

      // 6. Check if Invoice already exists
      const invNum = String(sapInvoice.invoice_number || sapInvoice.DocNum || sapInvoice.order_number || '');
      const { data: existingInvoice } = await (supabase as any)
        .from('invoices_nfe')
        .select('id')
        .eq('numero', invNum)
        .eq('organization_id', context?.organizationId || 0)
        .maybeSingle();

      if (existingInvoice) {
        continue;
      }

      const tmsNfe = {
        organization_id: context?.organizationId || null,
        environment_id: context?.environmentId || null,
        establishment_id: context?.establishmentId || null,
        numero: invNum,
        serie: sapInvoice.serie || '1',
        data_emissao: sapInvoice.issue_date || new Date().toISOString().split('T')[0],
        natureza_operacao: 'Venda',
        destinatario_cnpj: sapInvoice.customer?.document ? sapInvoice.customer.document.replace(/\D/g, '') : '',
        destinatario_nome: finalBusinessPartnerName,
        valor_produtos: parseFloat(sapInvoice.order_value || sapInvoice.invoice_value || '0'),
        valor_total: parseFloat(sapInvoice.order_value || sapInvoice.invoice_value || '0'),
        valor_frete: finalFreightValue,
        freight_results: freightResults,
        peso_total: sapInvoice.weight || 0,
        quantidade_volumes: Math.ceil(sapInvoice.volume_qty || 1),
        carrier_id: calculatedBestCarrier || null,
        situacao: 'Emitida',
        invoice_type: 'NFe',
        order_number: sapInvoice.order_number || ''
      };



      const { data: insertedNfe, error: insertError } = await (supabase as any)
        .from('invoices_nfe')
        .insert({ ...tmsNfe, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .select()
        .single();

      if (insertError || !insertedNfe) {
         continue;
      }

      if (sapInvoice.items && sapInvoice.items.length > 0) {
         const itemsBatch = sapInvoice.items.map((it: any) => ({
             invoice_nfe_id: insertedNfe.id,
             descricao: it.description,
             quantidade: Math.ceil(it.quantity || 1),
             valor_unitario: it.unit_price || 0,
             valor_total: it.total_value || 0
         }));
         await (supabase as any).from('invoices_nfe_products').insert(itemsBatch);
      }
      
      if (finalBusinessPartnerId || finalBusinessPartnerName) {
        await (supabase as any).from('invoices_nfe_customers').insert({
           invoice_nfe_id: insertedNfe.id,
           razao_social: finalBusinessPartnerName,
           cnpj_cpf: sapInvoice.customer?.document ? sapInvoice.customer.document.replace(/\D/g, '') : '',
           cidade: sapInvoice.destination?.city || finalBusinessPartnerCity || '',
           estado: sapInvoice.destination?.state || finalBusinessPartnerState || '',
           cep: sapInvoice.destination?.zip_code || finalBusinessPartnerZipCode || '',
           logradouro: sapInvoice.destination?.street || finalBusinessPartnerStreet || '',
           bairro: sapInvoice.destination?.neighborhood || finalBusinessPartnerNeighborhood || '',
           numero: sapInvoice.destination?.number || finalBusinessPartnerNumber || ''
        });
      }
      
      // Update the freight results via ordersService mechanism or just let it exist.
      // Currently invoices table doesn't have freight_results natively like Orders, but we computed freight_value!

      insertedCountInvoice++;
      lastInvoiceMessage = `Nota Fiscal ${invNum} importada com sucesso!`;

      }

      return { 
        success: true, 
        message: insertedCountInvoice > 0 ? `${insertedCountInvoice} nota(s) sincronizada(s). Último: ${lastInvoiceMessage}` : 'Nenhuma nota nova encontrada.'
      };

    } catch (e: any) {

      return { success: false, error: 'Ocorreu um erro interno ao processar a importação da última Nota Fiscal do SAP B1. Tente novamente mais tarde.' };
    }
  }
};
