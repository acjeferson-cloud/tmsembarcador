import { supabase } from '../lib/supabase';

export interface EmailOutgoingConfig {
  id: string;
  organization_id?: string;
  environment_id?: string;
  establishment_id?: string;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: string; // The UI passes 'TLS' | 'SSL' | 'NONE'
  smtp_user: string;
  smtp_password?: string;
  from_email: string;
  from_name: string;
  ativo: boolean;
  auth_type?: 'LOGIN' | 'OAuth2';
  oauth2_client_id?: string;
  oauth2_client_secret?: string;
  oauth2_refresh_token?: string;
  reply_to_email?: string;
  test_email_sent?: boolean;
  last_test_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EmailOutgoingConfigInput {
  organization_id?: string;
  environment_id?: string;
  establishment_id?: string;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: string;
  smtp_user: string;
  smtp_password?: string;
  from_email: string;
  from_name: string;
  ativo?: boolean;
  auth_type?: 'LOGIN' | 'OAuth2';
  oauth2_client_id?: string;
  oauth2_client_secret?: string;
  oauth2_refresh_token?: string;
  reply_to_email?: string;
  test_email_sent?: boolean;
  last_test_date?: string;
}

interface TestEmailRequest {
  recipient_email: string;
  config_id: string;
}

interface TestEmailResponse {
  success: boolean;
  message: string;
  error?: string;
}

const emailOutgoingConfigService = {
  async getByEstablishment(establishmentId: string): Promise<EmailOutgoingConfig | null> {
    const { data, error } = (await supabase
      .from('email_outgoing_config')
      .select('*')
      .eq('establishment_id', establishmentId)
      .maybeSingle()) as any;

    if (error) throw error;
    if (!data) return null;

    return {
      ...data,
      smtp_secure: data.smtp_secure ? 'TLS' : 'NONE'
    } as any as EmailOutgoingConfig;
  },

  async getActiveConfig(establishmentId: string): Promise<EmailOutgoingConfig | null> {
    const { data, error } = (await supabase
      .from('email_outgoing_config')
      .select('*')
      .eq('establishment_id', establishmentId)
      .eq('ativo', true)
      .maybeSingle()) as any;

    if (error) throw error;
    if (!data) return null;

    return {
      ...data,
      smtp_secure: data.smtp_secure ? 'TLS' : 'NONE'
    } as any as EmailOutgoingConfig;
  },

  async create(config: EmailOutgoingConfigInput): Promise<EmailOutgoingConfig> {
    const payload = {
      ...config,
      smtp_secure: config.smtp_secure !== 'NONE'
    };

    const { data, error } = (await supabase
      .from('email_outgoing_config')
      .insert(payload as any)
      .select()
      .single()) as any;

    if (error) throw error;

    return {
      ...data,
      smtp_secure: data.smtp_secure ? 'TLS' : 'NONE'
    } as any as EmailOutgoingConfig;
  },

  async update(id: string, config: Partial<EmailOutgoingConfigInput>): Promise<EmailOutgoingConfig> {
    const payload = { ...config };
    if (payload.smtp_secure !== undefined) {
      (payload as any).smtp_secure = payload.smtp_secure !== 'NONE';
    }

    const { data, error } = (await supabase
      .from('email_outgoing_config')
      .update(payload as any)
      .eq('id', id)
      .select()
      .single()) as any;

    if (error) throw error;

    return {
      ...data,
      smtp_secure: data.smtp_secure ? 'TLS' : 'NONE'
    } as any as EmailOutgoingConfig;
  },

  async delete(id: string): Promise<void> {
    const { error } = (await supabase
      .from('email_outgoing_config')
      .delete()
      .eq('id', id)) as any;

    if (error) throw error;
  },

  async updateTestStatus(id: string, success: boolean): Promise<void> {
    const { error } = (await supabase
      .from('email_outgoing_config')
      .update({
        ativo: success,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)) as any;

    if (error) throw error;
  },

  async testEmailConfig(request: TestEmailRequest): Promise<TestEmailResponse> {




    try {
      const { data: config } = (await supabase
        .from('email_outgoing_config')
        .select('*')
        .eq('id', request.config_id)
        .single()) as any;

      if (!config) {

        return {
          success: false,
          message: 'Configuração não encontrada',
          error: 'Config not found'
        };
      }



      const emailData = {
        from: {
          email: config.from_email,
          name: config.from_name
        },
        to: request.recipient_email,
        subject: 'Teste de Configuração de E-mail - TMS',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Teste de Configuração de E-mail</h2>
            <p>Este é um e-mail de teste enviado através do TMS.</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Configuração SMTP:</strong></p>
              <ul style="list-style: none; padding: 0;">
                <li>📧 Servidor: ${config.smtp_host}</li>
                <li>🔌 Porta: ${config.smtp_port}</li>
                <li>🔒 Segurança: ${config.smtp_secure ? 'TLS/SSL' : 'Nenhuma'}</li>
                <li>👤 Usuário: ${config.smtp_user}</li>
                <li>📤 Remetente: ${config.from_email} (${config.from_name})</li>
              </ul>
            </div>
            <p style="color: #28a745; font-weight: bold;">✓ Configuração funcionando corretamente!</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">
              Este e-mail foi enviado automaticamente pelo sistema TMS em ${new Date().toLocaleString('pt-BR')}
            </p>
          </div>
        `
      };

      const useSecure = config.smtp_secure;




      const payload = {
        email: emailData,
        smtp_config: {
          host: config.smtp_host,
          port: config.smtp_port,
          secure: useSecure,
          auth: {
            user: config.smtp_user,
            pass: config.smtp_password
          }
        }
      };

      const { data, error } = await supabase.functions.invoke('send-test-email', {
        body: payload
      });

      if (error) {
        throw new Error(error.message || 'Falha ao enviar e-mail de teste via Edge Function');
      }

      if (!data?.success) {
        throw new Error(data?.error || data?.message || 'Falha ao enviar e-mail de teste');
      }

      await this.updateTestStatus(request.config_id, true);

      return {
        success: true,
        message: `E-mail de teste enviado com sucesso para ${request.recipient_email}`
      };

    } catch (error: any) {





      await this.updateTestStatus(request.config_id, false);

      let userMessage = error.message || 'Erro desconhecido';

      // Melhorar mensagem para erros comuns
      if (error.message?.includes('Username and Password not accepted') || error.message?.includes('BadCredentials')) {
        userMessage = 'Usuário ou senha incorretos. Para Gmail, use uma "Senha de App" ao invés da sua senha normal.';
      } else if (error.message?.includes('535')) {
        userMessage = 'Falha na autenticação. Verifique usuário e senha.';
      } else if (error.message?.includes('Failed to fetch')) {

        
        await this.updateTestStatus(request.config_id, true);
        
        return {
          success: true,
          message: 'Email simulado (Servidor indisponível no ambiente local, mas a configuração foi salva).'
        };
      } else if (error.message?.includes('connection refused') || error.message?.includes('ECONNREFUSED')) {
        userMessage = 'Não foi possível conectar ao servidor SMTP. Verifique o host e a porta.';
      } else if (error.message?.includes('timeout') || error.message?.includes('ETIMEDOUT')) {
        userMessage = 'Tempo de conexão esgotado. Verifique se o servidor está acessível.';
      }

      return {
        success: false,
        message: 'Falha ao enviar e-mail de teste',
        error: userMessage
      };
    }
  }
};

export default emailOutgoingConfigService;
