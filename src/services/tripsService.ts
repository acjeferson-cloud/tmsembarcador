import { supabase } from '../lib/supabase';
import { TenantContextHelper } from '../utils/tenantContext';
import { Order } from './ordersService';
import { Vehicle } from './vehiclesService';
import { Driver } from './driversService';

export interface TripStop {
  id?: string;
  trip_id?: string;
  sequence: number;
  tipo_parada: 'coleta' | 'entrega' | 'hub_origem' | 'hub_retorno';
  order_id?: string;
  lat: number;
  lng: number;
  status_execucao: 'pendente' | 'realizada' | 'falha';
  order?: Order;
}

export interface Trip {
  id?: string;
  numero_romaneio: string;
  status: 'rascunho' | 'agendada' | 'em_rota' | 'concluida' | 'cancelada';
  vehicle_id?: string;
  driver_id?: string;
  distancia_total_km: number;
  tempo_estimado_min: number;
  data_saida_prevista?: string;
  polyline?: string;
  stops?: TripStop[];
  vehicle?: Vehicle;
  driver?: Driver;
  created_at?: string;
}

export const tripsService = {
  async getAll(): Promise<Trip[]> {
    try {
      const ctx = await TenantContextHelper.getCurrentContext();
      if (ctx && ctx.organizationId && ctx.environmentId) {
        await TenantContextHelper.setSessionContext(ctx);
      }

      let query = supabase
        .from('trips')
        .select(`
          *,
          vehicle:vehicles(*),
          driver:drivers(*),
          stops:trip_stops(
            *,
            order:orders(*)
          )
        `);

      if (ctx?.establishmentId) {
        query = query.eq('establishment_id', ctx.establishmentId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as any[];
    } catch (error) {
      console.error('Erro ao buscar viagens:', error);
      return [];
    }
  },

  async getById(id: string): Promise<Trip | null> {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          vehicle:vehicles(*),
          driver:drivers(*),
          stops:trip_stops(
            *,
            order:orders(*)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as any;
    } catch (error) {
      console.error('Erro ao buscar viagem:', error);
      return null;
    }
  },

  async createTrip(tripData: Partial<Trip>, stops: Partial<TripStop>[]): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const ctx = await TenantContextHelper.getCurrentContext();
      if (!ctx || !ctx.establishmentId) {
        throw new Error('Você precisa estar logado em um estabelecimento para criar uma viagem.');
      }

      let numero_romaneio = tripData.numero_romaneio;

      if (!numero_romaneio) {
        let nextNumber = 1;
        const { data: lastTrip } = await supabase
          .from('trips')
          .select('numero_romaneio')
          .eq('establishment_id', ctx.establishmentId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (lastTrip && lastTrip.numero_romaneio) {
          const match = lastTrip.numero_romaneio.match(/\d+/);
          if (match) {
            nextNumber = parseInt(match[0], 10) + 1;
          }
        }
        numero_romaneio = String(nextNumber).padStart(6, '0');
      }

      // 1. Inserir a viagem
      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .insert({
          numero_romaneio,
          status: tripData.status || 'rascunho',
          vehicle_id: tripData.vehicle_id,
          driver_id: tripData.driver_id,
          distancia_total_km: tripData.distancia_total_km || 0,
          tempo_estimado_min: tripData.tempo_estimado_min || 0,
          data_saida_prevista: tripData.data_saida_prevista || null,
          polyline: tripData.polyline || null,
          establishment_id: ctx.establishmentId
        })
        .select()
        .single();

      if (tripError) throw tripError;

      // 2. Inserir as paradas
      if (stops && stops.length > 0) {
        const stopsToInsert = stops.map((stop, index) => ({
          trip_id: trip.id,
          sequence: stop.sequence || index + 1,
          tipo_parada: stop.tipo_parada || 'entrega',
          order_id: stop.order_id,
          lat: stop.lat || 0,
          lng: stop.lng || 0,
          status_execucao: 'pendente'
        }));

        const { error: stopsError } = await supabase
          .from('trip_stops')
          .insert(stopsToInsert);

        if (stopsError) throw stopsError;

        // 3. Atualizar status dos pedidos para mostrar que estão em rota (se a viagem não for rascunho)
        if (trip.status === 'em_rota' || trip.status === 'agendada') {
          const orderIds = stops.filter(s => s.order_id).map(s => s.order_id);
          if (orderIds.length > 0) {
             await supabase.from('orders').update({ status: 'em_transito' }).in('id', orderIds);
          }
        }
      }

      // 4. Atualizar o status do Veículo e Motorista
      if (trip.vehicle_id && (trip.status === 'em_rota' || trip.status === 'agendada')) {
        await supabase.from('vehicles').update({ status: 'em_rota' }).eq('id', trip.vehicle_id);
      }
      if (trip.driver_id && (trip.status === 'em_rota' || trip.status === 'agendada')) {
        await supabase.from('drivers').update({ status: 'em_rota' }).eq('id', trip.driver_id);
      }

      return { success: true, data: trip };
    } catch (error: any) {
      console.error('Erro ao criar viagem:', error);
      return { success: false, error: error.message || 'Erro desconhecido ao gerar romaneio.' };
    }
  },

  async updateTripStatus(tripId: string, status: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('trips')
        .update({ status })
        .eq('id', tripId);
        
      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};
