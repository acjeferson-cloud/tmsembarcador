const fs = require('fs');
let content = fs.readFileSync('src/services/sapService.ts', 'utf8');

const search = `        // Busca se já existe no banco
        const { data: existingBPData } = await supabase!
          .from('business_partners')
          .select('id, razao_social, cidade, estado, cep, logradouro, bairro, numero')
          .eq('cpf_cnpj', rawCnpj)
          .eq('organization_id', context?.organizationId || '')
          .maybeSingle();
          
        const existingBP = existingBPData as any;

        if (existingBP) {
          finalBusinessPartnerId = existingBP.id;
          finalBusinessPartnerName = existingBP.razao_social;
          finalBusinessPartnerCity = existingBP.cidade || null;
          finalBusinessPartnerState = existingBP.estado || null;
          finalBusinessPartnerZipCode = existingBP.cep || null;
          finalBusinessPartnerStreet = existingBP.logradouro || null;
          finalBusinessPartnerNeighborhood = existingBP.bairro || null;
          finalBusinessPartnerNumber = existingBP.numero || null;
        }`;

const replacement = `        // Busca se já existe no banco
        const { data: existingBPData } = await supabase!
          .from('business_partners')
          .select('id, razao_social, addresses:business_partner_addresses(city, state, zip_code, street, neighborhood, number)')
          .eq('cpf_cnpj', rawCnpj)
          .eq('organization_id', context?.organizationId || '')
          .maybeSingle();
          
        const existingBP = existingBPData as any;

        if (existingBP) {
          finalBusinessPartnerId = existingBP.id;
          finalBusinessPartnerName = existingBP.razao_social;
          
          const addr = existingBP.addresses && existingBP.addresses.length > 0 ? existingBP.addresses[0] : null;
          finalBusinessPartnerCity = addr?.city || null;
          finalBusinessPartnerState = addr?.state || null;
          finalBusinessPartnerZipCode = addr?.zip_code || null;
          finalBusinessPartnerStreet = addr?.street || null;
          finalBusinessPartnerNeighborhood = addr?.neighborhood || null;
          finalBusinessPartnerNumber = addr?.number || null;
        }`;

if(content.includes(search)) {
    content = content.replace(search, replacement);
    fs.writeFileSync('src/services/sapService.ts', content);
    console.log("Success");
} else {
    console.log("Could not find search string in sapService.ts");
}
