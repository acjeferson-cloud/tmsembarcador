import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testRankingDashboard() {
  const estabelecimentoId = '518f849d-d24c-420c-bc1f-38fdf957d21a'; // Environment ID do Cliente
  const periodoInicio = '2026-01-01T00:00:00.000Z'; // Data base do filtro
  const periodoFim = '2026-12-31T23:59:59.000Z';

  console.log(`Buscando NP para o estabelecimentoUUID ou EnvironmentUUID: ${estabelecimentoId}`);

  try {
    const { data: rawData, error } = await supabase
      .from('nps_pesquisas_cliente')
      .select(`
        transportador_id,
        nota,
        status,
        data_resposta,
        data_envio,
        transportador:carriers(razao_social)
      `)
      .or(`environment_id.eq.${estabelecimentoId},establishment_id.eq.${estabelecimentoId}`)
      .in('status', ['respondida', 'pendente'])
      .or(`data_resposta.gte.${periodoInicio},data_envio.gte.${periodoInicio}`)
      .or(`data_resposta.lte.${periodoFim},data_envio.lte.${periodoFim}`);

    if (error) throw error;
    
    console.log(`🔍 Brut data retornada:`, JSON.stringify(rawData, null, 2));

    const grouped = rawData.reduce((acc: any, item: any) => {
      const tid = item.transportador_id;
      if (!acc[tid]) {
        acc[tid] = {
          transportador_id: tid,
          razao_social: item.transportador?.razao_social || (tid ? 'Desconhecido' : 'Geral (S/ Transportadora)'),
          promotores: 0,
          neutros: 0,
          detratores: 0,
          total: 0,
        };
      }
      acc[tid].total++;
      if (item.nota >= 9) acc[tid].promotores++;
      else if (item.nota >= 7) acc[tid].neutros++;
      else acc[tid].detratores++;
      return acc;
    }, {});

    const rankingFinal = Object.values(grouped).map((item: any) => ({
      transportador_id: item.transportador_id,
      razao_social: item.razao_social,
      nps: item.total > 0
        ? ((item.promotores - item.detratores) / item.total) * 100
        : 0,
      total_respostas: item.total,
    })).sort((a: any, b: any) => b.nps - a.nps);

    console.log(`\n🏆 Ranking Processado para a Tela:`, JSON.stringify(rankingFinal, null, 2));
    
  } catch (error) {
    console.error('Falhou catastróficamente:', error);
  }
}

testRankingDashboard();
