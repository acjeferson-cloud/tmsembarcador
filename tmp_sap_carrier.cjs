const fs = require('fs');
let content = fs.readFileSync('src/services/sapService.ts', 'utf8');

const search = "      // Fetch Establishment Code for Tracking";

const replacement = `      // Fetch Carrier Partner from TMS Database using carrier_document from proxy
      let finalCarrierId: string | null = null;
      
      if (sapOrder.carrier_document) {
        const rawCarrierCnpj = sapOrder.carrier_document.replace(/\\D/g, '');
        if (rawCarrierCnpj) {
          try {
            const { data: existingCarrierData } = await supabase!
              .from('business_partners')
              .select('id')
              .eq('cpf_cnpj', rawCarrierCnpj)
              .eq('organization_id', context?.organizationId || 0)
              .maybeSingle();

            if (existingCarrierData) {
              finalCarrierId = (existingCarrierData as any).id;
            }
          } catch (e) {
            console.error('Falha ao buscar Transportadora no TMS:', e);
          }
        }
      }

      // Fetch Establishment Code for Tracking`;

if(content.includes(search)) {
    content = content.replace(search, replacement);
    
    // Also inject carrier_id to tmsOrder
    const orderSearch = "        customer_name: finalBusinessPartnerName,";
    const orderReplace = "        customer_name: finalBusinessPartnerName,\n        carrier_id: finalCarrierId || undefined,";
    content = content.replace(orderSearch, orderReplace);
    
    fs.writeFileSync('src/services/sapService.ts', content);
    console.log("Success");
} else {
    console.log("Could not find search string in sapService.ts");
}
