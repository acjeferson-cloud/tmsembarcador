import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface InnovationsContextType {
  activeInnovationKeys: string[];
  isInnovationActive: (key: string) => boolean;
  refreshInnovations: () => Promise<void>;
  isLoading: boolean;
}

const InnovationsContext = createContext<InnovationsContextType | undefined>(undefined);

export const InnovationsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, currentEstablishment } = useAuth();
  const [activeInnovationKeys, setActiveInnovationKeys] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Derive orgId and envId from context (you might adjust this based on how useAuth actually holds orgId/envId)
  // Usually, tms extracts it from the user's login session or localStorage
  const getContextValues = () => {
    const orgId = user?.organization_id || localStorage.getItem('tms-selected-organization') || localStorage.getItem('tms-user-org-id');
    const envId = user?.environment_id || localStorage.getItem('tms-selected-environment') || localStorage.getItem('tms-user-env-id');
    const estabCode = currentEstablishment?.codigo || '0000';
    
    // Fallback para ler do jwt decodificando ou cache
    const savedUser = localStorage.getItem('tms-user');
    let defaultOrg = orgId;
    let defaultEnv = envId;

    if (savedUser && (!defaultOrg || !defaultEnv)) {
      try {
        const u = JSON.parse(savedUser);
        if (!defaultOrg) defaultOrg = u.organization_id;
        if (!defaultEnv) defaultEnv = u.environment_id;
      } catch (e) {}
    }

    return { orgId: defaultOrg, envId: defaultEnv, estabCode };
  };

  const loadActiveInnovations = async () => {
    try {
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { orgId, envId, estabCode } = getContextValues();

      if (!orgId || !envId || !estabCode) {
        setIsLoading(false);
        return;
      }

      // Consulta otimizada com join para trazer as keys com base nos IDs ativos deste tenant
      const { data, error } = await (supabase as any).from('user_innovations')
        .select(`
          innovation_id,
          innovation:innovations ( innovation_key )
        `)
        .eq('organization_id', orgId)
        .eq('environment_id', envId)
        .eq('establishment_code', estabCode)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching active innovations:', error);
        return;
      }

      if (data) {
        // Filtrar apenas inovações que possuam uma chave vinculada,
        // suportando tanto o formato objeto direto (1:1) quanto array vindo do Supabase
        const keys = data
          .map((row: any) => {
            const inn = Array.isArray(row.innovation) ? row.innovation[0] : row.innovation;
            return inn?.innovation_key;
          })
          .filter(Boolean);
        
        setActiveInnovationKeys(keys);
      }
    } catch (error) {
      console.error('Failed to load innovations', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadActiveInnovations();

    const handleUpdate = () => {
      loadActiveInnovations();
    };
    window.addEventListener('innovationsUpdated', handleUpdate);

    return () => {
      window.removeEventListener('innovationsUpdated', handleUpdate);
    };
  }, [user?.id, currentEstablishment?.codigo]);

  const isInnovationActive = (key: string) => {
    return activeInnovationKeys.includes(key);
  };

  return (
    <InnovationsContext.Provider value={{ activeInnovationKeys, isInnovationActive, refreshInnovations: loadActiveInnovations, isLoading }}>
      {children}
    </InnovationsContext.Provider>
  );
};

export const useInnovations = () => {
  const context = useContext(InnovationsContext);
  if (context === undefined) {
    throw new Error('useInnovations must be used within an InnovationsProvider');
  }
  return context;
};
