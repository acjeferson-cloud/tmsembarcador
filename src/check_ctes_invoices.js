import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkCTesInvoices() {
    const cteId = '12345678-1234-1234-1234-123456789012'; // Fake
    const res = await supabase.from('ctes_invoices').insert({
        organization_id: 'a7c49619-53f0-4401-9b17-2a830dd4da40',
        environment_id: 'b0d1aa42-38bb-4a33-8e51-0c6a0a390fd1',
        cte_id: 'd7387c25-c637-4e66-88e3-6e5c999030b2', // random uuid
        number: '42260482981721000194550020009826351490722713'
    });
    console.log("Insert Test Error:", res.error);
    
    // Another theory: cte is inserted but the CTE is already in DB? Yes, but they deleted it.
}

checkCTesInvoices();
