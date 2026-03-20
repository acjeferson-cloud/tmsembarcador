import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export const INNOVATION_IDS = {
  WHATSAPP: '7808f41c-0a0e-445d-bc21-9ab29de310dc',
  OPENAI: '2b513551-c84c-4fae-9eac-4cd3195d03dd',
  GOOGLE_MAPS: '0923ddb9-c872-474c-b77b-1ea69322fbd6',
  CORREIOS: 'dab1390b-1ae6-4916-8576-93a005ef85e0',
  RECEITA_FEDERAL: '694a7f88-a342-4ad4-9711-daf2edf4aba6',
  NPS: '6281084e-d0e2-4974-a32d-dc928cc17745'
} as const;

export function useInnovation(innovationId: string, userId?: number | string) {
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user, currentEstablishment } = useAuth();

  useEffect(() => {
    const checkInnovation = async () => {
      try {
        const orgId = user?.organization_id || localStorage.getItem('tms-selected-org-id') || '';
        const envId = user?.environment_id || localStorage.getItem('tms-selected-env-id') || '';
        const estabCode = currentEstablishment?.codigo || '0000';
        
        let numericUserId = 1;

        if (userId) {
          numericUserId = typeof userId === 'number' ? userId : parseInt(userId as string) || 1;
        } else {
          try {
            const savedUser = localStorage.getItem('tms-user');
            if (savedUser) {
              const userData = JSON.parse(savedUser);
              if (typeof userData?.id === 'number') {
                numericUserId = userData.id;
              }
            }
          } catch (e) {}
        }

        const { data, error } = await (supabase as any).from('user_innovations')
          .select('is_active')
          .eq('organization_id', orgId)
          .eq('environment_id', envId)
          .eq('establishment_code', estabCode)
          .eq('innovation_id', innovationId)
          .eq('is_active', true)
          .maybeSingle();
          
        const active = !error && !!data;
        console.log('[useInnovation] DB result:', { innovationId, active, data, error, orgId, envId, estabCode });
        setIsActive(active);
      } catch (error) {
        console.error('[useInnovation] erro fatal ao checar', error);
        setIsActive(false);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.organization_id || localStorage.getItem('tms-selected-org-id')) {
      checkInnovation();
    } else {
      setIsLoading(false);
    }

    const handleUpdate = () => {
      checkInnovation(); // Always trigger checkInnovation on update to ensure reactivity
    };
    window.addEventListener('innovationsUpdated', handleUpdate);

    return () => {
      window.removeEventListener('innovationsUpdated', handleUpdate);
    };
  }, [innovationId, userId, user, currentEstablishment]);

  return { isActive, isLoading };
}
