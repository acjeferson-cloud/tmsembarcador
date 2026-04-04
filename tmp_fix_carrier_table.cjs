const fs = require('fs');
let content = fs.readFileSync('src/services/sapService.ts', 'utf8');

const search = `        if (rawCarrierCnpj) {
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
          } catch (e) {`;

const replacement = `        if (rawCarrierCnpj) {
          try {
            const { data: existingCarrierData } = await supabase!
              .from('carriers')
              .select('id')
              .eq('documento', rawCarrierCnpj)
              .eq('organization_id', context?.organizationId || '')
              .maybeSingle();

            if (existingCarrierData) {
              finalCarrierId = (existingCarrierData as any).id;
            }
          } catch (e) {`;

if (content.includes(search)) {
    content = content.replace(search, replacement);
    fs.writeFileSync('src/services/sapService.ts', content);
    console.log("Success replacing Carrier");
} else {
    console.log("Could not find Carrier search string in sapService.ts");
}
