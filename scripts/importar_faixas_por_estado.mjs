import { createClient } from '@supabase/supabase-js';
import xlsx from 'xlsx';
import * as fs from 'fs';
import 'dotenv/config';

// 1. Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Erro: VITE_SUPABASE_URL e VITE_SUPABASE_SERVICE_ROLE_KEY não configuradas no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false } // Evita avisos de localStorage no node
});

/**
 * Script de Bulk Importação de CEPs por Estado (UF)
 */
async function rodarImportacaoPorEstado() {
  const ufAlvo = process.argv[2]?.toUpperCase();

  if (!ufAlvo || ufAlvo.length !== 2) {
    console.error('\n❌ ERRO: Você precisa informar a sigla do estado (UF).');
    console.log('Exemplo de uso: node scripts/importar_faixas_por_estado.mjs MG\n');
    process.exit(1);
  }

  console.log(`\n🚀 Iniciando Migração de CEPs para o estado: ${ufAlvo}`);
  console.log('Carregando bases locais (Isso pode levar alguns segundos)...');

  // Caminhos absolutos definidos
  const tabelaAPath = 'C:\\desenvolvimento\\tmsembarcador\\temp\\TabelaA.xlsx';
  const tabelaBPath = 'C:\\desenvolvimento\\tmsembarcador\\temp\\TabelaB.xlsx';

  if (!fs.existsSync(tabelaAPath) || !fs.existsSync(tabelaBPath)) {
    console.error('❌ Erro: Arquivos TabelaA.xlsx e TabelaB.xlsx não encontrados em C:\\desenvolvimento\\tmsembarcador\\temp');
    return;
  }

  // Lendo as planilhas
  const workbookA = xlsx.readFile(tabelaAPath);
  const cidadesRaw = xlsx.utils.sheet_to_json(workbookA.Sheets[workbookA.SheetNames[0]]);

  const workbookB = xlsx.readFile(tabelaBPath);
  const faixasCepRaw = xlsx.utils.sheet_to_json(workbookB.Sheets[workbookB.SheetNames[0]]);

  // Filtrar cidades do estado alvo
  const cidadesDoEstado = cidadesRaw.filter((c) => String(c.cid_estcod).trim().toUpperCase() === ufAlvo);

  if (cidadesDoEstado.length === 0) {
    console.error(`❌ O estado ${ufAlvo} não possui cidades cadastradas na Tabela A.`);
    return;
  }

  console.log(`✅ ${cidadesDoEstado.length} cidades de ${ufAlvo} localizadas na Tabela A.`);

  // Preparar dicionário de faixas da Tabela B agrupado por cid_cod para ganhar velocidade
  console.log('Indexando faixas da Tabela B em memória...');
  const faixasPorCidCod = {};
  for (const faixa of faixasCepRaw) {
    if (!faixasPorCidCod[faixa.cid_cod]) faixasPorCidCod[faixa.cid_cod] = [];
    faixasPorCidCod[faixa.cid_cod].push(faixa);
  }

  let insercoesTotais = 0;
  let cidadesAtualizadas = 0;
  let cidadesSemFaixa = 0;
  let cidadesNaoEncontradasBD = 0;

  console.log('\nProcessando carga para o Supabase...');

  // Processo em lotes ou série (para não estourar o limite de conexões/payload da API Rest)
  for (let i = 0; i < cidadesDoEstado.length; i++) {
    const cidadeSrc = cidadesDoEstado[i];
    const cidCod = cidadeSrc.cid_cod;
    const ibgeStr = String(cidadeSrc.cid_codmun).trim();

    // Log a cada 50 processados para acompanhamento
    if (i % 50 === 0 && i > 0) process.stdout.write(`... ${i}/${cidadesDoEstado.length} concluídos.\n`);

    // Busca no DB local (TMS)
    const { data: dbCity } = await supabase
      .from('cities')
      .select('id, nome')
      .eq('codigo_ibge', ibgeStr)
      .single();

    if (!dbCity) {
      cidadesNaoEncontradasBD++;
      continue; // Pulada se não existir na base local
    }

    const faixasDaCidade = faixasPorCidCod[cidCod] || [];

    if (faixasDaCidade.length === 0) {
      cidadesSemFaixa++;
      continue;
    }

    // Deletar anteriores para a cidade
    await supabase.from('zip_code_ranges').delete().eq('city_id', dbCity.id);

    // Preparar novas faixas filtrando valores estranhos
    const novasFaixasPayload = faixasDaCidade.map((faixa) => {
      return {
        city_id: dbCity.id,
        start_zip: String(faixa.cid_cepi).replace(/\D/g, '').padEnd(8, '0'),
        end_zip: String(faixa.cid_cepf).replace(/\D/g, '').padEnd(8, '0'),
        area: `Zona ${faixa.cid_ord || 1}`
      };
    });

    // Inserir
    const { error: insertError } = await supabase.from('zip_code_ranges').insert(novasFaixasPayload);

    if (!insertError) {
      insercoesTotais += novasFaixasPayload.length;
      cidadesAtualizadas++;
    } else {
      console.error(`\nErro ao sincronizar ${dbCity.nome}: ${insertError.message}`);
    }
  }

  console.log(`\n🎉 PROCESSO CONCLUÍDO PARA ${ufAlvo}! 🎉`);
  console.log(`- Cidades atualizadas com sucesso: ${cidadesAtualizadas}`);
  console.log(`- Total de Blocos de CEP criados: ${insercoesTotais}`);
  console.log(`- Cidades ignoradas (sem faixas na Tabela B): ${cidadesSemFaixa}`);
  console.log(`- Cidades ignoradas (não cadastradas no seu TMS): ${cidadesNaoEncontradasBD}`);
}

rodarImportacaoPorEstado().catch(console.error);
