import { supabase } from '../lib/supabase';

export const autoXmlImportService = {
  async runScheduler(): Promise<void> {


    try {
      const { data: result, error: invokeError } = await supabase.functions.invoke('auto-import-xml-scheduler', {
        method: 'POST'
      });

      if (invokeError) {
        console.error('Invoke error:', invokeError);
        return;
      }

      if (!result || !result.success) {
        console.error('Função retornou erro:', result);
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
