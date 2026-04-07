const fs = require('fs');

let content = fs.readFileSync('c:\\\\desenvolvimento\\\\tmsembarcador\\\\src\\\\services\\\\pickupsService.ts', 'utf-8');

const targetStr = "const { data: lastPickup } = await (supabase as any).from('pickups').select('numero_coleta').order('created_at', { ascending: false }).limit(1);";

const replacementStr = `let query = (supabase as any).from('pickups').select('numero_coleta');
      if (ctx?.organizationId) query = query.eq('organization_id', ctx.organizationId);
      if (ctx?.environmentId) query = query.eq('environment_id', ctx.environmentId);
      if (establishmentId) query = query.eq('establishment_id', establishmentId);
      const { data: lastPickup } = await query.order('created_at', { ascending: false }).limit(1);`;

const newContent = content.split(targetStr).join(replacementStr);

fs.writeFileSync('c:\\\\desenvolvimento\\\\tmsembarcador\\\\src\\\\services\\\\pickupsService.ts', newContent);
console.log("Substituidas " + (content.split(targetStr).length - 1) + " ocorrencias.");
