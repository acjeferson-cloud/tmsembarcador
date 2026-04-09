const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function injectRealData() {
  console.log('Buscando NFs reais para transformação...');
  
  // Pegar algumas notas recentes válidas (que existam na base do usuário)
  const { data: invoices, error } = await supabase
    .from('invoices_nfe')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error || !invoices || invoices.length === 0) {
    console.error('Falha ou Nenhuma Nota encontrada', error);
    return;
  }

  console.log(`Encontradas ${invoices.length} NFs. Injetando SLA e Coordenadas...`);

  // SP Base Coordinates
  const baseLat = -23.5505;
  const baseLng = -46.6333;

  for (let i = 0; i < invoices.length; i++) {
    const inv = invoices[i];
    
    const randomLat = baseLat + (Math.random() * 0.1 - 0.05);
    const randomLng = baseLng + (Math.random() * 0.1 - 0.05);
    
    let situacao = 'em_transito';
    let delayed = false;
    let expectedDate = new Date();
    
    // Configurar cenários
    if (i % 3 === 0) {
      situacao = 'entregue'; // Green
      expectedDate.setDate(expectedDate.getDate() + 2);
    } else if (i % 3 === 1) {
      situacao = 'em_transito'; // Red (Blinking) because delayed = true
      expectedDate.setDate(expectedDate.getDate() - 2); // Passou do prazo
      delayed = true;
    } else {
      situacao = 'saiu_entrega'; // Yellow
      expectedDate.setDate(expectedDate.getDate() + 5);
    }
    
    const existingMeta = inv.metadata || {};
    const newMeta = {
      ...existingMeta,
      dest_lat: randomLat,
      dest_lng: randomLng,
      is_delayed_mock: delayed
    };

    console.log(`Atualizando NF ${inv.numero} (${inv.destinatario_nome}) -> ${situacao}`);

    const { error: updErr } = await supabase
      .from('invoices_nfe')
      .update({ 
        situacao: situacao, 
        delivery_forecast_date: expectedDate.toISOString(),
        metadata: newMeta
      })
      .eq('id', inv.id);

    if (updErr) console.error('Erro ao atualizar NF', inv.numero, updErr);
  }
  
  console.log('Update concluído com sucesso nas NFs Reais do tenant.');
}

injectRealData();
