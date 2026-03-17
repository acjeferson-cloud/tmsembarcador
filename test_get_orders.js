const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

(async () => {
    // try direct query using service role key
    const {data, error} = await supabase.from('orders').select('id, numero_pedido, serie, codigo_rastreio, data_pedido, destino_cidade, business_partner_id').order('created_at', {ascending: false}).limit(5);
    console.log(JSON.stringify(data, null, 2));
    if (error) console.error(error);
})();
