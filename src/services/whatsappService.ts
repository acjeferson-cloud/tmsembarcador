import { supabase } from '../lib/supabase';
import { setSessionContext } from '../lib/sessionContext';
import { whatsappTransactionsService } from './whatsappTransactionsService';

export interface WhatsAppConfig {
  id?: string;
  access_token: string;
  phone_number_id: string;
  business_account_id: string;
  webhook_verify_token?: string;
  is_active: boolean;
  last_tested_at?: string;
  test_status?: string;
  created_by?: string;
  organization_id?: string;
  environment_id?: string;
}

export interface WhatsAppTemplate {
  id?: string;
  template_name: string;
  template_language: string;
  category: string;
  header_text?: string;
  body_text: string;
  footer_text?: string;
  variables?: any[];
  is_active: boolean;
  meta_template_id?: string;
  approval_status: string;
  description?: string;
  created_by?: string;
  organization_id?: string;
  environment_id?: string;
}

interface WhatsAppMessageLog {
  id?: string;
  message_id?: string;
  wamid?: string;
  order_id?: string;
  template_id?: string;
  recipient_name?: string;
  recipient_phone: string;
  template_name?: string;
  message_content: string;
  message_type?: string;
  status: string;
  status_details?: string;
  sent_by?: number | string;
  sent_by_name?: string;
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  failed_at?: string;
  unit_cost?: number;
  currency?: string;
  error_message?: string;
  error_code?: string;
  api_response?: any;
  organization_id?: string;
  environment_id?: string;
}

interface SendMessageParams {
  recipientPhone: string;
  recipientName?: string;
  templateName?: string;
  messageContent: string;
  orderId?: string;
  userId?: number;
  userName?: string;
  templateVariables?: string[];
}

// Helper para obter organização e ambiente do contexto
function getUserOrganization(): { organizationId: string; environmentId: string } | null {
  try {
    // Buscar do localStorage (salvo no login)
    const orgId = localStorage.getItem('tms-selected-org-id');
    const envId = localStorage.getItem('tms-selected-env-id');

    if (!orgId || !envId) {
      console.error('❌ [whatsappService] Contexto org/env não encontrado');
      return null;
    }

    return {
      organizationId: orgId,
      environmentId: envId
    };
  } catch (error) {
    console.error('❌ [whatsappService] Erro ao obter contexto:', error);
    return null;
  }
}

class WhatsAppService {
  private readonly WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';

  async getActiveConfig(): Promise<WhatsAppConfig | null> {
    try {
      console.log('💬 [WHATSAPP] Loading config...');

      const userOrg = getUserOrganization();
      if (!userOrg) {
        console.error('❌ [WHATSAPP] No user org');
        return null;
      }

      const { organizationId, environmentId } = userOrg;

      // CRÍTICO: Configurar contexto ANTES de buscar dados
      console.log('🔐 [WHATSAPP] Configurando contexto de sessão...');
      const contextResult = await setSessionContext(organizationId, environmentId);
      if (!contextResult.success) {
        console.error('❌ [WHATSAPP] Erro ao configurar contexto:', contextResult.error);
        return null;
      }
      console.log('✅ [WHATSAPP] Contexto de sessão configurado');

      const { data, error } = await supabase
        .from('whatsapp_config')
        .select('*')
        .eq('is_active', true)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('❌ [WHATSAPP] Error:', error);
        throw error;
      }

      console.log('✅ [WHATSAPP] Config:', data ? 'Found' : 'Not found');
      return data;
    } catch (error) {
      console.error('Erro ao buscar configuração do WhatsApp:', error);
      return null;
    }
  }

  async saveConfig(config: WhatsAppConfig): Promise<{ success: boolean; error?: string }> {
    try {
      const userOrg = getUserOrganization();
      if (!userOrg) {
        throw new Error('Contexto de organização não encontrado');
      }

      const { organizationId, environmentId } = userOrg;

      // CRÍTICO: Configurar o contexto de sessão ANTES de salvar
      // Isso garante que as políticas RLS funcionem corretamente
      console.log('🔐 [whatsappService] Configurando contexto de sessão...');
      const contextResult = await setSessionContext(organizationId, environmentId);
      if (!contextResult.success) {
        console.error('❌ [whatsappService] Erro ao configurar contexto:', contextResult.error);
        throw new Error('Erro ao configurar contexto de sessão: ' + contextResult.error);
      }
      console.log('✅ [whatsappService] Contexto de sessão configurado');

      const { data: existingConfigs, error: fetchError } = await supabase
        .from('whatsapp_config')
        .select('id')
        .eq('is_active', true)
        .eq('organization_id', organizationId);

      if (fetchError) throw fetchError;

      if (existingConfigs && existingConfigs.length > 0) {
        const { error: updateError } = await supabase
          .from('whatsapp_config')
          .update({ is_active: false })
          .in('id', existingConfigs.map(c => c.id));

        if (updateError) throw updateError;
      }

      console.log('💾 [whatsappService] Salvando configuração do WhatsApp...');
      console.log('💾 [whatsappService] Dados a salvar:', {
        access_token: config.access_token ? '***' : undefined,
        phone_number_id: config.phone_number_id,
        business_account_id: config.business_account_id,
        webhook_verify_token: config.webhook_verify_token ? '***' : undefined,
        is_active: true,
        created_by: config.created_by,
        organization_id: organizationId,
        environment_id: environmentId
      });

      const { error: insertError } = await supabase
        .from('whatsapp_config')
        .insert({
          access_token: config.access_token,
          phone_number_id: config.phone_number_id,
          business_account_id: config.business_account_id,
          webhook_verify_token: config.webhook_verify_token,
          is_active: true,
          created_by: config.created_by,
          organization_id: organizationId,
          environment_id: environmentId,
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('❌ [whatsappService] Erro ao inserir configuração');
        console.error('❌ [whatsappService] Error code:', insertError.code);
        console.error('❌ [whatsappService] Error message:', insertError.message);
        console.error('❌ [whatsappService] Error details:', insertError.details);
        console.error('❌ [whatsappService] Error hint:', insertError.hint);
        console.error('❌ [whatsappService] Full error:', JSON.stringify(insertError, null, 2));
        throw insertError;
      }

      console.log('✅ [whatsappService] Configuração salva com sucesso');
      return { success: true };
    } catch (error) {
      console.error('❌ [whatsappService] Erro geral ao salvar configuração:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return { success: false, error: `Erro ao salvar configuração do WhatsApp: ${errorMessage}` };
    }
  }

  async updateConfigTestStatus(
    configId: string,
    testStatus: string
  ): Promise<void> {
    try {
      await supabase
        .from('whatsapp_config')
        .update({
          test_status: testStatus,
          last_tested_at: new Date().toISOString()
        })
        .eq('id', configId);
    } catch (error) {
      console.error('Erro ao atualizar status de teste:', error);
    }
  }

  async testConnection(config: WhatsAppConfig): Promise<{ success: boolean; error?: string }> {
    try {
      const url = `${this.WHATSAPP_API_URL}/${config.phone_number_id}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Erro ao testar conexão');
      }

      if (config.id) {
        await this.updateConfigTestStatus(config.id, 'success');
      }

      return { success: true };
    } catch (error: any) {
      console.error('Erro ao testar conexão:', error);

      if (config.id) {
        await this.updateConfigTestStatus(config.id, 'failed');
      }

      return {
        success: false,
        error: error.message || 'Erro ao testar conexão com WhatsApp API'
      };
    }
  }

  async sendMessage(params: SendMessageParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const config = await this.getActiveConfig();

      if (!config) {
        throw new Error('Configuração do WhatsApp não encontrada. Configure em Configurações > Integrações.');
      }

      const cleanPhone = params.recipientPhone.replace(/\D/g, '');

      if (!cleanPhone || cleanPhone.length < 10) {
        throw new Error('Número de telefone inválido');
      }

      const url = `${this.WHATSAPP_API_URL}/${config.phone_number_id}/messages`;

      let requestBody: any;

      // Se não tiver template selecionado, envia como mensagem de texto simples
      if (!params.templateName) {
        requestBody = {
          messaging_product: 'whatsapp',
          to: cleanPhone,
          type: 'text',
          text: {
            body: params.messageContent
          }
        };
      }
      // Se tiver template com variáveis
      else if (params.templateVariables && params.templateVariables.length > 0) {
        // Filtrar variáveis vazias
        const validVariables = params.templateVariables.filter(v => v && v.trim());

        // Se todas as variáveis estão preenchidas, enviar com parâmetros
        if (validVariables.length === params.templateVariables.length) {
          requestBody = {
            messaging_product: 'whatsapp',
            to: cleanPhone,
            type: 'template',
            template: {
              name: params.templateName,
              language: {
                code: 'pt_BR'
              },
              components: [
                {
                  type: 'body',
                  parameters: params.templateVariables.map(value => ({
                    type: 'text',
                    text: value
                  }))
                }
              ]
            }
          };
        } else {
          throw new Error('Preencha todas as variáveis do template antes de enviar');
        }
      }
      // Se tiver template sem variáveis
      else {
        requestBody = {
          messaging_product: 'whatsapp',
          to: cleanPhone,
          type: 'template',
          template: {
            name: params.templateName,
            language: {
              code: 'pt_BR'
            }
          }
        };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const responseData = await response.json();

      if (!response.ok) {
        const errorMessage = responseData.error?.message || 'Erro ao enviar mensagem';
        const errorCode = responseData.error?.code;

        // Mensagens de erro mais amigáveis
        if (errorCode === 132000) {
          throw new Error('O número de parâmetros não corresponde ao esperado pelo template. Verifique se todas as variáveis estão preenchidas corretamente ou use "Mensagem livre (sem template)".');
        } else if (errorCode === 132001) {
          throw new Error('Template não existe ou não está aprovado pela Meta. Use "Mensagem livre (sem template)" ou configure um template válido.');
        } else if (errorCode === 131026) {
          throw new Error('Número de telefone inválido ou não possui WhatsApp ativo.');
        } else if (errorCode === 131047) {
          throw new Error('Não é possível enviar mensagem para este número. Verifique se o número está correto.');
        } else if (errorMessage.includes('template')) {
          throw new Error(`Erro no template: ${errorMessage}`);
        } else if (errorMessage.includes('parameters')) {
          throw new Error('Erro nos parâmetros do template. Verifique se todas as variáveis estão corretas ou use "Mensagem livre (sem template)".');
        }

        throw new Error(errorMessage);
      }

      const messageId = responseData.messages?.[0]?.id;

      const logResult = await this.logMessage({
        message_id: messageId,
        order_id: params.orderId,
        recipient_name: params.recipientName,
        recipient_phone: cleanPhone,
        template_name: params.templateName,
        message_content: params.messageContent,
        status: 'sent',
        sent_by: params.userId,
        sent_by_name: params.userName,
        api_response: responseData
      });

      // Registrar transação financeira
      try {
        const messageType = params.templateName ? 'template' : 'texto';
        const unitCost = this.calculateMessageCost(messageType);

        await whatsappTransactionsService.createTransaction({
          message_log_id: logResult?.id,
          transaction_type: 'envio',
          message_type: messageType,
          recipient_phone: cleanPhone,
          recipient_name: params.recipientName,
          unit_cost: unitCost,
          status: 'enviada',
          message_id: messageId,
          order_id: params.orderId,
          template_name: params.templateName
        });
      } catch (transactionError) {
        console.error('Erro ao registrar transação:', transactionError);
      }

      return { success: true, messageId };
    } catch (error: any) {
      console.error('Erro ao enviar mensagem WhatsApp:', error);

      await this.logMessage({
        order_id: params.orderId,
        recipient_name: params.recipientName,
        recipient_phone: params.recipientPhone,
        template_name: params.templateName,
        message_content: params.messageContent,
        status: 'failed',
        sent_by: params.userId,
        sent_by_name: params.userName,
        error_message: error.message
      });

      return {
        success: false,
        error: error.message || 'Erro ao enviar mensagem pelo WhatsApp'
      };
    }
  }

  async logMessage(log: WhatsAppMessageLog): Promise<{ id: string } | null> {
    try {
      const userOrg = getUserOrganization();
      if (!userOrg) {
        return null;
      }

      const { organizationId, environmentId } = userOrg;

      const { data, error } = await supabase
        .from('whatsapp_messages_log')
        .insert({
          message_id: log.message_id,
          wamid: log.wamid,
          order_id: log.order_id,
          template_id: log.template_id,
          recipient_name: log.recipient_name,
          recipient_phone: log.recipient_phone,
          template_name: log.template_name,
          message_content: log.message_content,
          message_type: log.message_type || 'template',
          status: log.status,
          status_details: log.status_details,
          sent_by: log.sent_by,
          sent_by_name: log.sent_by_name,
          sent_at: log.sent_at || new Date().toISOString(),
          delivered_at: log.delivered_at,
          read_at: log.read_at,
          failed_at: log.failed_at,
          unit_cost: log.unit_cost || 0.10,
          currency: log.currency || 'BRL',
          error_message: log.error_message,
          error_code: log.error_code,
          api_response: log.api_response,
          organization_id: organizationId,
          environment_id: environmentId
        })
        .select('id')
        .single();

      if (error) {
        console.error('Erro ao registrar log de mensagem:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro ao registrar log de mensagem:', error);
      return null;
    }
  }

  private calculateMessageCost(messageType: string): number {
    const costs: { [key: string]: number } = {
      texto: 0.0100,
      imagem: 0.0150,
      template: 0.0120,
      documento: 0.0150,
      audio: 0.0120,
      video: 0.0200,
      localizacao: 0.0100
    };

    return costs[messageType] || 0.0100;
  }

  async getMessageLogs(orderId?: string): Promise<WhatsAppMessageLog[]> {
    try {
      const userOrg = getUserOrganization();
      if (!userOrg) {
        return [];
      }

      const { organizationId, environmentId } = userOrg;

      // CRÍTICO: Configurar contexto ANTES de buscar dados
      const contextResult = await setSessionContext(organizationId, environmentId);
      if (!contextResult.success) {
        console.error('❌ [WHATSAPP] Erro ao configurar contexto:', contextResult.error);
        return [];
      }

      let query = supabase
        .from('whatsapp_messages_log')
        .select('*')
        .eq('organization_id', organizationId)
        .order('sent_at', { ascending: false });

      if (orderId) {
        query = query.eq('order_id', orderId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar logs de mensagens:', error);
      return [];
    }
  }

  async getTemplates(): Promise<WhatsAppTemplate[]> {
    try {
      const userOrg = getUserOrganization();
      if (!userOrg) {
        return [];
      }

      const { organizationId, environmentId } = userOrg;

      // CRÍTICO: Configurar contexto ANTES de buscar dados
      const contextResult = await setSessionContext(organizationId, environmentId);
      if (!contextResult.success) {
        console.error('❌ [WHATSAPP] Erro ao configurar contexto:', contextResult.error);
        return [];
      }

      const { data, error } = await supabase
        .from('whatsapp_templates')
        .select('*')
        .eq('is_active', true)
        .eq('approval_status', 'APPROVED')
        .eq('organization_id', organizationId)
        .order('template_name');

      if (error) throw error;

      // Garantir que todos os campos necessários existem
      const templates = (data || []).map(t => ({
        ...t,
        template_name: t.template_name || '',
        template_language: t.template_language || 'pt_BR',
        category: t.category || 'UTILITY',
        body_text: t.body_text || '',
        approval_status: t.approval_status || 'APPROVED',
        is_active: t.is_active !== undefined ? t.is_active : true,
        description: t.description || ''
      }));

      return templates;
    } catch (error) {
      console.error('Erro ao buscar templates:', error);
      return [];
    }
  }

  async getAllTemplates(): Promise<WhatsAppTemplate[]> {
    try {
      const userOrg = getUserOrganization();
      if (!userOrg) {
        return [];
      }

      const { organizationId, environmentId } = userOrg;

      // CRÍTICO: Configurar contexto ANTES de buscar dados
      const contextResult = await setSessionContext(organizationId, environmentId);
      if (!contextResult.success) {
        console.error('❌ [WHATSAPP] Erro ao configurar contexto:', contextResult.error);
        return [];
      }

      const { data, error } = await supabase
        .from('whatsapp_templates')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Garantir que todos os campos necessários existem
      const templates = (data || []).map(t => ({
        ...t,
        template_name: t.template_name || '',
        template_language: t.template_language || 'pt_BR',
        category: t.category || 'UTILITY',
        body_text: t.body_text || '',
        approval_status: t.approval_status || 'PENDING',
        is_active: t.is_active !== undefined ? t.is_active : true
      }));

      return templates;
    } catch (error) {
      console.error('Erro ao buscar todos os templates:', error);
      return [];
    }
  }

  async saveTemplate(template: WhatsAppTemplate): Promise<{ success: boolean; error?: string }> {
    try {
      const userOrg = getUserOrganization();
      if (!userOrg) {
        throw new Error('Usuário não autenticado');
      }

      const { organizationId, environmentId } = userOrg;

      // CRÍTICO: Configurar o contexto de sessão ANTES de salvar
      const contextResult = await setSessionContext(organizationId, environmentId);
      if (!contextResult.success) {
        throw new Error('Erro ao configurar contexto de sessão: ' + contextResult.error);
      }

      if (template.id) {
        const { error } = await supabase
          .from('whatsapp_templates')
          .update({
            template_language: template.template_language,
            category: template.category,
            header_text: template.header_text,
            body_text: template.body_text,
            footer_text: template.footer_text,
            variables: template.variables,
            is_active: template.is_active,
            meta_template_id: template.meta_template_id,
            approval_status: template.approval_status,
            description: template.description,
            updated_at: new Date().toISOString()
          })
          .eq('id', template.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('whatsapp_templates')
          .insert({
            template_name: template.template_name,
            template_language: template.template_language,
            category: template.category,
            header_text: template.header_text,
            body_text: template.body_text,
            footer_text: template.footer_text,
            variables: template.variables,
            is_active: template.is_active,
            meta_template_id: template.meta_template_id,
            approval_status: template.approval_status,
            description: template.description,
            created_by: template.created_by,
            organization_id: organizationId,
            environment_id: environmentId
          });

        if (error) throw error;
      }

      return { success: true };
    } catch (error: any) {
      console.error('Erro ao salvar template:', error);
      return {
        success: false,
        error: error.message || 'Erro ao salvar template'
      };
    }
  }

  async deleteTemplate(templateId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('whatsapp_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Erro ao deletar template:', error);
      return {
        success: false,
        error: error.message || 'Erro ao deletar template'
      };
    }
  }
}

export const whatsappService = new WhatsAppService();
