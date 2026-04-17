const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
(async () => {
    const { data } = await supabase.from('establishments').select('codigo, razao_social, logo_url, metadata');
    if (data && data.length > 0) {
        console.log(`Company: ${data[0].razao_social}`);
        console.log(`Logo URL: ${data[0].logo_url}`);
        if(data[0].metadata) {
            console.log(`Metadata Logo: ${data[0].metadata.logo_light_base64 ? data[0].metadata.logo_light_base64.substring(0,50) + "..." : "none"}`);
            console.log(`Metadata Logo URL: ${data[0].metadata.logo_url}`);
        }
    } else {
        console.log("No establishments found or query failed.");
    }
})();
