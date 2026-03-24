import { supabase } from '../lib/supabase';

export interface DeliveryProof {
  invoice_id: string;
  delivered_at: string;
  receiver_name: string;
  receiver_document?: string;
  driver_name?: string;
  vehicle_plate?: string;
  observations?: string;
  photo_1_url?: string;
  photo_2_url?: string;
  photo_3_url?: string;
  signature_url?: string;
  signature_date?: string;
  legal_terms_accepted: boolean;
  created_by: number;
}

export const deliveryProofService = {
  // Converte dataURL para Blob
  dataURLtoBlob: (dataURL: string): Blob => {
    const arr = dataURL.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) throw new Error('Invalid data URL');
    
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  },

  // Faz upload de uma foto do comprovante
  uploadPhoto: async (invoiceId: string, file: File, photoNumber: 1 | 2 | 3): Promise<{ success: boolean; url?: string; error?: string }> => {
    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `delivery_${invoiceId}_photo${photoNumber}_${Date.now()}.${fileExt}`;
      const filePath = `delivery-proofs/${fileName}`;

      const { error: uploadError } = await (supabase as any).storage
        .from('pickup-proofs') // Reusing the existing bucket
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = (supabase as any).storage
        .from('pickup-proofs')
        .getPublicUrl(filePath);

      return { success: true, url: data.publicUrl };
    } catch (error: any) {
      console.error('Erro no upload da foto:', error);
      return { success: false, error: error.message };
    }
  },

  // Faz upload da assinatura
  uploadSignature: async (invoiceId: string, blob: Blob): Promise<{ success: boolean; url?: string; error?: string }> => {
    try {
      const fileName = `delivery_${invoiceId}_signature_${Date.now()}.png`;
      const filePath = `delivery-proofs/${fileName}`;

      const { error: uploadError } = await (supabase as any).storage
        .from('pickup-proofs')
        .upload(filePath, blob, { contentType: 'image/png' });

      if (uploadError) throw uploadError;

      const { data } = (supabase as any).storage
        .from('pickup-proofs')
        .getPublicUrl(filePath);

      return { success: true, url: data.publicUrl };
    } catch (error: any) {
      console.error('Erro no upload da assinatura:', error);
      return { success: false, error: error.message };
    }
  },

  // Deleta uma imagem
  deletePhoto: async (url: string): Promise<void> => {
    try {
      const pathPart = url.split('/pickup-proofs/')[1];
      if (!pathPart) return;
      
      await (supabase as any).storage
        .from('pickup-proofs')
        .remove([pathPart]);
    } catch (error) {
      console.error('Erro ao deletar foto:', error);
    }
  },

  // Obtém o proof salvo do metadata da NFe
  getByInvoiceId: async (invoiceId: string): Promise<DeliveryProof | null> => {
    try {
      const { data, error } = await (supabase as any)
        .from('invoices_nfe')
        .select('metadata')
        .eq('id', invoiceId)
        .single();
      
      if (error) throw error;

      if (data && data.metadata && data.metadata.delivery_proof) {
        return data.metadata.delivery_proof as DeliveryProof;
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar delivery proof:', error);
      return null;
    }
  },

  // Salva no metadata da NFe
  saveProof: async (invoiceId: string, proof: Partial<DeliveryProof>): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error: fetchError } = await (supabase as any)
        .from('invoices_nfe')
        .select('metadata')
        .eq('id', invoiceId)
        .single();
        
      if (fetchError) throw fetchError;

      const metadata = data?.metadata || {};
      const newMetadata = {
        ...metadata,
        delivery_proof: { ...proof, invoice_id: invoiceId }
      };

      const { error: updateError } = await (supabase as any)
        .from('invoices_nfe')
        .update({
           metadata: newMetadata,
           updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId);

      if (updateError) throw updateError;
      
      return { success: true };
    } catch (error: any) {
      console.error('Erro ao salvar delivery proof:', error);
      return { success: false, error: error.message };
    }
  }
};
