import { supabase } from '../lib/supabase';

export interface PickupProof {
  id?: string;
  pickup_id: string;
  collected_at: string;
  collector_name: string;
  collector_document?: string;
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
  created_at?: string;
  updated_at?: string;
}

// Helper para identificar se é um UUID mock (começa com zeros)
const isMockUUID = (uuid: string): boolean => {
  return uuid.startsWith('00000');
};

// LocalStorage helpers para dados mock
const STORAGE_KEY = 'pickup_proofs_mock';

const getLocalProofs = (): Record<string, PickupProof> => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {

    return {};
  }
};

const saveLocalProofs = (proofs: Record<string, PickupProof>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(proofs));
  } catch (error) {

  }
};

export const pickupProofService = {
  async getByPickupId(pickupId: string): Promise<PickupProof | null> {
    // Se for mock UUID, usar localStorage
    if (isMockUUID(pickupId)) {
      const proofs = getLocalProofs();
      return proofs[pickupId] || null;
    }

    // Senão, usar Supabase
    try {
      const { data, error } = await supabase
        .from('pickup_proofs')
        .select('*')
        .eq('pickup_id', pickupId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {

      return null;
    }
  },

  async create(proof: Partial<PickupProof>): Promise<{ success: boolean; id?: string; error?: string }> {
    // Se for mock UUID, usar localStorage
    if (proof.pickup_id && isMockUUID(proof.pickup_id)) {
      try {
        const proofs = getLocalProofs();
        const newProof: PickupProof = {
          ...proof as PickupProof,
          id: `mock-${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        proofs[proof.pickup_id] = newProof;
        saveLocalProofs(proofs);

        return { success: true, id: newProof.id };
      } catch (error) {

        return { success: false, error: 'Erro ao criar comprovante mock' };
      }
    }

    // Senão, usar Supabase
    try {
      const { data, error } = await supabase
        .from('pickup_proofs')
        .insert({
          ...proof,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, id: data.id };
    } catch (error) {

      return { success: false, error: 'Erro ao criar comprovante de coleta' };
    }
  },

  async update(pickupId: string, proof: Partial<PickupProof>): Promise<{ success: boolean; error?: string }> {
    // Se for mock UUID, usar localStorage
    if (isMockUUID(pickupId)) {
      try {
        const proofs = getLocalProofs();
        const existingProof = proofs[pickupId];

        if (!existingProof) {
          return { success: false, error: 'Comprovante não encontrado' };
        }

        proofs[pickupId] = {
          ...existingProof,
          ...proof,
          pickup_id: pickupId,
          updated_at: new Date().toISOString()
        };
        saveLocalProofs(proofs);

        return { success: true };
      } catch (error) {

        return { success: false, error: 'Erro ao atualizar comprovante mock' };
      }
    }

    // Senão, usar Supabase
    try {
      const { error } = await supabase
        .from('pickup_proofs')
        .update({
          ...proof,
          updated_at: new Date().toISOString()
        })
        .eq('pickup_id', pickupId);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) {

      return { success: false, error: 'Erro ao atualizar comprovante de coleta' };
    }
  },

  async uploadPhoto(pickupId: string, photoFile: File, photoNumber: 1 | 2 | 3): Promise<{ success: boolean; url?: string; error?: string }> {
    // Se for mock UUID, converter para base64
    if (isMockUUID(pickupId)) {
      try {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = reader.result as string;

            resolve({ success: true, url: base64String });
          };
          reader.onerror = () => {
            resolve({ success: false, error: 'Erro ao converter foto para base64' });
          };
          reader.readAsDataURL(photoFile);
        });
      } catch (error) {

        return { success: false, error: 'Erro ao processar foto' };
      }
    }

    // Senão, usar Supabase Storage
    try {
      const fileExt = photoFile.name.split('.').pop();
      const fileName = `${pickupId}/photo_${photoNumber}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('pickup-proofs')
        .upload(fileName, photoFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        return { success: false, error: uploadError.message };
      }

      const { data: { publicUrl } } = supabase.storage
        .from('pickup-proofs')
        .getPublicUrl(fileName);

      return { success: true, url: publicUrl };
    } catch (error) {

      return { success: false, error: 'Erro ao fazer upload da foto' };
    }
  },

  async deletePhoto(url: string): Promise<{ success: boolean; error?: string }> {
    // Se for base64 (mock), apenas retornar sucesso
    if (url.startsWith('data:')) {

      return { success: true };
    }

    // Senão, remover do Supabase Storage
    try {
      const path = url.split('/pickup-proofs/')[1];
      if (!path) return { success: false, error: 'URL inválida' };

      const { error } = await supabase.storage
        .from('pickup-proofs')
        .remove([path]);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) {

      return { success: false, error: 'Erro ao excluir foto' };
    }
  },

  async uploadSignature(pickupId: string, signatureBlob: Blob): Promise<{ success: boolean; url?: string; error?: string }> {
    // Se for mock UUID, converter para base64
    if (isMockUUID(pickupId)) {
      try {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = reader.result as string;

            resolve({ success: true, url: base64String });
          };
          reader.onerror = () => {
            resolve({ success: false, error: 'Erro ao converter assinatura para base64' });
          };
          reader.readAsDataURL(signatureBlob);
        });
      } catch (error) {

        return { success: false, error: 'Erro ao processar assinatura' };
      }
    }

    // Senão, usar Supabase Storage
    try {
      const fileName = `${pickupId}/signature_${Date.now()}.png`;

      const { error: uploadError } = await supabase.storage
        .from('pickup-proofs')
        .upload(fileName, signatureBlob, {
          contentType: 'image/png',
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        return { success: false, error: uploadError.message };
      }

      const { data: { publicUrl } } = supabase.storage
        .from('pickup-proofs')
        .getPublicUrl(fileName);

      return { success: true, url: publicUrl };
    } catch (error) {

      return { success: false, error: 'Erro ao fazer upload da assinatura' };
    }
  },

  dataURLtoBlob(dataURL: string): Blob {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }
};
