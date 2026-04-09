import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TenantContextHelper } from '../utils/tenantContext';

export function useSupabaseRealtime(
  table: string,
  onUpdate: () => void
) {
  useEffect(() => {
    let channel: any;

    const setupSubscription = async () => {
      const ctx = await TenantContextHelper.getCurrentContext();
      if (!ctx || !ctx.organizationId) return;

      // Escuta mudanças na tabela específica filtrada pela organização atual
      channel = supabase
        .channel(`public:${table}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table,
            filter: `organization_id=eq.${ctx.organizationId}`
          },
          () => {
            // Qualquer mudança (Insert, Update, Delete) dispara a função de callback
            onUpdate();
          }
        )
        .subscribe();
    };

    setupSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [table, onUpdate]);
}
