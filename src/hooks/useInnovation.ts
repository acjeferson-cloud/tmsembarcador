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


      try {
        let numericUserId: number;

        if (!userId) {


          try {
            const savedUser = localStorage.getItem('tms-user');
            if (savedUser) {
              const userData = JSON.parse(savedUser);

              if (typeof userData?.id === 'number') {
                numericUserId = userData.id;

              } else {


                setIsActive(true);
                setIsLoading(false);
                return;
              }
            } else {


              setIsActive(true);
              setIsLoading(false);
              return;
            }
          } catch (error) {


            setIsActive(true);
            setIsLoading(false);
            return;
          }
        }
        else if (typeof userId === 'number') {
          numericUserId = userId;

        }
        else {
          const parsed = parseInt(userId as string);
          if (!isNaN(parsed)) {
            numericUserId = parsed;

          } else {


            setIsActive(true);
            setIsLoading(false);
            return;
          }
        }

        const active = await isInnovationActivated(numericUserId, innovationId);


        if (!active) {

          setIsActive(true);
        } else {
          setIsActive(active);
        }
      } catch (error) {


        setIsActive(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkInnovation();
  }, [innovationId, userId]);

  return { isActive, isLoading };
}
