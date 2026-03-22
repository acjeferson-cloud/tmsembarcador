import { supabase } from '../lib/supabase';

export const autoXmlImportService = {
  async runScheduler(): Promise<void> {
    try {
      const { data: result, error: invokeError } = await supabase.functions.invoke('auto-import-xml-scheduler', {
        method: 'POST'
      });

      if (invokeError) {
        console.error('Invoke error:', invokeError);
        throw new Error(`Erro na execução: ${invokeError.message || 'Erro desconhecido'}`);
      }

      if (!result || !result.success) {
        console.error('Função retornou erro:', result);
        throw new Error(`Erro na função: ${result?.error || 'Erro desconhecido'}`);
      }

      const totalNfe = result.nfeImported || 0;
      const totalCte = result.cteImported || 0;
      const total = result.total || 0;

      if (result.logs) {
         console.log('=== LOGS DA EDGE FUNCTION ===', result.logs);
      }

      if (totalNfe > 0 || totalCte > 0) {
        window.dispatchEvent(new CustomEvent('xml-auto-import-completed', {
          detail: { nfeCount: totalNfe, cteCount: totalCte }
        }));
      }

    } catch (error) {
      console.error('Erro geral na auto-importação:', error);
      throw error;
    }
  }
};
