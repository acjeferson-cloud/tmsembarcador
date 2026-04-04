const fs = require('fs');
let content = fs.readFileSync('src/services/sapService.ts', 'utf8');

const search = `            const { data: existingCarrierData } = await supabase!
              .from('carriers')
              .select('id')
              .eq('cpf_cnpj', rawCarrierCnpj)
              .eq('organization_id', context?.organizationId || '')
              .maybeSingle();`;

const replacement = `            const { data: existingCarrierData } = await supabase!
              .from('carriers')
              .select('id')
              .eq('cnpj', rawCarrierCnpj)
              .eq('organization_id', context?.organizationId || '')
              .eq('environment_id', context?.environmentId || '')
              .maybeSingle();`;

if (content.includes(search)) {
    content = content.replace(search, replacement);
    fs.writeFileSync('src/services/sapService.ts', content);
    console.log("Success replacing carriers query");
} else {
    console.log("Failed to find query string in sapService.ts");
}
