import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Erro: Credenciais do Supabase ausentes no env.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getAllRanges() {
  let allRanges = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;
  
  while(hasMore) {
    const { data, error } = await supabase
      .from('zip_code_ranges')
      .select('id, city_id, start_zip, end_zip')
      .range(page * pageSize, (page + 1) * pageSize - 1);
    
    if (error) throw error;
    if (data.length < pageSize) hasMore = false;
    allRanges.push(...data);
    page++;
  }
  return allRanges;
}

async function main() {
  console.log("Iniciando rotina cirúrgica de expurgo de CEPs genéricos/sobrepostos...");

  try {
    const allRanges = await getAllRanges();
    console.log(`>> Total de faixas na base (antes): ${allRanges.length}`);

    // Parseando CEPs e tamanhos
    const rangesParsed = allRanges.map(r => {
      const start = parseInt(String(r.start_zip).replace(/\D/g, '').padEnd(8, '0'), 10);
      const end = parseInt(String(r.end_zip).replace(/\D/g, '').padEnd(8, '0'), 10);
      return { ...r, start, end, size: end - start };
    }).filter(r => !isNaN(r.start) && !isNaN(r.end));
    
    // Sort by start to find overlaps fast
    rangesParsed.sort((a, b) => a.start - b.start);
    
    const idsToDelete = new Set();
    const overlaps = [];

    // Identificar conflitos
    for (let i = 0; i < rangesParsed.length; i++) {
        // Look ahead for overlaps
        for (let j = i + 1; j < rangesParsed.length; j++) {
            const rangeA = rangesParsed[i];
            const rangeB = rangesParsed[j];

            // If B starts after A ends, no more overlaps for A (since list is sorted by start)
            if (rangeB.start > rangeA.end) {
                break;
            }

            // We have an overlap!
            overlaps.push({ A: rangeA, B: rangeB });
            
            // Decisão lógica do DBA: Regra de Contenção (Containment)
            if (rangeA.start <= rangeB.start && rangeA.end >= rangeB.end) {
                // A contém B (A é Genérica ou Clone Perfeito). Se forem idênticas ou A maior, removemos A.
                // Mas wait! Se destruirmos A, e A for tudo o que B tinha, a gente destrói a mãe. B fica.
                // Mas se A e B forem idênticas, A vai embora e B fica. Perfeito.
                idsToDelete.add(rangeA.id);
            } else if (rangeB.start <= rangeA.start && rangeB.end >= rangeA.end) {
                // B contém A
                idsToDelete.add(rangeB.id);
            } else {
                // Sobreposição parcial (Staggered). Comum quando há erro na faixa dos correios.
                // Vamos remover a maior, que geralmente é a que foi cadastrada com erro de fim.
                if (rangeA.size > rangeB.size) {
                    idsToDelete.add(rangeA.id);
                } else if (rangeB.size > rangeA.size) {
                    idsToDelete.add(rangeB.id);
                } else {
                    idsToDelete.add(rangeB.id); // Iguais e cruzadas, matar uma
                }
            }
        }
    }

    console.log(`>> Overlaps escaneados: ${overlaps.length} (Muitos podem apontar para a mesma Faixa Fantasma Pai)`);
    console.log(`>> Total Único de Faixas ("Fantasmas" ou duplicadas) marcadas para CADEIRA ELÉTRICA: ${idsToDelete.size}`);

    if (idsToDelete.size === 0) {
      console.log("Nenhuma sobreposição encontrada na base de dados! Banco íntegro.");
      return;
    }

    // Exclusão em Lote (Batch Delete)
    const arrayIdsToDelete = Array.from(idsToDelete);
    console.log(`\nIniciando DELETE Lote pelo Cliente Supabase... (Processando ${arrayIdsToDelete.length} registros)`);
    
    // Deleta em pedaços de 500 para não estourar a URL limits do PostgREST
    const CHUNK_SIZE = 500;
    let deletedCount = 0;

    for (let i = 0; i < arrayIdsToDelete.length; i += CHUNK_SIZE) {
        const chunk = arrayIdsToDelete.slice(i, i + CHUNK_SIZE);
        const { data, error } = await supabase
          .from('zip_code_ranges')
          .delete()
          .in('id', chunk);

        if (error) {
            console.error(`Erro ao deletar lote ${i}:`, error.message);
        } else {
            deletedCount += chunk.length;
            console.log(`  Excluídos com sucesso: ${deletedCount} / ${arrayIdsToDelete.length}`);
        }
    }

    console.log(`\n================================`);
    console.log(`Limpeza Concluída! Total apagado: ${deletedCount}`);
    console.log(`================================\n`);

    // VALIDAÇÃO FINAL (Verificar Pós Limpeza)
    console.log("Iniciando Verificação Final de Segurança...");
    const postRanges = await getAllRanges();
    const postParsed = postRanges.map(r => {
        return {
            ...r,
            start: parseInt(String(r.start_zip).replace(/\D/g, '').padEnd(8, '0'), 10),
            end: parseInt(String(r.end_zip).replace(/\D/g, '').padEnd(8, '0'), 10)
        };
    }).filter(r => !isNaN(r.start) && !isNaN(r.end)).sort((a, b) => a.start - b.start);

    let remainingOverlaps = 0;
    for (let i = 0; i < postParsed.length; i++) {
        for (let j = i + 1; j < postParsed.length; j++) {
            if (postParsed[j].start <= postParsed[i].end) {
                remainingOverlaps++;
            } else {
                break;
            }
        }
    }
    
    console.log(`>> Total de faixas na base (agora): ${postRanges.length}`);
    console.log(`>> Quantidade de sobreposições sobrantes: ${remainingOverlaps}`);
    if (remainingOverlaps === 0) {
        console.log("A base de CEPs agora está 100% íntegra. Sem conflitos de roteamento.");
    } else {
        console.warn("ALERTA: Ainda restam sobreposições. Pode haver faixas complexas corrompidas.");
    }

  } catch (err) {
    console.error("CRITICAL ERROR NO SCRIPT:", err);
  }
}

main().catch(console.error);
