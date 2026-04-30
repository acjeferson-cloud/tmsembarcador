import { supabase } from '../lib/supabase';
import { getCurrentEstablishmentId } from '../utils/establishmentUtils';

export interface VehicleMetadata {
  categoria_operacional?: 'Próprio' | 'Agregado' | 'Terceiro';
  tipo_operacao?: 'Urbano' | 'Rodoviário' | 'Misto';
  dimensoes?: {
    comprimento: number;
    largura: number;
    altura: number;
  };
  capacidade_pallets?: number;
  numero_eixos?: number;
  restricoes?: {
    area_restrita: boolean;
    tipo_carroceria: string;
    suporta_refrigerado: boolean;
    tipo_carga: string[];
    certificacoes: string[];
    equipamentos_especiais: string[];
  };
  custos?: {
    fixo_mensal: number;
    variavel_km: number;
    consumo_km_l: number;
    tipo_combustivel: string;
  };
  motorista_padrao_id?: string;
  avancado?: {
    prioridade_uso: number;
    score: number;
    rastreador: boolean;
    telemetria: boolean;
    observacoes: string;
  };
}

export interface Vehicle {
  id: string;
  placa: string;
  tipo: string;
  capacidade_kg: number;
  cubagem_m3: number;
  status: 'ativo' | 'inativo' | 'manutencao';
  metadata?: VehicleMetadata;
  establishment_id?: string;
  created_at?: string;
  updated_at?: string;
}

export const vehiclesService = {
  async getAll(): Promise<Vehicle[]> {
    const establishmentId = getCurrentEstablishmentId();
    if (!establishmentId) return [];

    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('establishment_id', establishmentId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching vehicles:', error);
      throw error;
    }

    // Garante que o metadata seja pelo menos um objeto vazio ao invés de null
    return (data || []).map(v => ({
      ...v,
      metadata: v.metadata || {}
    }));
  },

  async getById(id: string): Promise<Vehicle | null> {
    const establishmentId = getCurrentEstablishmentId();
    if (!establishmentId) return null;

    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .eq('establishment_id', establishmentId)
      .single();

    if (error) {
      console.error('Error fetching vehicle by id:', error);
      throw error;
    }

    if (data) {
      data.metadata = data.metadata || {};
    }

    return data;
  },

  async create(vehicle: Omit<Vehicle, 'id' | 'created_at' | 'updated_at' | 'establishment_id'>): Promise<Vehicle | null> {
    const establishmentId = getCurrentEstablishmentId();
    if (!establishmentId) throw new Error('Establishment not selected');

    const { data, error } = await supabase
      .from('vehicles')
      .insert([{ ...vehicle, metadata: vehicle.metadata || {}, establishment_id: establishmentId }])
      .select()
      .single();

    if (error) {
      console.error('Error creating vehicle:', error);
      throw error;
    }

    if (data) {
      data.metadata = data.metadata || {};
    }

    return data;
  },

  async update(id: string, vehicle: Partial<Vehicle>): Promise<Vehicle | null> {
    const establishmentId = getCurrentEstablishmentId();
    if (!establishmentId) throw new Error('Establishment not selected');

    const payload = { ...vehicle, updated_at: new Date().toISOString() };
    if (payload.metadata === undefined) {
      // Se não enviou metadata explícito, não mexe no banco (o supabase ignora undefined, mas é bom garantir)
    }

    const { data, error } = await supabase
      .from('vehicles')
      .update(payload)
      .eq('id', id)
      .eq('establishment_id', establishmentId)
      .select()
      .single();

    if (error) {
      console.error('Error updating vehicle:', error);
      throw error;
    }

    if (data) {
      data.metadata = data.metadata || {};
    }

    return data;
  },

  async delete(id: string): Promise<boolean> {
    const establishmentId = getCurrentEstablishmentId();
    if (!establishmentId) throw new Error('Establishment not selected');

    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id)
      .eq('establishment_id', establishmentId);

    if (error) {
      console.error('Error deleting vehicle:', error);
      throw error;
    }

    return true;
  }
};
