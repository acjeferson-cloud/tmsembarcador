const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function injectRealData() {
  console.log('Buscando as 10 NFs recentes para extrair Cidades do XML...');
  
  const { data: invoices, error } = await supabase
    .from('invoices_nfe')
    .select('id, numero, destinatario_nome, xml_content, metadata')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error || !invoices || invoices.length === 0) {
    console.error('Falha ao buscar NFs', error);
    return;
  }

  for (let i = 0; i < invoices.length; i++) {
    const inv = invoices[i];
    
    // Parse Destinatário Address from XML using Regex
    let city = 'São Paulo'; // Fallback
    let uf = 'SP';
    
    if (inv.xml_content) {
       const xMunMatch = inv.xml_content.match(/<dest>.*?<xMun>(.*?)<\/xMun>/);
       const ufMatch = inv.xml_content.match(/<dest>.*?<UF>(.*?)<\/UF>/);
       
       if (xMunMatch && xMunMatch[1]) city = xMunMatch[1];
       if (ufMatch && ufMatch[1]) uf = ufMatch[1];
    }
    
    console.log(`[NF ${inv.numero}] Buscando coordenadas reais para: ${city} - ${uf}`);
    
    let lat = -23.5505;
    let lng = -46.6333;
    
    try {
        const query = encodeURIComponent(`${city}, ${uf}, Brazil`);
        const resp = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`, {
          headers: { 'User-Agent': 'TMSEmbarcador/1.0' }
        });
        const geodata = await resp.json();
        
        if (geodata && geodata.length > 0) {
            lat = parseFloat(geodata[0].lat);
            lng = parseFloat(geodata[0].lon);
            console.log(`[NF ${inv.numero}] Sucesso! Lat/Lng: ${lat}, ${lng}`);
        } else {
            console.log(`[NF ${inv.numero}] Geocoding falhou, usando fallback SP.`);
        }
    } catch (e) {
        console.error(`[NF ${inv.numero}] Erro no Geocoding`, e.message);
    }

    // Atrasar request pra não tomar block do Nominatim
    await new Promise(r => setTimeout(r, 1500));

    // Determinar Status Fake de SLA para a tela
    let situacao = 'em_transito';
    let delayed = false;
    let expectedDate = new Date();
    
    if (i % 3 === 0) {
      situacao = 'entregue';
      expectedDate.setDate(expectedDate.getDate() + 2);
    } else if (i % 3 === 1) {
      situacao = 'em_transito';
      expectedDate.setDate(expectedDate.getDate() - 2); 
      delayed = true;
    } else {
      situacao = 'saiu_entrega';
      expectedDate.setDate(expectedDate.getDate() + 5);
    }
    
    const existingMeta = inv.metadata || {};
    const newMeta = {
      ...existingMeta,
      dest_lat: lat,
      dest_lng: lng,
      is_delayed_mock: delayed
    };

    const { error: updErr } = await supabase
      .from('invoices_nfe')
      .update({ 
        situacao: situacao, 
        delivery_forecast_date: expectedDate.toISOString(),
        metadata: newMeta
      })
      .eq('id', inv.id);

    if (updErr) console.error('Erro ao atualizar DB', inv.numero, updErr);
  }
  
  console.log('Update de coordenadas verdadeiras concluído!');
}

injectRealData();
