import { createClient } from '@supabase/supabase-js';
import xlsx from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

// 1. Configuração de conexão com o Supabase (garanta que as envs estão presentes)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Erro: VITE_SUPABASE_URL e VITE_SUPABASE_SERVICE_ROLE_KEY não configuradas no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Script de Demonstração e Validação para Importação de Faixas de CEP
 * Especialista TMS (POC - Prova de Conceito)
 * Teste restrito para a cidade: Caxias do Sul/RS (cid_cod: 7566, IBGE: 4305108)
 */
async function rodarTesteImportacao() {
  console.log('Iniciando o Job de Sincronização de Municípios e CEP (Teste para Caxias do Sul)...');

  // Caminhos absolutos para os arquivos do TMS
  const tabelaAPath = 'C:\\desenvolvimento\\tmsembarcador\\temp\\TabelaA.xlsx';
  const tabelaBPath = 'C:\\desenvolvimento\\tmsembarcador\\temp\\TabelaB.xlsx';

  if (!fs.existsSync(tabelaAPath) || !fs.existsSync(tabelaBPath)) {
    console.error('Erro: Arquivos TabelaA.xlsx e TabelaB.xlsx não encontrados na pasta temp.');
    return;
  }

  // 2. Lendo Tabela_A: Cadastro de Cidades
  const workbookA = xlsx.readFile(tabelaAPath);
  const sheetA = workbookA.Sheets[workbookA.SheetNames[0]];
  const cidadesRaw = xlsx.utils.sheet_to_json(sheetA);

  // 3. Lendo Tabela_B: Faixas de CEP
  const workbookB = xlsx.readFile(tabelaBPath);
  const sheetB = workbookB.Sheets[workbookB.SheetNames[0]];
  const faixasCepRaw = xlsx.utils.sheet_to_json(sheetB);

  // 4. Parâmetros restritos para este teste validatório
  const TARGET_CID_COD = 7566; // ID interno na Tabela A/B
  const TARGET_IBGE = '4305108'; // IBGE real que será o elo com nosso BD do Supabase

  // 5. Passo 1: O "Select" na Tabela A (Em memória) baseada na regra do teste
  const cidadeSourced = cidadesRaw.find((c) => 
    c.cid_cod === TARGET_CID_COD && String(c.cid_codmun).trim() === TARGET_IBGE
  );

  if (!cidadeSourced) {
    console.error(`Falha: A cidade base com cid_cod ${TARGET_CID_COD} não foi encontrada na Tabela A.`);
    return;
  }
  
  console.log(`\n[1/4] Sucesso: Município Encontrado na Tabela A: ${cidadeSourced.cid_des} (${cidadeSourced.cid_estcod})`);

  // 6. Passo 2: Localizar a UUID do nosso município no TMS validando pelo IBGE
  // Como especialista em arquitetura: Não usamos o cid_cod no TMS (ele é da origem). Usamos o IBGE que é chave universal!
  const { data: dbCity, error: dbError } = await supabase
    .from('cities')
    .select('id, nome, codigo_ibge')
    .eq('codigo_ibge', TARGET_IBGE)
    .single();

  if (dbError || !dbCity) {
    console.error(`Erro: Não foi possível localizar a cidade com IBGE ${TARGET_IBGE} no banco do Supabase.`);
    return;
  }

  console.log(`[2/4] Junção Validada (TMS x Origem): Localizada em nosso banco ID interno: ${dbCity.id} -> ${dbCity.nome}`);

  // 7. Passo 3: Join em Memória -> Trazer as faixas da Tabela B (1 para N)
  const faixasDaCidade = faixasCepRaw.filter((f) => f.cid_cod === TARGET_CID_COD);

  if (faixasDaCidade.length === 0) {
    console.warn(`[3/4] Alerta: Não existem faixas de CEP mapeadas para ${dbCity.nome} na Tabela B.`);
    return;
  }

  console.log(`[3/4] Relação (1 -> N) carregada: Foram encontradas ${faixasDaCidade.length} faixas de CEP de Caxias do Sul.`);

  // 8. Passo 4: Estratégia de "UPSERT" / Refresh na base de dados
  // Melhor prática p/ 1xN com dados estáticos: Deletar registros velhos e realizar o Insert em Lote (Batch/Bulk Insert)
  // Isso impede duplicação (poluição de banco) caso as faixas originais mudem.
  console.log(`[4/4] Limpando faixas legadas e cadastrando as novas...`);
  
  const { error: deleteError } = await supabase
    .from('zip_code_ranges')
    .delete()
    .eq('city_id', dbCity.id);

  if (deleteError) {
    console.error('Erro ao limpar faixas anteriores:', deleteError);
  }

  // Montando payload consolidado de todas as faixas (cid_ord e de cepi a cepf)
  const novasFaixasPayload = faixasDaCidade.map((faixa) => {
    // Normalização (garantir formato texto de 8 dígitos limpo ex: '95000000')
    const startZip = String(faixa.cid_cepi).replace(/\D/g, '').padEnd(8, '0');
    const endZip = String(faixa.cid_cepf).replace(/\D/g, '').padEnd(8, '0');

    return {
      city_id: dbCity.id,
      start_zip: startZip,
      end_zip: endZip,
      // Usaremos neighborhood ou area para salvar info sobre a ordem original, se for útil.
      area: `Zona ${faixa.cid_ord || 1}`
    };
  });

  const { data: insertResult, error: insertError } = await supabase
    .from('zip_code_ranges')
    .insert(novasFaixasPayload)
    .select();

  if (insertError) {
    console.error(`Falha no Cadastro:`, insertError.message);
  } else {
    console.log(`\n🎉 Teste Validado com Sucesso!`);
    console.log(`${insertResult.length} blocos de CEP foram sincronizados com sucesso e persistidos na base TMS para ${dbCity.nome}.`);
    console.log(`Amostra inserida no DB:`, insertResult[0]);
  }
}

rodarTesteImportacao().catch(console.error);
