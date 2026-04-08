import { supabase } from '../lib/supabase';

interface LogoUploadResult {
  success: boolean;
  logoUrl?: string;
  error?: string;
}

export const logoStorageService = {
  async uploadLogoFromBase64(
    estabelecimentoId: string,
    base64Data: string,
    logoType: 'light' | 'dark' | 'nps' = 'light'
  ): Promise<LogoUploadResult> {
    try {
      if (!base64Data || !base64Data.startsWith('data:image/')) {
        return {
          success: false,
          error: 'Dados de imagem inválidos',
        };
      }

      const matches = base64Data.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return {
          success: false,
          error: 'Formato base64 inválido',
        };
      }

      const imageType = matches[1];
      const base64Content = matches[2];

      const byteCharacters = atob(base64Content);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: `image/${imageType}` });

      const fileName = `${estabelecimentoId}_${logoType}.${imageType}`;
      const filePath = `establishments/${fileName}`;

      const { data: existingFiles } = await supabase.storage
        .from('logos')
        .list('establishments', {
          search: `${estabelecimentoId}_${logoType}.`,
        });

      if (existingFiles && existingFiles.length > 0) {
        for (const file of existingFiles) {
          await supabase.storage
            .from('logos')
            .remove([`establishments/${file.name}`]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {

        return {
          success: false,
          error: uploadError.message,
        };
      }

      const { data: publicUrlData } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      if (!publicUrlData?.publicUrl) {
        return {
          success: false,
          error: 'Erro ao obter URL pública',
        };
      }

      // Add cache buster to URL to force UI to load the new image
      const timestamp = new Date().getTime();
      const bustedUrl = `${publicUrlData.publicUrl}?t=${timestamp}`;

      return {
        success: true,
        logoUrl: bustedUrl,
      };
    } catch (error: any) {

      return {
        success: false,
        error: error.message || 'Erro desconhecido',
      };
    }
  },

  async deleteLogoFromStorage(estabelecimentoId: string): Promise<boolean> {
    try {
      const { data: files } = await supabase.storage
        .from('logos')
        .list('establishments', {
          search: `${estabelecimentoId}_`,
        });

      if (!files || files.length === 0) {
        return true;
      }

      for (const file of files) {
        await supabase.storage
          .from('logos')
          .remove([`establishments/${file.name}`]);
      }

      return true;
    } catch (error) {

      return false;
    }
  },

  async removeLogoType(estabelecimentoId: string, logoType: 'light' | 'dark' | 'nps'): Promise<boolean> {
    try {
      const { data: files } = await supabase.storage
        .from('logos')
        .list('establishments', {
          search: `${estabelecimentoId}_${logoType}.`,
        });

      if (!files || files.length === 0) return true;

      for (const file of files) {
        await supabase.storage
          .from('logos')
          .remove([`establishments/${file.name}`]);
      }
      return true;
    } catch (error) {
      return false;
    }
  },
};
