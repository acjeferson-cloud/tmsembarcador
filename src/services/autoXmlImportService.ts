import { supabase } from '../lib/supabase';

export const autoXmlImportService = {
  async runScheduler(): Promise<void> {
    console.log('🔄 Running auto XML import scheduler...');

    try {
      const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auto-import-xml-scheduler`;

      console.log(`📡 Calling edge function: ${edgeFunctionUrl}`);

      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Edge function error:', response.status, errorText);
        return;
      }

      const result = await response.json();
      console.log('📥 Edge function response:', result);

      if (!result.success) {
        console.error('❌ Scheduler reported failure:', result.error);
        return;
      }

      const totalNfe = result.nfeImported || 0;
      const totalCte = result.cteImported || 0;
      const total = result.total || 0;

      console.log('✅ Auto import completed:', {
        nfeImported: totalNfe,
        cteImported: totalCte,
        total: total
      });

      if (totalNfe > 0 || totalCte > 0) {
        console.log(`📦 Successfully imported ${totalNfe} NFe(s) and ${totalCte} CTe(s)`);

        window.dispatchEvent(new CustomEvent('xml-auto-import-completed', {
          detail: { nfeCount: totalNfe, cteCount: totalCte }
        }));
      } else {
        console.log('ℹ️ No new XMLs to import');
      }

    } catch (error) {
      console.error('❌ Error running scheduler:', error);
    }
  }
};
