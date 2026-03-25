import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

async function addFloresDaCunha() {
    try {
        console.log("Iniciando cadastro de Flores da Cunha...");
        
        // 1. Obter Estado
        const { data: rs, error: e1 } = await supabase.from('states').select('id').eq('sigla', 'RS').maybeSingle();
        if (e1 || !rs) throw new Error("Estado RS não encontrado " + (e1?.message || ''));

        // 2. Localizar a cidade
        let { data: city, error: e2 } = await supabase.from('cities').select('id')
            .eq('codigo_ibge', '4308201').maybeSingle();
        
        if (!city) {
            console.log("Inserindo cidade Flores da Cunha...");
            const res = await supabase.from('cities').insert({
                state_id: rs.id,
                nome: 'Flores da Cunha',
                codigo_ibge: '4308201',
                ativo: true
            }).select().maybeSingle();
            
            if (res.error) {
                 throw res.error;
            }
            city = res.data;
            console.log("Básico ok. ID nova cidade:", city?.id);
        } else {
            console.log("Flores da Cunha ja existente ID:", city.id);
        }

        // 3. Inserir faixa
        if (city && city.id) {
             const { data: ranges } = await supabase.from('zip_code_ranges').select('id')
                .eq('city_id', city.id)
                .eq('start_zip', '95270000')
                .eq('end_zip', '95274999')
                .maybeSingle();
                
             if (!ranges) {
                 console.log("Inserindo faixas de CEP de Flores da Cunha...");
                 const res3 = await supabase.from('zip_code_ranges').insert({
                     city_id: city.id,
                     start_zip: '95270000',
                     end_zip: '95274999'
                 });
                 if (res3.error) throw res3.error;
                 console.log("Faixa inserida!");
             } else {
                 console.log("Faixa ja existente.");
             }
        }
        
        console.log("Processo concluído com sucesso.");
    } catch (err) {
        console.error("Erro na execucao:", err);
    }
}
addFloresDaCunha();
