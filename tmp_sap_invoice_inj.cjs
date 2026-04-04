const fs = require('fs');

let content = fs.readFileSync('src/services/sapService.ts', 'utf8');

// The new function logic:
const newFunction = `

  /**
   * Orchestrates fetching the latest Invoice from SAP, checking/enriching the partner via 
   * Receita Federal, and persisting to \`invoices\` and \`invoice_items\` tables.
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
      const proxyUrl = import.meta.env.VITE_ERP_PROXY_URL || 'http://localhost:8080';
      const payload = {
        endpointSystem: erpConfig.service_layer_address,
        port: erpConfig.port,
        username: erpConfig.username,
        password: erpConfig.password,
        companyDb: erpConfig.database
      };

      const response = await fetch(\`\${proxyUrl}/api/fetch-sap-invoice\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const clone = response.clone();
      try {
        const textStr = await clone.text();
        if (textStr.includes('<html>') || textStr.includes('<title>Error')) {
           return { success: false, error: 'Falha de comunicação com o Proxy Cloud Run (Retornou HTML de Erro na Vercel/GCP)' };
        }
      } catch (e) {}

      let data;
      try {
         data = await response.json();
      } catch (jsonErr) {
         return { success: false, error: 'Resposta inválida do Proxy (Não é JSON).' };
      }

      if (!data.success) {
        return { success: false, error: data.error || 'Erro desconhecido retornado pelo Proxy SAP.' };
      }

      const sapInvoice = data.invoice;
      if (!sapInvoice) {
        return { success: false, error: 'O ERP processou a requisição, porém não devolveu nenhuma Nota Fiscal.' };
      }

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
        const rawCnpj = sapInvoice.customer.document.replace(/\\D/g, '');
        if (rawCnpj) {
          try {
            // First look up internally in Business Partners
            const { data: existingPartnerData } = await supabase!
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
              const receitaData = await receitaFederalService.consultarCNPJ(rawCnpj);
              
              if (!receitaData.razao_social) {
                throw new Error(\`Dados inválidos retornados pela Receita Federal para CNPJ \${rawCnpj}\`);
              }

              const newPartnerPayload = {
                tipo_pessoa: rawCnpj.length === 14 ? 'PJ' : 'PF',
                razao_social: receitaData.razao_social,
                nome_fantasia: receitaData.nome_fantasia || receitaData.razao_social,
                cpf_cnpj: rawCnpj,
                status: 'ativo',
                addresses: [
                  {
                    address_type: 'comercial',
                    zip_code: receitaData.cep || '',
                    street: receitaData.logradouro || '',
                    number: receitaData.numero || '',
                    complement: receitaData.complemento || '',
                    neighborhood: receitaData.bairro || '',
                    city: receitaData.municipio || '',
                    state: receitaData.uf || '',
                    country: 'Brasil'
                  }
                ]
              };

              const createdPartner = await businessPartnersService.create(newPartnerPayload as any);
              if (createdPartner.success && createdPartner.id) {
                finalBusinessPartnerId = createdPartner.id;
                finalBusinessPartnerName = newPartnerPayload.razao_social;
                finalBusinessPartnerZipCode = newPartnerPayload.addresses[0].zip_code;
                finalBusinessPartnerCity = newPartnerPayload.addresses[0].city;
                finalBusinessPartnerState = newPartnerPayload.addresses[0].state;
                finalBusinessPartnerStreet = newPartnerPayload.addresses[0].street;
                finalBusinessPartnerNeighborhood = newPartnerPayload.addresses[0].neighborhood;
                finalBusinessPartnerNumber = newPartnerPayload.addresses[0].number;
              } else {
                throw new Error(\`Falha ao autocadastrar Cliente (Receita Federal): \${createdPartner.error || 'Motivo desconhecido'}\`);
              }
            }
          } catch (receitaErr: any) {
             console.error('Falha na automação da Receita Federal:', receitaErr);
             throw new Error(\`Não foi possível auto-cadastrar o CNPJ \${rawCnpj}: \${receitaErr.message || receitaErr}\`);
          }
        }
      }

      // 4. Fetch Carrier Partner from TMS Database using carrier_document from proxy
      let finalCarrierId: string | null = null;
      
      if (sapInvoice.carrier_document) {
        const rawCarrierCnpj = sapInvoice.carrier_document.replace(/\\D/g, '');
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
            console.error('Falha ao buscar Transportadora no TMS:', e);
          }
        }
      }

      // 5. Calculate Freight Automatically
      let freightResults: any[] = [];
      let finalFreightValue = 0;
      let calculatedBestCarrier = finalCarrierId;

      try {
        const destZipCodeStr = sapInvoice.destination?.zip_code || finalBusinessPartnerZipCode || '';
        const destZipCode = destZipCodeStr.replace(/\\D/g, '');
        const w = parseFloat(sapInvoice.weight || '0');
        const ov = parseFloat(sapInvoice.invoice_value || '0');

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
        console.warn('Falha ao cotar frete automático:', err);
      }

      // 6. Check if Invoice already exists
      const { data: existingInvoice } = await supabase!
        .from('invoices')
        .select('id')
        .eq('invoice_number', String(sapInvoice.invoice_number))
        .eq('organization_id', context?.organizationId || 0)
        .eq('environment_id', context?.environmentId || 0)
        .maybeSingle();

      if (existingInvoice) {
        return { 
          success: true, 
          message: \`Nota Fiscal \${sapInvoice.invoice_number} \${finalBusinessPartnerName ? 'do cliente ' + finalBusinessPartnerName : ''} já havia sido importada anteriormente.\`
        };
      }

      // 7. Configurar Objeto Invoice do TMS - importa de 'invoicesService'
      const { invoicesService } = await import('./invoicesService');

      const tmsInvoice = {
        invoice_number: String(sapInvoice.invoice_number),
        customer_id: finalBusinessPartnerId || undefined,
        customer_name: finalBusinessPartnerName,
        customer_document: sapInvoice.customer?.document || '',
        issue_date: sapInvoice.issue_date,
        invoice_value: parseFloat(sapInvoice.invoice_value || '0'),
        total_value: parseFloat(sapInvoice.invoice_value || '0'),
        freight_value: finalFreightValue,
        carrier_id: calculatedBestCarrier || undefined,
        carrier_name: '', // Service maps it internally
        status: 'pending' as any,
        destination_city: sapInvoice.destination?.city || finalBusinessPartnerCity || '',
        destination_state: sapInvoice.destination?.state || finalBusinessPartnerState || '',
        observations: sapInvoice.observations || '',
        created_by: 1
      };

      // 8. Persistir INVOICE na base local
      const createInvoiceResult = await invoicesService.create(tmsInvoice);
      if (!createInvoiceResult.success || !createInvoiceResult.id) {
         return { success: false, error: createInvoiceResult.error || 'Erro ao persistir nota fiscal no banco de dados.' };
      }

      // 9. Persistir itens da Invoice
      if (sapInvoice.items && sapInvoice.items.length > 0) {
         const itemsBatch = sapInvoice.items.map((it: any) => ({
             ...it,
             quantity: Math.ceil(it.quantity || 1),
             invoice_id: createInvoiceResult.id
         }));
         
         const { error: insertItemsErr } = await supabase!
           .from('invoice_items')
           .insert(itemsBatch);
           
         if (insertItemsErr && insertItemsErr.code !== 'PGRST116') {
             console.error('Erro ao inserir itens da Invoice:', insertItemsErr);
         }
      }
      
      // Update the freight results via ordersService mechanism or just let it exist.
      // Currently invoices table doesn't have freight_results natively like Orders, but we computed freight_value!

      return { 
        success: true, 
        message: \`Nota Fiscal \${sapInvoice.invoice_number} importada! Transportadora: \${finalCarrierId ? 'VINCULADA' : 'NÃO VINCULADA' + (sapInvoice.carrier_document ? ' (CNPJ SAP: '+sapInvoice.carrier_document+')' : '')}. Peso: \${sapInvoice.weight}kg.\`
      };

    } catch (e: any) {
      console.error('Erro na integração SAP Invoices:', e);
      return { success: false, error: 'Ocorreu um erro interno ao processar a importação da última Nota Fiscal do SAP B1. Tente novamente mais tarde.' };
    }
  }
};
`;

content = content.replace("};", newFunction);

fs.writeFileSync('src/services/sapService.ts', content);
console.log("Successfully injected importLatestSAPInvoice");
