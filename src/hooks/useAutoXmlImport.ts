import { useEffect, useRef } from 'react';
import { autoXmlImportService } from '../services/autoXmlImportService';
import { supabase } from '../lib/supabase';

export const useAutoXmlImport = () => {
  const mountedRef = useRef(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    mountedRef.current = true;

    const startAutoImport = async () => {
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

        if (!mountedRef.current) return;

        await autoXmlImportService.runScheduler();

        if (mountedRef.current && !intervalRef.current) {
          intervalRef.current = setInterval(async () => {
            await autoXmlImportService.runScheduler();
          }, 5 * 60 * 1000);
        }
      } catch (error) {
        // Silently fail on error
      }
    };

    startAutoImport();

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  return null;
};
