import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDb() {
  const cleanZip = '70673425';
  const { data: detailedRanges, error: detailError } = await supabase
      .from('zip_code_ranges')
      .select(`
        *,
        cities:city_id (
          *,
          states:state_id (
            id,
            nome,
            sigla,
            regiao
          )
        )
      `)
      .lte('start_zip', cleanZip)
      .gte('end_zip', cleanZip);

  if (detailError || !detailedRanges || detailedRanges.length === 0) {
    console.log('Not found');
    return null;
  }

  // Priorizar a faixa mais específica (menor diferença entre end_zip e start_zip)
  detailedRanges.sort((a, b) => {
    const diffA = parseInt(a.end_zip) - parseInt(a.start_zip);
    const diffB = parseInt(b.end_zip) - parseInt(b.start_zip);
    return diffA - diffB;
  });

  const detailedRange = detailedRanges[0];
  console.log('Selected City:', detailedRange.cities.nome);
}

checkDb();
