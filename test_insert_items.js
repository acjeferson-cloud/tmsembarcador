import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

(async () => {
    // Attempt insert to verify schema 
    // using anon key with invalid ID just to see schema error vs permission error
    const { data, error } = await supabase.from('order_items').insert({
        order_id: '11111111-1111-1111-1111-111111111111',
        organization_id: '11111111-1111-1111-1111-111111111111',
        environment_id: '11111111-1111-1111-1111-111111111111',
        produto_descricao: 'Teste',
        quantidade: 1,
        valor_unitario: 1,
        valor_total: 1,
        peso: 1,
        volume: 1,
        cubagem: 1
    });
    console.log('Error:', error);
})();
