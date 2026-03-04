import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

export interface LogoMetadata {
  size_bytes: number;
  mime_type: string;
  width?: number;
  height?: number;
  uploaded_at: string;
  uploaded_by?: string;
}

export const environmentLogoService = {
  /**
   * Faz upload de um logotipo para um ambiente
   * Salva tanto no Storage quanto em Base64 no banco (fallback)
   */
  async uploadLogo(
    environmentId: string,
    file: File
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      // Validar arquivo
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        return { success: false, error: 'Arquivo muito grande. Máximo 5MB.' };
      }

      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        return { success: false, error: 'Tipo de arquivo não suportado. Use PNG, JPG, SVG ou WebP.' };
      }

      // Converter para Base64 (fallback)
      const base64 = await this.fileToBase64(file);

      // Obter dimensões da imagem
      const dimensions = await this.getImageDimensions(file);

      // Preparar metadados com base64 incluído
      const metadata: LogoMetadata & { base64?: string } = {
        size_bytes: file.size,
        mime_type: file.type,
        width: dimensions?.width,
        height: dimensions?.height,
        uploaded_at: new Date().toISOString(),
        base64: base64, // Salvar base64 como fallback
      };

      let publicUrl: string | null = null;
      let storagePath: string | null = null;

      // Tentar fazer upload para o Supabase Storage
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${environmentId}-${Date.now()}.${fileExt}`;
        const filePath = `logos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('environment-logos')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
          });

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('environment-logos')
            .getPublicUrl(filePath);

          if (urlData.publicUrl) {
            publicUrl = urlData.publicUrl;
            storagePath = filePath;
            logger.info(`Logo uploaded to storage: ${publicUrl}`, 'environmentLogoService');
          }
        } else {
          logger.warn('Storage upload failed, using base64 fallback', uploadError, 'environmentLogoService');
        }
      } catch (storageError) {
        logger.warn('Storage upload exception, using base64 fallback', storageError, 'environmentLogoService');
      }

      // Atualizar registro do ambiente (com URL do storage ou null se falhou)
      // Usar service role para bypass de RLS (necessário no SaaS Admin Console)
      const { error: updateError } = await supabase
        .from('saas_environments')
        .update({
          logo_url: publicUrl,
          logo_storage_path: storagePath,
          logo_metadata: metadata,
          updated_at: new Date().toISOString(),
        })
        .eq('id', environmentId);

      if (updateError) {
        logger.error('Error updating environment logo', updateError, 'environmentLogoService');

        // Se falhar por RLS, tentar buscar o ambiente primeiro para confirmar existência
        const { data: envCheck } = await supabase
          .from('saas_environments')
          .select('id')
          .eq('id', environmentId)
          .maybeSingle();

        if (!envCheck) {
          return { success: false, error: 'Ambiente não encontrado' };
        }

        return { success: false, error: `Erro ao atualizar registro: ${updateError.message}` };
      }

      logger.info(`Logo saved for environment ${environmentId}`, 'environmentLogoService');
      return { success: true, url: publicUrl || base64 };
    } catch (error) {
      logger.error('Exception uploading logo', error, 'environmentLogoService');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  },

  /**
   * Remove o logotipo de um ambiente
   */
  async removeLogo(environmentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Buscar caminho do arquivo atual
      const { data: env, error: fetchError } = await supabase
        .from('saas_environments')
        .select('logo_storage_path')
        .eq('id', environmentId)
        .single();

      if (fetchError) {
        return { success: false, error: fetchError.message };
      }

      // Remover arquivo do storage (se existir)
      if (env.logo_storage_path) {
        const { error: deleteError } = await supabase.storage
          .from('environment-logos')
          .remove([env.logo_storage_path]);

        if (deleteError) {
          logger.error('Error deleting logo file', deleteError, 'environmentLogoService');
        }
      }

      // Limpar campos do ambiente
      const { error: updateError } = await supabase
        .from('saas_environments')
        .update({
          logo_url: null,
          logo_storage_path: null,
          logo_metadata: {},
          updated_at: new Date().toISOString(),
        })
        .eq('id', environmentId);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      logger.info(`Logo removed for environment ${environmentId}`, 'environmentLogoService');
      return { success: true };
    } catch (error) {
      logger.error('Exception removing logo', error, 'environmentLogoService');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  },

  /**
   * Converte arquivo para Base64
   */
  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsDataURL(file);
    });
  },

  /**
   * Obtém dimensões de uma imagem
   */
  async getImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) {
        resolve(null);
        return;
      }

      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.width, height: img.height });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };

      img.src = url;
    });
  },

  /**
   * Obtém o logotipo do ambiente atual
   * Retorna URL do storage ou base64 como fallback
   */
  async getCurrentEnvironmentLogo(environmentId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('saas_environments')
        .select('logo_url, logo_metadata')
        .eq('id', environmentId)
        .single();

      if (error || !data) {
        return null;
      }

      // Se tem URL do storage, usar
      if (data.logo_url) {
        return data.logo_url;
      }

      // Fallback: usar base64 do metadata
      if (data.logo_metadata && typeof data.logo_metadata === 'object') {
        const metadata = data.logo_metadata as any;
        if (metadata.base64) {
          return metadata.base64;
        }
      }

      return null;
    } catch (error) {
      logger.error('Error fetching environment logo', error, 'environmentLogoService');
      return null;
    }
  },

  /**
   * Obtém o logotipo com cache-busting baseado em updated_at
   */
  async getLogoWithCacheBusting(environmentId: string, updatedAt: string): Promise<string | null> {
    const logo = await this.getCurrentEnvironmentLogo(environmentId);
    if (!logo) return null;

    // Se for base64, retornar direto
    if (logo.startsWith('data:')) {
      return logo;
    }

    // Se for URL, adicionar cache-busting
    const timestamp = new Date(updatedAt).getTime();
    const separator = logo.includes('?') ? '&' : '?';
    return `${logo}${separator}v=${timestamp}`;
  },
};
