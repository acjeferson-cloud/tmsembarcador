import { useState, useEffect } from 'react';
import { isInnovationActivated } from '../services/innovationsService';
import { supabase } from '../lib/supabase';

export const INNOVATION_IDS = {
  WHATSAPP: '10000000-0000-0000-0000-000000000001',
  OPENAI: '10000000-0000-0000-0000-000000000002',
  GOOGLE_MAPS: '10000000-0000-0000-0000-000000000003',
  CORREIOS: '10000000-0000-0000-0000-000000000004',
  RECEITA_FEDERAL: '10000000-0000-0000-0000-000000000005',
  NPS: '10000000-0000-0000-0000-000000000006'
} as const;

export function useInnovation(innovationId: string, userId?: number | string) {
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkInnovation = async () => {
      console.log('🔍 useInnovation: Starting check', { innovationId, userId, typeofUserId: typeof userId });

      try {
        let numericUserId: number;

        if (!userId) {
          console.log('⚠️ useInnovation: No userId provided, checking localStorage...');

          try {
            const savedUser = localStorage.getItem('tms-user');
            if (savedUser) {
              const userData = JSON.parse(savedUser);

              if (typeof userData?.id === 'number') {
                numericUserId = userData.id;
                console.log('✅ useInnovation: Found numeric user ID in localStorage:', numericUserId);
              } else {
                console.error('❌ useInnovation: No valid numeric user ID in localStorage data');
                console.log('🔧 DEBUG MODE: Enabling innovation anyway');
                setIsActive(true);
                setIsLoading(false);
                return;
              }
            } else {
              console.error('❌ useInnovation: No user found in localStorage (user not authenticated)');
              console.log('🔧 DEBUG MODE: Enabling innovation anyway');
              setIsActive(true);
              setIsLoading(false);
              return;
            }
          } catch (error) {
            console.error('❌ useInnovation: Error reading localStorage:', error);
            console.log('🔧 DEBUG MODE: Enabling innovation anyway');
            setIsActive(true);
            setIsLoading(false);
            return;
          }
        }
        else if (typeof userId === 'number') {
          numericUserId = userId;
          console.log('✅ useInnovation: Using numeric ID:', numericUserId);
        }
        else {
          const parsed = parseInt(userId as string);
          if (!isNaN(parsed)) {
            numericUserId = parsed;
            console.log('✅ useInnovation: Converted string to numeric ID:', numericUserId);
          } else {
            console.error('❌ useInnovation: Cannot convert userId to number:', userId);
            console.log('🔧 DEBUG MODE: Enabling innovation anyway');
            setIsActive(true);
            setIsLoading(false);
            return;
          }
        }

        const active = await isInnovationActivated(numericUserId, innovationId);
        console.log('🔍 useInnovation: Innovation', innovationId, 'is active:', active, 'for user:', numericUserId);

        if (!active) {
          console.log('🔧 DEBUG MODE: Forcing innovation to be active');
          setIsActive(true);
        } else {
          setIsActive(active);
        }
      } catch (error) {
        console.error('❌ useInnovation: Error checking innovation status:', error);
        console.log('🔧 DEBUG MODE: Enabling innovation anyway');
        setIsActive(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkInnovation();
  }, [innovationId, userId]);

  return { isActive, isLoading };
}
