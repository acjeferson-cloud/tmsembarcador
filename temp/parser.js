import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

// ======== CONFIGURAÇÃO DO USUÁRIO ========
const TRANSPORTADOR_CODIGO = '0001';
const TABELA_NOME = 'Tabela de frete (0001 - Kamer)';

// Mapeamento DE "Nome da Tarifa no PDF" PARA "Código da Tarifa no TMS"
// O cliente deve preencher o lado direito com o código real criado no TMS (ex: TAR0001)
const TARIFF_MAPPING = {
  'AC':   'TAR0001',
  'AC 1': 'TAR0002',
  'AC 2': 'TAR0003',
  'BA':   'TAR0004',
  'BA 1': 'TAR0005',
  'BA 2': 'TAR0006',
  'DF02': 'TAR0007',
  'DF01': 'TAR0008',
  'GO':   'TAR0009',
  'GOII': 'TAR0010',
  'MG 1': 'TAR0011',
  'MG':   'TAR0012',
  'GOIP': 'TAR0013',
  'MG 2': 'TAR0014',
  'PA 1': 'TAR0015',
  'PA':   'TAR0016',
  'RO 1': 'TAR0017',
  'RO':   'TAR0018',
  'PA 2': 'TAR0019',
  'TO 1': 'TAR0020',
  'TO':   'TAR0021'
};
// =========================================

async function run() {
  const text = fs.readFileSync('KAMER.txt', 'utf-8');
  const lines = text.split('\n');

  let currentTarifa = '';
  let currentPrazo = 0;
  
  const results = [];
  const notFound = [];

  console.log('Buscando cidades no banco de dados...');
  let allCities = [];
  let hasMore = true;
  let page = 0;
  const pageSize = 1000;

  while(hasMore) {
    const { data: dbCities, error } = await supabase.from('cities')
      .select('codigo_ibge, nome, state_id, states(sigla)')
      .range(page * pageSize, (page + 1) * pageSize - 1);
    
    if (error) {
      console.error('Erro ao buscar cidades:', error);
      return;
    }

    if (dbCities && dbCities.length > 0) {
      allCities = allCities.concat(dbCities);
      page++;
    } else {
      hasMore = false;
    }
  }
  
  const dbCities = allCities;
  console.log(`Carregadas ${dbCities.length} cidades do banco.`);

  const normalize = (str) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    const tarifaMatch = line.match(/Tarifa:\s+(.*?)\s{2,}.*Prazo:\s+(\d+)/);
    if (tarifaMatch) {
      currentTarifa = tarifaMatch[1].trim();
      currentPrazo = parseInt(tarifaMatch[2].trim(), 10);
      continue;
    }

    const cityMatch = line.match(/^(\d+)\s+(.+?)\s+[M|D]\s+([A-Z]{2})\s+(\d+)$/);
    if (cityMatch) {
      const cityId = cityMatch[1];
      let cityName = cityMatch[2].trim();
      const stateUF = cityMatch[3];
      const extraPrazo = parseInt(cityMatch[4].trim(), 10);
      
      const totalPrazo = currentPrazo + extraPrazo;
      
      // Mapeamento da Tarifa
      const tarifaCodigoTms = TARIFF_MAPPING[currentTarifa] || `SEM_MAPEAMENTO_${currentTarifa}`;

      // Find in DB
      const searchName = normalize(cityName);
      const matchedCity = dbCities.find(c => 
        normalize(c.nome) === searchName && 
        c.states && 
        c.states.sigla === stateUF
      );

      if (matchedCity) {
        results.push({
          transportador_codigo: TRANSPORTADOR_CODIGO,
          tabela_nome: TABELA_NOME,
          validade_inicio: '01/03/2022',
          validade_fim: '31/12/2099',
          tarifa_codigo: tarifaCodigoTms,
          cidade_ibge: matchedCity.codigo_ibge,
          prazo_entrega_dias: totalPrazo,
          _cidade_nome: cityName,
          _uf: stateUF,
          _tarifa_original: currentTarifa
        });
      } else {
        notFound.push(`${cityName} - ${stateUF}`);
      }
    }
  }

  console.log(`Mapeadas ${results.length} cidades com sucesso.`);
  
  // Verifica se há tarifas sem mapeamento
  const missingMappings = [...new Set(results.filter(r => r.tarifa_codigo.startsWith('SEM_MAPEAMENTO')).map(r => r._tarifa_original))];
  if (missingMappings.length > 0) {
    console.warn(`\nATENÇÃO: Existem tarifas no PDF que não estão no TARIFF_MAPPING! Adicione: ${missingMappings.join(', ')}\n`);
  }

  // Gerar CSV padrão do sistema
  let csv = 'transportador_codigo,tabela_nome,validade_inicio,validade_fim,tarifa_codigo,cidade_ibge,prazo_entrega_dias\n';
  results.forEach(r => {
    csv += `${r.transportador_codigo},${r.tabela_nome},${r.validade_inicio},${r.validade_fim},${r.tarifa_codigo},${r.cidade_ibge},${r.prazo_entrega_dias}\n`;
  });

  fs.writeFileSync('Template_Cidades_Kamer_Final.csv', csv);
  console.log('Arquivo final pronto: temp/Template_Cidades_Kamer_Final.csv');
}

run();
