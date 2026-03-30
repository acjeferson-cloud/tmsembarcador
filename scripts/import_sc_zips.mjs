import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Faixas de CEP de SC para teste (dados reais do e-DNE)
const SC_CITIES_RANGES = {
  'Joinville': { start: '89200000', end: '89239999' },
  'Florianópolis': { start: '88000000', end: '88099999' },
  'São José': { start: '88100000', end: '88139999' },
  'Palhoça': { start: '88130000', end: '88139999' },
  'Blumenau': { start: '89000000', end: '89099999' },
  'Itajaí': { start: '88300000', end: '88319999' },
  'Navegantes': { start: '88370000', end: '88379999' },
  'Balneário Camboriú': { start: '88330000', end: '88339999' },
  'Chapecó': { start: '89800000', end: '89816999' },
  'Criciúma': { start: '88800000', end: '88819999' },
  'Tubarão': { start: '88700000', end: '88709999' },
  'Lages': { start: '88500000', end: '88549999' },
  'Abdon Batista': { start: '89636000', end: '89636999' },
  'Irineópolis': { start: '89440000', end: '89444999' }
};

async function run() {
  console.log('1. Autenticando com usuário de sistema...');
  const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@primeirocliente.com',
    password: 'Demo123!'
  });

  if (authError || !auth.user) {
    console.error("Falha ao autenticar:", authError?.message);
    return;
  }
  
  console.log('Autenticação bem sucedida. Token obtido.');

  console.log('\n2. Buscando o ID do estado de Santa Catarina (SC)...');
  const { data: scData, error: scError } = await supabase
    .from('states')
    .select('id')
    .eq('sigla', 'SC')
    .single();

  if (scError || !scData) {
    console.error("Estado de SC não encontrado!", scError);
    return;
  }
  const scStateId = scData.id;

  console.log('\n3. Apagando TODAS as faixas de CEPs viciadas do banco (Truncate/Delete logic)...');
  // Usamos um filtro de negação lógica para fazer um "DELETE ALL" tolerado pela API do Supabase
  const { error: delError } = await supabase
    .from('zip_code_ranges')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (delError) {
    console.error("Erro ao apagar faixas:", delError.message);
    return;
  }
  console.log('✅ TODAS as faixas foram removidas com sucesso (Tabela Resetada).');

  console.log('\n4. Buscando as cidades alvo de SC cadastradas...');
  const cityNames = Object.keys(SC_CITIES_RANGES);
  
  const { data: cities, error: citiesError } = await supabase
    .from('cities')
    .select('id, nome')
    .eq('state_id', scStateId)
    .in('nome', cityNames);

  if (citiesError || !cities) {
    console.error("Erro ao consultar cidades:", citiesError);
    return;
  }
  
  console.log(`Encontradas ${cities.length} cidades de SC mapeadas.`);

  console.log('\n5. Inserindo as faixas de CEP reais (e-DNE)...');
  const insertPayload = [];
  
  for (const city of cities) {
    const range = SC_CITIES_RANGES[city.nome];
    if (range) {
      insertPayload.push({
        city_id: city.id,
        start_zip: range.start,
        end_zip: range.end
      });
    }
  }

  if (insertPayload.length > 0) {
    const { error: insertError } = await supabase
      .from('zip_code_ranges')
      .insert(insertPayload);
      
    if (insertError) {
      console.error("Erro na inserção das faixas importadas:", insertError.message);
      return;
    }
    console.log(`✅ Inseridas ${insertPayload.length} faixas de CEP com sucesso para SC!`);
  } else {
    console.log("Nenhuma faixa calculada para inserção.");
  }
  
  console.log('\nProcesso Finalizado! Tabela higienizada e CEPs reais inseridos.');
}

run();
