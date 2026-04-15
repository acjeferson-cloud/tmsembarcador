import { supabase } from '../lib/supabase';
import { TenantContextHelper } from '../utils/tenantContext';

export interface Bill {
  id: string;
  organization_id?: string;
  environment_id?: string;
  establishment_id?: string;
  bill_number: string;
  issue_date: string;
  due_date?: string;
  customer_name?: string;
  customer_document?: string;
  total_value: number;
  paid_value?: number;
  discount_value?: number;
  status: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  cteCount?: number;
}

export interface BillCteLink {
  id: string;
  bill_id: string;
  cte_id?: string;
  cte_number?: string;
  created_at: string;
}

export const billsService = {
  async getAll(): Promise<Bill[]> {
    try {
      const ctx = await TenantContextHelper.getCurrentContext();
      if (ctx && ctx.organizationId && ctx.environmentId) {
        await TenantContextHelper.setSessionContext(ctx);
      }

      // 1. Fetch bills
      let query = (supabase as any)
        .from('bills')
        .select(`
          *,
          carrier:carriers(id, razao_social, codigo),
          bill_ctes (
            id,
            ctes_complete (
              carrier_costs:ctes_carrier_costs(cost_type, cost_value),
              carrier:carriers(metadata)
            )
          )
        `);

      if (ctx?.organizationId) query = query.eq('organization_id', ctx.organizationId);
      if (ctx?.environmentId) query = query.eq('environment_id', ctx.environmentId);
      if (ctx?.establishmentId) query = query.eq('establishment_id', ctx.establishmentId);

      const { data, error } = await query.order('issue_date', { ascending: false });

      if (error) throw error;

      // Map to add cteCount correctly and sum up all costs from linked CT-es
      return (data || []).map((b: any) => {
        let totalCost = 0;
        let cteCount = 0;
        let tolVal = 0;
        let tolPct = 0;
        
        if (b.bill_ctes && Array.isArray(b.bill_ctes)) {
          cteCount = b.bill_ctes.length;
          b.bill_ctes.forEach((link: any) => {
            if (link.ctes_complete) {
              // Extract carrier tolerances if not already set
              if (tolVal === 0 && link.ctes_complete.carrier?.metadata?.tolerancia_valor_fatura) {
                tolVal = Number(link.ctes_complete.carrier.metadata.tolerancia_valor_fatura);
              }
              if (tolPct === 0 && link.ctes_complete.carrier?.metadata?.tolerancia_percentual_fatura) {
                tolPct = Number(link.ctes_complete.carrier.metadata.tolerancia_percentual_fatura);
              }

              if (link.ctes_complete.carrier_costs) {
                const costs = link.ctes_complete.carrier_costs;
                if (Array.isArray(costs)) {
                  const icmsBaseCost = costs.find((c: any) => c.cost_type === 'icms_base');
                  if (icmsBaseCost) {
                    const val = parseFloat(icmsBaseCost.cost_value || '0');
                    if (!isNaN(val)) totalCost += val;
                  }
                }
              }
            }
          });
        }

        return {
          ...b,
          customer_name: b.carrier ? `${b.carrier.codigo ? b.carrier.codigo + ' - ' : ''}${b.carrier.razao_social}` : b.customer_name,
          calculated_cost: totalCost,
          cteCount: b.bill_ctes && b.bill_ctes[0] && b.bill_ctes[0].count !== undefined ? b.bill_ctes[0].count : cteCount,
          tolerancia_valor_fatura: tolVal,
          tolerancia_percentual_fatura: tolPct
        };
      });
    } catch (error) {
// null
      return [];
    }
  },

  async getById(id: string): Promise<Bill | null> {
    try {
      const ctx = await TenantContextHelper.getCurrentContext();
      if (ctx && ctx.organizationId && ctx.environmentId) {
        await TenantContextHelper.setSessionContext(ctx);
      }

      const { data, error } = await (supabase as any)
        .from('bills')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
// null
      return null;
    }
  },
  
  async getLinkedCtes(billId: string): Promise<any[]> {
    try {
      const ctx = await TenantContextHelper.getCurrentContext();
      if (ctx && ctx.organizationId && ctx.environmentId) {
        await TenantContextHelper.setSessionContext(ctx);
      }

      const { data, error } = await (supabase as any)
        .from('bill_ctes')
        .select(`
          id,
          cte_number,
          cte_series,
          ctes_complete (
             id,
             number,
             series,
             issue_date,
             total_value,
             status,
             carrier_costs:ctes_carrier_costs (
               cost_type,
               cost_value
             )
          )
        `)
        .eq('bill_id', billId);

      if (error) throw error;
      return data || [];
    } catch (error) {
// null
      return [];
    }
  },

  async updateStatus(id: string, status: string): Promise<{ success: boolean; error?: string }> {
    try {
      const ctx = await TenantContextHelper.getCurrentContext();
      if (ctx && ctx.organizationId && ctx.environmentId) {
        await TenantContextHelper.setSessionContext(ctx);
      }

      const { error } = await (supabase as any)
        .from('bills')
        .update({ status: status as any })
        .eq('id', id);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Erro ao atualizar fatura' };
    }
  },
  
  async delete(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const ctx = await TenantContextHelper.getCurrentContext();
      if (ctx && ctx.organizationId && ctx.environmentId) {
        await TenantContextHelper.setSessionContext(ctx);
      }

      const { error } = await (supabase as any)
        .from('bills')
        .delete()
        .eq('id', id);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Erro ao deletar fatura' };
    }
  }
};
