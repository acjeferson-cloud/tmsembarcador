import { useEffect, useRef } from 'react';
import { autoXmlImportService } from '../services/autoXmlImportService';
import { supabase } from '../lib/supabase';

let globalIntervalId: NodeJS.Timeout | null = null;
let isGloballyInitialized = false;

export const useAutoXmlImport = () => {
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const startAutoImport = async () => {
      if (isGloballyInitialized) {
        return;
      }

      try {
        const { data: establishments } = await supabase
          .from('establishments')
          .select('id, metadata');

        const hasAutoImportEnabled = establishments?.some((est: any) =>
          est.metadata?.email_config?.autoDownloadEnabled === true
        );

        if (!hasAutoImportEnabled) {
          return;
        }

        await autoXmlImportService.runScheduler();

        if (!globalIntervalId) {
          globalIntervalId = setInterval(async () => {
            await autoXmlImportService.runScheduler();
          }, 5 * 60 * 1000);

          isGloballyInitialized = true;
        }
      } catch (error) {

      }
    };

    startAutoImport();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  return null;
};
