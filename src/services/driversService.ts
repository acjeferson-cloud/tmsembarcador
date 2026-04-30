import { supabase } from '../lib/supabase';
import { getCurrentEstablishmentId } from '../utils/establishmentUtils';

export interface Driver {
  id: string;
  nome: string;
  cpf: string;
  cnh: string;
  telefone: string;
  status: 'livre' | 'em_rota' | 'indisponivel' | 'ferias' | 'afastado' | 'em_viagem' | 'inativo'; // Manteve em_viagem e inativo por compatibilidade
  metadata?: {
    categoria_operacional?: 'Próprio' | 'Agregado' | 'Terceiro';
    operacao?: {
      regioes_atuacao?: string[];
      turno_inicio?: string;
      turno_fim?: string;
      jornada_maxima_diaria?: number;
      disponibilidade?: boolean;
    };
    habilitacoes?: {
      mopp?: boolean;
      certificacoes?: string[];
      tipos_carga?: string[];
      veiculos_permitidos?: string[];
      restricoes?: string;
    };
    custos?: {
      valor_hora?: number;
      valor_diaria?: number;
      score_performance?: number;
      possui_rastreador?: boolean;
      observacoes?: string;
    };
  };
  establishment_id?: string;
  created_at?: string;
  updated_at?: string;
}

export const driversService = {
  async getAll(): Promise<Driver[]> {
    const establishmentId = getCurrentEstablishmentId();
    if (!establishmentId) return [];

    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('establishment_id', establishmentId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching drivers:', error);
      throw error;
    }

    return data || [];
  },

  async getById(id: string): Promise<Driver | null> {
    const establishmentId = getCurrentEstablishmentId();
    if (!establishmentId) return null;

    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('id', id)
      .eq('establishment_id', establishmentId)
      .single();

    if (error) {
      console.error('Error fetching driver by id:', error);
      throw error;
    }

    return data;
  },

  async create(driver: Omit<Driver, 'id' | 'created_at' | 'updated_at' | 'establishment_id'>): Promise<Driver | null> {
    const establishmentId = getCurrentEstablishmentId();
    if (!establishmentId) throw new Error('Establishment not selected');

    const { data, error } = await supabase
      .from('drivers')
      .insert([{ ...driver, establishment_id: establishmentId }])
      .select()
      .single();

    if (error) {
      console.error('Error creating driver:', error);
      throw error;
    }

    return data;
  },

  async update(id: string, driver: Partial<Driver>): Promise<Driver | null> {
    const establishmentId = getCurrentEstablishmentId();
    if (!establishmentId) throw new Error('Establishment not selected');

    const { data, error } = await supabase
      .from('drivers')
      .update({ ...driver, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('establishment_id', establishmentId)
      .select()
      .single();

    if (error) {
      console.error('Error updating driver:', error);
      throw error;
    }

    return data;
  },

  async delete(id: string): Promise<boolean> {
    const establishmentId = getCurrentEstablishmentId();
    if (!establishmentId) throw new Error('Establishment not selected');

    const { error } = await supabase
      .from('drivers')
      .delete()
      .eq('id', id)
      .eq('establishment_id', establishmentId);

    if (error) {
      console.error('Error deleting driver:', error);
      throw error;
    }

    return true;
  }
};
