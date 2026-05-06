import { supabase } from '../lib/supabase';

export const autoXmlImportService = {
  async runScheduler(): Promise<void> {
    try {
      const response = await fetch(`${import.meta.env.VITE_PROXY_URL || 'https://tms-erp-proxy-303812479794.southamerica-east1.run.app'}/api/auto-import-xml`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        throw new Error(`Erro de rede: ${response.statusText}`);
      }
      
      const result = await response.json();

      const totalNfe = result.nfeImported || 0;
      const totalCte = result.cteImported || 0;
      const total = result.total || 0;

      if (result.logs) {
      }

      if (totalNfe > 0 || totalCte > 0) {
        window.dispatchEvent(new CustomEvent('xml-auto-import-completed', {
          detail: { nfeCount: totalNfe, cteCount: totalCte }
        }));
      }

    } catch (error) {

      throw error;
    }
  }
};
