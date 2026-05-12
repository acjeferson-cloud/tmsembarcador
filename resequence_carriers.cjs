const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  console.log("Iniciando reordenação de códigos de transportadores...");

  // Busca todos os transportadores, agrupados por tenant e ordenados por código
  const { data: carriers, error: fetchError } = await supabase
    .from('carriers')
    .select('id, codigo, razao_social, organization_id')
    .order('organization_id', { ascending: true }) 
    .order('codigo', { ascending: true });

  if (fetchError) {
    console.error("Erro ao buscar transportadores:", fetchError);
    return;
  }

  if (!carriers || carriers.length === 0) {
    console.log("Nenhum transportador encontrado.");
    return;
  }

  // Agrupar por organization_id para garantir que a sequência comece de 0001 para cada empresa (tenant)
  const carriersByOrg = {};
  for (const c of carriers) {
    if (!carriersByOrg[c.organization_id]) {
      carriersByOrg[c.organization_id] = [];
    }
    carriersByOrg[c.organization_id].push(c);
  }

  let totalAtualizados = 0;

  for (const [orgId, orgCarriers] of Object.entries(carriersByOrg)) {
    console.log(`\nProcessando Organização: ${orgId}`);
    
    // Sort array safely by parsing code as number (though SQL did it, good to ensure string pad logic)
    orgCarriers.sort((a, b) => parseInt(a.codigo || 0) - parseInt(b.codigo || 0));

    for (let i = 0; i < orgCarriers.length; i++) {
      const carrier = orgCarriers[i];
      const novoCodigo = String(i + 1).padStart(4, '0');

      if (carrier.codigo !== novoCodigo) {
        console.log(`  -> Alterando ${carrier.razao_social}: De [${carrier.codigo}] Para [${novoCodigo}]`);
        
        const { error: updateError } = await supabase
          .from('carriers')
          .update({ codigo: novoCodigo })
          .eq('id', carrier.id);

        if (updateError) {
          console.error(`     Erro ao atualizar ${carrier.id}:`, updateError.message);
        } else {
          totalAtualizados++;
        }
      } else {
        console.log(`  -> Mantido ${carrier.razao_social}: [${novoCodigo}]`);
      }
    }
  }

  console.log(`\nOperação concluída com sucesso! Total de transportadores atualizados: ${totalAtualizados}`);
}

run();
