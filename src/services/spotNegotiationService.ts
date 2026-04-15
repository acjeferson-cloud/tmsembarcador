import { createClient } from '@supabase/supabase-js';
import { TenantContextHelper } from '../utils/tenantContext';

// Supabase client instance (reusing app env)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface SpotNegotiation {
  id?: string;
  code?: string;
  carrier_id: string;
  agreed_value: number;
  valid_from?: string;
  valid_to: string;
  attachment_url?: string;
  status: 'pendente_faturamento' | 'liquidado' | 'cancelado';
  observations?: string;
  created_at?: string;
  carrier_name?: string; // Virtual loaded
}

export interface SpotInvoiceLink {
  invoice_id: string;
}

export const spotNegotiationService = {
  
  async uploadProof(file: File): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `spot-proofs/${fileName}`;

      const { data, error } = await supabase.storage
        .from('spot_negotiations_proofs')
        .upload(filePath, file);

      if (error) {
        console.error('Error uploading proof:', error);
        return null;
      }
      
      const { data: publicUrlData } = supabase.storage
        .from('spot_negotiations_proofs')
        .getPublicUrl(filePath);
        
      return publicUrlData.publicUrl;
    } catch (err) {
      console.error('Error in uploadProof:', err);
      return null;
    }
  },

  async createNegotiation(data: SpotNegotiation, invoiceIds: string[]): Promise<boolean> {
    try {
      const ctx = await TenantContextHelper.getCurrentContext();
      if (!ctx || !ctx.organizationId) throw new Error('Missing tenant context');

      // 1. Create Capa
      const payload = {
        organization_id: ctx.organizationId,
        environment_id: ctx.environmentId,
        establishment_id: ctx.establishmentId,
        carrier_id: data.carrier_id,
        agreed_value: data.agreed_value,
        valid_to: data.valid_to,
        attachment_url: data.attachment_url,
        observations: data.observations || null,
        status: data.status
      };

      const { data: negotiationResult, error: negError } = await supabase
        .from('freight_spot_negotiations')
        .insert(payload)
        .select('id')
        .single();

      if (negError || !negotiationResult) {
        console.error('Could not create Spot Header:', negError);
        return false;
      }

      // 2. Link N invoices in bulk
      const linksToInsert = invoiceIds.map(invId => ({
        organization_id: ctx.organizationId,
        environment_id: ctx.environmentId,
        establishment_id: ctx.establishmentId,
        negotiation_id: negotiationResult.id,
        invoice_id: invId
      }));

      const { error: linksError } = await supabase
        .from('freight_spot_invoices')
        .insert(linksToInsert);

      if (linksError) {
         console.warn('Spot Header created but failed to link items.', linksError);
         return false; // Transaction fail manual rollback expected or backend RPC. For simplicity returning false.
      }

      // 3. Post-Creation Hook: Check if any of these invoices ALREADY has a CT-e imported
      try {
        const { data: invoices } = await supabase
          .from('invoices_nfe')
          .select('chave_acesso, numero')
          .in('id', invoiceIds);

        if (invoices && invoices.length > 0) {
          const lookupStrings = invoices.flatMap((i: any) => [i.chave_acesso, i.numero]).filter((x: string) => !!x);
          
          if (lookupStrings.length > 0) {
            const { data: cteInvoices } = await supabase
              .from('ctes_invoices')
              .select('cte_id')
              .in('number', lookupStrings);

            if (cteInvoices && cteInvoices.length > 0) {
              // Found a CT-e! Advance this Spot status automatically.
              await supabase
                .from('freight_spot_negotiations')
                .update({ status: 'aguardando_fatura' })
                .eq('id', negotiationResult.id);
                
              // Trigger recalculation for the affected CTEs to absorb the Spot value
              const uniqueCteIds = Array.from(new Set(cteInvoices.map((c: any) => c.cte_id)));
              
              const { ctesCompleteService } = await import('./ctesCompleteService');
              const { freightCostCalculator } = await import('./freightCostCalculator');
              
              for (const cteId of uniqueCteIds) {
                const fullCTe = await ctesCompleteService.getById(cteId as string);
                if (fullCTe) {
                  const calculation = await freightCostCalculator.calculateCTeCost(fullCTe);
                  await freightCostCalculator.saveCostsToCTe(cteId as string, calculation);
                }
              }
            }
          }
        }
      } catch (postHookErr) {
        console.warn('Error in post-creation CT-e hook', postHookErr);
      }

      return true;
    } catch (e) {
      console.error('Error creating negotiation', e);
      return false;
    }
  },

  async getActiveNegotiations(): Promise<SpotNegotiation[]> {
    try {
      const ctx = await TenantContextHelper.getCurrentContext();
      
      let query = supabase
        .from('freight_spot_negotiations')
        .select(`
           *,
           carriers (
             codigo, nome_fantasia, razao_social
           )
        `)
        .order('created_at', { ascending: false });

      if (ctx?.organizationId) query = query.eq('organization_id', ctx.organizationId);
      if (ctx?.environmentId) query = query.eq('environment_id', ctx.environmentId);
      if (ctx?.establishmentId) query = query.eq('establishment_id', ctx.establishmentId);

      const { data, error } = await query;
      if (error) {
        console.error('Database Error:', error);
        return [];
      }
      
      const mapped = (data || []).map(r => {
        let carrierNameStr = (r.carriers as any)?.razao_social || (r.carriers as any)?.nome_fantasia || 'Desconhecido';
        const codigo = (r.carriers as any)?.codigo;
        if (codigo) carrierNameStr = `${codigo} - ${carrierNameStr}`;
        
        return {
          id: r.id,
          code: r.code,
          carrier_id: r.carrier_id,
          agreed_value: r.agreed_value,
          valid_from: r.valid_from,
          valid_to: r.valid_to,
          attachment_url: r.attachment_url,
          status: r.status,
          observations: r.observations,
          created_at: r.created_at,
          carrier_name: carrierNameStr
        };
      });

      const negotiationIds = mapped.map(n => n.id);
      if (negotiationIds.length > 0) {
        const { data: pivotData } = await supabase
          .from('freight_spot_invoices')
          .select('negotiation_id, invoice_id')
          .in('negotiation_id', negotiationIds);
          
        if (pivotData && pivotData.length > 0) {
           const invoiceIds = pivotData.map(p => p.invoice_id);
           const { data: cteInvoiceData } = await supabase
             .from('ctes_invoices')
             .select('invoice_id')
             .in('invoice_id', invoiceIds);
             
           if (cteInvoiceData && cteInvoiceData.length > 0) {
              const invoicesWithCte = new Set(cteInvoiceData.map(c => c.invoice_id));
              mapped.forEach(n => {
                 const nInvoices = pivotData.filter(p => p.negotiation_id === n.id).map(p => p.invoice_id);
                 const hasCte = nInvoices.some(invId => invoicesWithCte.has(invId));
                 if (hasCte && n.status === 'pendente_faturamento') {
                    n.status = 'aguardando_fatura' as any;
                 }
              });
           }
        }
      }

      return mapped;
    } catch (e) {
       console.error('Failed to get active negotiations', e);
       return [];
    }
  },

  async cancelNegotiation(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('freight_spot_negotiations')
        .update({ status: 'cancelado' })
        .eq('id', id);

      if (error) {
        console.error('Failed to cancel negotiation', error);
        return false;
      }
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  async getNegotiationById(id: string): Promise<any | null> {
    try {
      const { data: neg, error } = await supabase
        .from('freight_spot_negotiations')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error || !neg) return null;

      // Buscar os NFE IDs atrelados
      const { data: pivots } = await supabase
        .from('freight_spot_invoices')
        .select('invoice_id')
        .eq('negotiation_id', id);

      const nfeIds = pivots ? pivots.map(p => p.invoice_id) : [];

      return {
        ...neg,
        nfeIds
      };
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  async updateNegotiation(id: string, carrierId: string, value: number, validTo: string, attachmentUrl: string | null): Promise<boolean> {
    try {
      // In a real application we would also sync the selected invoices if they change.
      // But typically a spot negotiation might only be updated on value or validTo.
      const payload: any = {
        carrier_id: carrierId,
        agreed_value: value,
        valid_to: validTo
      };
      if (attachmentUrl) payload.attachment_url = attachmentUrl;

      const { error } = await supabase
        .from('freight_spot_negotiations')
        .update(payload)
        .eq('id', id);

      if (error) {
         console.error('Failed to update negotiation', error);
         return false;
      }
      return true;
    } catch(e) {
      console.error(e);
      return false;
    }
  },

  async getFirstLinkedInvoice(negotiationId: string): Promise<any | null> {
    try {
      const { data: pivots, error: pivotErr } = await supabase
        .from('freight_spot_invoices')
        .select('invoice_id')
        .eq('negotiation_id', negotiationId)
        .limit(1);

      if (pivotErr || !pivots || pivots.length === 0) return null;

      const invoiceId = pivots[0].invoice_id;
      
      const { data: inv, error: invErr } = await supabase
        .from('invoices_nfe')
        .select('id, numero, data_emissao, situacao, valor_total')
        .eq('id', invoiceId)
        .single();

      if (invErr || !inv) return null;

      return {
        id: `invoice-${inv.id}`,
        type: 'invoice',
        number: inv.numero,
        date: inv.data_emissao || new Date().toISOString(),
        status: inv.situacao || 'Emitida',
        value: Number(inv.valor_total || 0)
      };
    } catch (e) {
      console.error(e);
      return null;
    }
  }
};
