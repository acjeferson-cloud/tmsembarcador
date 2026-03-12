import { supabase } from '../lib/supabase';

export interface WhiteLabelConfig {
  id: string;
  tenant_id: string;
  is_enabled: boolean;
  brand_name: string;
  company_name?: string;
  tagline?: string;
  support_url?: string;
  contact_email?: string;
  contact_phone?: string;
  privacy_policy_url?: string;
  terms_of_service_url?: string;
  hide_powered_by: boolean;
  custom_footer_text?: string;
  custom_login_message?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface WhiteLabelTheme {
  id: string;
  tenant_id: string;
  name: string;
  is_active: boolean;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  header_bg_color: string;
  header_text_color: string;
  sidebar_bg_color: string;
  sidebar_text_color: string;
  button_primary_bg: string;
  button_primary_text: string;
  link_color: string;
  success_color: string;
  warning_color: string;
  error_color: string;
  info_color: string;
  border_radius: string;
  font_family: string;
  theme_mode: 'light' | 'dark' | 'auto';
  custom_css?: string;
}

export interface WhiteLabelAsset {
  id: string;
  tenant_id: string;
  asset_type: 'logo' | 'logo_small' | 'favicon' | 'background' | 'email_header' | 'custom';
  file_name: string;
  file_url: string;
  file_size?: number;
  mime_type?: string;
  width?: number;
  height?: number;
  is_active: boolean;
  metadata?: any;
}

export interface WhiteLabelDomain {
  id: string;
  tenant_id: string;
  domain: string;
  domain_type: 'subdomain' | 'custom';
  is_primary: boolean;
  status: 'pending' | 'verifying' | 'active' | 'failed' | 'suspended';
  dns_verification_token?: string;
  dns_verified_at?: string;
  ssl_status: 'pending' | 'issuing' | 'active' | 'expired' | 'failed';
  ssl_provider: string;
  ssl_expires_at?: string;
  error_message?: string;
}

export interface WhiteLabelTemplate {
  id: string;
  name: string;
  description?: string;
  category?: string;
  is_public: boolean;
  theme_config: any;
  assets_config?: any;
  texts_config?: any;
  preview_image_url?: string;
  usage_count: number;
}

export const whiteLabelService = {
  // ===== CONFIGURAÇÕES =====
  async getConfig(tenantId: string): Promise<WhiteLabelConfig | null> {
    try {
      const { data, error } = await supabase
        .from('white_label_configs')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {

      return null;
    }
  },

  async createConfig(config: Partial<WhiteLabelConfig>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('white_label_configs')
        .insert({
          ...config,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, id: data.id };
    } catch (error: any) {

      return { success: false, error: error.message };
    }
  },

  async updateConfig(tenantId: string, config: Partial<WhiteLabelConfig>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('white_label_configs')
        .update({
          ...config,
          updated_at: new Date().toISOString()
        })
        .eq('tenant_id', tenantId);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error: any) {

      return { success: false, error: error.message };
    }
  },

  // ===== TEMAS =====
  async getThemes(tenantId: string): Promise<WhiteLabelTheme[]> {
    try {
      const { data, error } = await supabase
        .from('white_label_themes')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {

      return [];
    }
  },

  async getActiveTheme(tenantId: string): Promise<WhiteLabelTheme | null> {
    try {
      const { data, error } = await supabase
        .from('white_label_themes')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {

      return null;
    }
  },

  async createTheme(theme: Partial<WhiteLabelTheme>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('white_label_themes')
        .insert(theme)
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, id: data.id };
    } catch (error: any) {

      return { success: false, error: error.message };
    }
  },

  async updateTheme(id: string, theme: Partial<WhiteLabelTheme>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('white_label_themes')
        .update(theme)
        .eq('id', id);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error: any) {

      return { success: false, error: error.message };
    }
  },

  async activateTheme(tenantId: string, themeId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await supabase
        .from('white_label_themes')
        .update({ is_active: false })
        .eq('tenant_id', tenantId);

      const { error } = await supabase
        .from('white_label_themes')
        .update({ is_active: true })
        .eq('id', themeId);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error: any) {

      return { success: false, error: error.message };
    }
  },

  async deleteTheme(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('white_label_themes')
        .delete()
        .eq('id', id);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error: any) {

      return { success: false, error: error.message };
    }
  },

  // ===== ASSETS =====
  async getAssets(tenantId: string, assetType?: string): Promise<WhiteLabelAsset[]> {
    try {
      let query = supabase
        .from('white_label_assets')
        .select('*')
        .eq('tenant_id', tenantId);

      if (assetType) {
        query = query.eq('asset_type', assetType);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {

      return [];
    }
  },

  async createAsset(asset: Partial<WhiteLabelAsset>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('white_label_assets')
        .insert(asset)
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, id: data.id };
    } catch (error: any) {

      return { success: false, error: error.message };
    }
  },

  async deleteAsset(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('white_label_assets')
        .delete()
        .eq('id', id);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error: any) {

      return { success: false, error: error.message };
    }
  },

  // ===== DOMÍNIOS =====
  async getDomains(tenantId: string): Promise<WhiteLabelDomain[]> {
    try {
      const { data, error } = await supabase
        .from('white_label_domains')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {

      return [];
    }
  },

  async createDomain(domain: Partial<WhiteLabelDomain>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const verificationToken = Math.random().toString(36).substring(2, 15);

      const { data, error } = await supabase
        .from('white_label_domains')
        .insert({
          ...domain,
          dns_verification_token: verificationToken
        })
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, id: data.id };
    } catch (error: any) {

      return { success: false, error: error.message };
    }
  },

  async updateDomain(id: string, domain: Partial<WhiteLabelDomain>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('white_label_domains')
        .update(domain)
        .eq('id', id);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error: any) {

      return { success: false, error: error.message };
    }
  },

  async deleteDomain(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('white_label_domains')
        .delete()
        .eq('id', id);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error: any) {

      return { success: false, error: error.message };
    }
  },

  // ===== TEMPLATES =====
  async getTemplates(): Promise<WhiteLabelTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('white_label_templates')
        .select('*')
        .eq('is_public', true)
        .order('usage_count', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {

      return [];
    }
  },

  async applyTemplate(tenantId: string, templateId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: template, error: templateError } = await supabase
        .from('white_label_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (templateError) return { success: false, error: templateError.message };

      const themeConfig = template.theme_config;
      const result = await this.createTheme({
        tenant_id: tenantId,
        name: `${template.name} - Aplicado`,
        is_active: true,
        ...themeConfig
      });

      if (result.success) {
        await supabase
          .from('white_label_templates')
          .update({ usage_count: template.usage_count + 1 })
          .eq('id', templateId);
      }

      return result;
    } catch (error: any) {

      return { success: false, error: error.message };
    }
  }
};
