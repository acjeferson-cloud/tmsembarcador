import { createClient } from '@supabase/supabase-js';
import { TenantContextHelper } from './TenantContextHelper';

// Supabase client instance (reusing app env)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface SpotNegotiation {
  id?: string;
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
             nome_fantasia, razao_social
           )
        `)
        .order('created_at', { ascending: false });

      if (ctx?.organizationId) query = query.eq('organization_id', ctx.organizationId);
      if (ctx?.environmentId) query = query.eq('environment_id', ctx.environmentId);
      if (ctx?.establishmentId) query = query.eq('establishment_id', ctx.establishmentId);

      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).map(r => ({
        id: r.id,
        carrier_id: r.carrier_id,
        agreed_value: r.agreed_value,
        valid_from: r.valid_from,
        valid_to: r.valid_to,
        attachment_url: r.attachment_url,
        status: r.status,
        observations: r.observations,
        created_at: r.created_at,
        carrier_name: (r.carriers as any)?.nome_fantasia || (r.carriers as any)?.razao_social || 'Desconhecido'
      }));
    } catch (e) {
       console.error('Failed to get active negotiations', e);
       return [];
    }
  }
};
