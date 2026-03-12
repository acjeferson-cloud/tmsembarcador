import { supabase } from '../lib/supabase';

export const autoXmlImportService = {
  async runScheduler(): Promise<void> {


    try {
      const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auto-import-xml-scheduler`;



      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();

        return;
      }

      const result = await response.json();


      if (!result.success) {

        return;
      }

      const totalNfe = result.nfeImported || 0;
      const totalCte = result.cteImported || 0;
      const total = result.total || 0;



      if (totalNfe > 0 || totalCte > 0) {


        window.dispatchEvent(new CustomEvent('xml-auto-import-completed', {
          detail: { nfeCount: totalNfe, cteCount: totalCte }
        }));
      } else {

      }

    } catch (error) {

    }
  }
};
