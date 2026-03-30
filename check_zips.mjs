import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient('https://wthpdsbvfrnrzupvhquo.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0aHBkc2J2ZnJucnp1cHZocXVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1OTExOTQsImV4cCI6MjA4NzE2NzE5NH0.RQUTEmVwDPG-tooKDhFk_D6chG4AYq7OgKCB7_iu820');

async function getAllItems(table, cols = '*') {
  let allData = [];
  let step = 1000;
  let from = 0;
  while (true) {
    const { data, error } = await supabase.from(table).select(cols).range(from, from + step - 1);
    if (error) { console.error('Error fetching', table, error); break; }
    if (!data || data.length === 0) break;
    allData = allData.concat(data);
    if (data.length < step) break;
    from += step;
  }
  return allData;
}

function cleanZip(zip) {
  if (!zip) return 0;
  return parseInt(zip.replace(/\D/g, ''), 10);
}

function formatZip(zipInt) {
  let str = zipInt.toString().padStart(8, '0');
  return `${str.substring(0, 5)}-${str.substring(5)}`;
}

async function check() {
  const cities = await getAllItems('cities', 'id, nome, state_id');
  const states = await getAllItems('states', 'id, sigla');
  const ranges = await getAllItems('zip_code_ranges', 'id, city_id, start_zip, end_zip');
  
  const stateMap = {};
  states.forEach(s => stateMap[s.id] = s.sigla);
  
  const cityMap = {};
  cities.forEach(c => cityMap[c.id] = { nome: c.nome, uf: stateMap[c.state_id] || '??' });

  const validRanges = [];
  
  for (const r of ranges) {
    if (r.start_zip && r.end_zip) {
      const city = cityMap[r.city_id] || { nome: 'Desconhecida', uf: '??' };
      validRanges.push({
        cityId: r.city_id,
        cityName: city.nome,
        state: city.uf,
        start: cleanZip(r.start_zip),
        end: cleanZip(r.end_zip)
      });
    }
  }

  // filter valid
  const filtered = validRanges.filter(r => r.start > 0 && r.end > 0 && r.end >= r.start);
  
  const identicalRanges = {};
  for (const r of filtered) {
    const key = `${formatZip(r.start)} até ${formatZip(r.end)}`;
    if (!identicalRanges[key]) identicalRanges[key] = [];
    identicalRanges[key].push(`${r.cityName}/${r.state}`);
  }
  
  const stream = fs.createWriteStream('conflicts_report.txt');
  stream.write(`=== RELATÓRIO DE FAIXAS DE CEP CONFLITANTES ===\n\n`);
  
  stream.write(`1. CIDADES COM FAIXAS EXATAMENTE IGUAIS:\n`);
  stream.write(`-------------------------------------------------\n`);
  for (const key in identicalRanges) {
    const arr = [...new Set(identicalRanges[key])].sort();
    if (arr.length > 1) {
      stream.write(`Faixa: ${key}\nCidades afetadas (${arr.length}):\n${arr.join(', ')}\n\n`);
    }
  }
  
  stream.write(`\n2. FAIXAS QUE SE SOBREPÕEM PARCIALMENTE:\n`);
  stream.write(`-------------------------------------------------\n`);
  
  // Overlap detection
  // To avoid explosion, only output the first 100 overlaps
  let overlapCount = 0;
  for (let i = 0; i < filtered.length; i++) {
    for (let j = i + 1; j < filtered.length; j++) {
      const a = filtered[i];
      const b = filtered[j];
      
      if (a.cityId !== b.cityId) {
        if (a.start <= b.end && b.start <= a.end) {
          if (a.start !== b.start || a.end !== b.end) {
             stream.write(`- Overlap: ${a.cityName}/${a.state} [${formatZip(a.start)} - ${formatZip(a.end)}] CRUZA COM ${b.cityName}/${b.state} [${formatZip(b.start)} - ${formatZip(b.end)}]\n`);
             overlapCount++;
             if (overlapCount >= 1000) break;
          }
        }
      }
    }
    if (overlapCount >= 1000) break;
  }
  
  if (overlapCount >= 1000) {
     stream.write(`\n... Limite de 1000 cruzamentos parciais atingido, truncando exibição.\n`);
  }
  
  stream.end();
  console.log(`Verificação concluída. Report gerado em conflicts_report.txt`);
}

check();
