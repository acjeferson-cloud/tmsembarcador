import { supabase, ensureSessionContext } from '../lib/supabase';
import { TenantContextHelper } from '../utils/tenantContext';

export interface NpsSettings {
  id?: string;
  automation_active: boolean;
  delay_hours: number;
  expiration_days: number;
  environment_id?: string;
  organization_id?: string;
}

export interface NpsDispatch {
  id: string;
  invoice_id: string;
  status: 'pendente' | 'enviado' | 'respondido' | 'expirado' | 'erro';
  recipient_email: string;
  channel: string;
  score: number | null;
  feedback: string | null;
  scheduled_for: string;
  dispatched_at: string | null;
  expires_at: string | null;
  error_reason: string | null;
  token: string;
  created_at: string;
  invoices_nfe?: {
    numero: string;
    customer: {
      razao_social: string;
      email: string;
    }[];
  };
}

export const npsCxService = {
  async getSettings(): Promise<NpsSettings | null> {
    try {
      await ensureSessionContext();
      const context = await TenantContextHelper.getCurrentContext();
      if (!context?.environmentId || !context?.establishmentId) {
        throw new Error('Contexto incompleto. Ambiente e Estabelecimento são obrigatórios.');
      }

      const { data, error } = await (supabase as any).rpc('get_nps_settings', {
        p_environment_id: context.environmentId,
        p_establishment_id: context.establishmentId
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar configurações do NPS CX:', error);
      throw error;
    }
  },

  async saveSettings(settings: Partial<NpsSettings>): Promise<NpsSettings> {
    try {
      await ensureSessionContext();
      const context = await TenantContextHelper.getCurrentContext();
      if (!context?.environmentId || !context?.establishmentId) {
         throw new Error('Contexto incompleto. Ambiente e Estabelecimento são obrigatórios.');
      }

      const payload = {
            ...settings,
            environment_id: context.environmentId,
            organization_id: context.organizationId,
            establishment_id: context.establishmentId,
            updated_at: new Date().toISOString()
      };

      // Use explicit RPC to bypass PgBouncer RLS drops on direct REST calls
      const { data, error } = await (supabase as any).rpc('save_nps_settings', {
        p_payload: payload
      });

      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Erro ao salvar configurações do NPS CX:', error);
      throw error;
    }
  },

  async getDispatches(filters?: {
    status?: string | 'all';
    startDate?: string;
    endDate?: string;
    searchText?: string; // Search by Invoice number or Customer name
  }): Promise<NpsDispatch[]> {
    try {
      await ensureSessionContext();
      const context = await TenantContextHelper.getCurrentContext();
      if (!context?.environmentId) throw new Error('Contexto não encontrado');

      let query = supabase
        .from('nps_dispatches')
        .select(`
          *,
          invoices_nfe (
            numero,
            customer:invoices_nfe_customers(razao_social)
          )
        `)
        .eq('environment_id', context.environmentId)
        .eq('establishment_id', context.establishmentId)
        .order('created_at', { ascending: false });

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      let result = data as any[];

      // Client-side search as postGrest doesn't easily deeply search relationships without explicit RPC
      if (filters?.searchText) {
        const search = filters.searchText.toLowerCase();
        result = result.filter(item => 
          item.invoices_nfe?.numero?.toLowerCase().includes(search) || 
          item.invoices_nfe?.customer?.[0]?.razao_social?.toLowerCase().includes(search) ||
          item.recipient_email?.toLowerCase().includes(search)
        );
      }

      return result;
    } catch (error) {
      console.error('Erro ao buscar históricos do NPS:', error);
      throw error;
    }
  },

  async resendNps(dispatchId: string, emailStr?: string): Promise<boolean> {
    try {
      await ensureSessionContext();
      // If user provided a new email, update it and set status to 'pendente'
      // The scheduled_for goes to now() so the cron picks it up instantly
      const updates: any = {
        status: 'pendente',
        scheduled_for: new Date().toISOString(),
        error_reason: null
      };

      if (emailStr) {
        updates.recipient_email = emailStr;
      }

      const { error } = await supabase
        .from('nps_dispatches')
        .update(updates)
        .eq('id', dispatchId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao reenviar NPS:', error);
      throw error;
    }
  },

  async cancelNps(dispatchId: string): Promise<boolean> {
    try {
      await ensureSessionContext();
      const { error } = await supabase
        .from('nps_dispatches')
        .update({
          status: 'erro',
          error_reason: 'Cancelado manualmente pelo supervisor',
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', dispatchId)
        .eq('status', 'pendente');

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao cancelar NPS:', error);
      throw error;
    }
  },

  async triggerTestScheduler(): Promise<{ sent: number; errors: number }> {
    try {
      await ensureSessionContext();
      if (!supabase) throw new Error('Supabase client is not available');
      const context = await TenantContextHelper.getCurrentContext();
      
      const { data, error } = await supabase.functions.invoke('nps-scheduler', {
        body: { 
           manualTrigger: true, 
           environment_id: context?.environmentId,
           establishment_id: context?.establishmentId,
           appUrl: window.location.origin
        }
      });
      
      if (error) {
        let details = error.message;
        try {
           const ctx = (error as any).context;
           if (ctx && typeof ctx.json === 'function') {
             const body = await ctx.json();
             if (body && body.error) details = body.error;
           } else if (ctx && typeof ctx.text === 'function') {
             details = await ctx.text();
           }
        } catch(e) {}
        throw new Error(details || 'Erro ao invocar a Edge Function nps-scheduler');
      }
      
      return data || { sent: 0, errors: 0 };
    } catch (error) {
       console.error('Erro no test_scheduler:', error);
       throw error;
    }
  }
};
