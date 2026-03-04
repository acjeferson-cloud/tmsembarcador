import { supabase } from '../lib/supabase';

export interface EmailOutgoingConfig {
  id: string;
  organization_id?: string;
  environment_id?: string;
  establishment_id?: string;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_user: string;
  smtp_password: string;
  from_email: string;
  from_name: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailOutgoingConfigInput {
  organization_id?: string;
  environment_id?: string;
  establishment_id?: string;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_user: string;
  smtp_password: string;
  from_email: string;
  from_name: string;
  ativo?: boolean;
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
    const { data, error } = await supabase
      .from('email_outgoing_config')
      .select('*')
      .eq('establishment_id', establishmentId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getActiveConfig(establishmentId: string): Promise<EmailOutgoingConfig | null> {
    const { data, error } = await supabase
      .from('email_outgoing_config')
      .select('*')
      .eq('establishment_id', establishmentId)
      .eq('ativo', true)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async create(config: EmailOutgoingConfigInput): Promise<EmailOutgoingConfig> {
    const { data, error } = await supabase
      .from('email_outgoing_config')
      .insert(config)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, config: Partial<EmailOutgoingConfigInput>): Promise<EmailOutgoingConfig> {
    const { data, error } = await supabase
      .from('email_outgoing_config')
      .update(config)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('email_outgoing_config')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async updateTestStatus(id: string, success: boolean): Promise<void> {
    const { error } = await supabase
      .from('email_outgoing_config')
      .update({
        ativo: success,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
  },

  async testEmailConfig(request: TestEmailRequest): Promise<TestEmailResponse> {
    console.log('🔵 [EMAIL SERVICE] Iniciando teste de email...');
    console.log('🔵 [EMAIL SERVICE] Config ID:', request.config_id);
    console.log('🔵 [EMAIL SERVICE] Destinatário:', request.recipient_email);

    try {
      const { data: config } = await supabase
        .from('email_outgoing_config')
        .select('*')
        .eq('id', request.config_id)
        .single();

      if (!config) {
        console.error('🔴 [EMAIL SERVICE] Configuração não encontrada');
        return {
          success: false,
          message: 'Configuração não encontrada',
          error: 'Config not found'
        };
      }

      console.log('🔵 [EMAIL SERVICE] Configuração carregada:', {
        host: config.smtp_host,
        port: config.smtp_port,
        secure: config.smtp_secure,
        user: config.smtp_user,
        sender: config.from_email
      });

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

      console.log('🔵 [EMAIL SERVICE] Preparando payload para edge function...');
      console.log('🔵 [EMAIL SERVICE] Use Secure:', useSecure);

      const payload = {
        email: emailData,
        smtp_config: {
          host: config.smtp_host,
          port: config.smtp_port,
          secure: useSecure,
          auth: {
            user: config.smtp_user,
            pass: config.smtp_password ? '***' : 'VAZIO'
          }
        }
      };

      console.log('🔵 [EMAIL SERVICE] Payload (senha oculta):', JSON.stringify(payload, null, 2));

      const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-test-email`;
      console.log('🔵 [EMAIL SERVICE] URL da edge function:', edgeFunctionUrl);

      console.log('🔵 [EMAIL SERVICE] Chamando edge function...');

      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
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
        })
      });

      console.log('🔵 [EMAIL SERVICE] Resposta recebida da edge function');
      console.log('🔵 [EMAIL SERVICE] Status:', response.status);
      console.log('🔵 [EMAIL SERVICE] Status Text:', response.statusText);
      console.log('🔵 [EMAIL SERVICE] Headers:', Object.fromEntries(response.headers.entries()));

      const responseText = await response.text();
      console.log('🔵 [EMAIL SERVICE] Response Body (raw):', responseText);

      let responseData;
      try {
        responseData = JSON.parse(responseText);
        console.log('🔵 [EMAIL SERVICE] Response Body (parsed):', responseData);
      } catch (e) {
        console.error('🔴 [EMAIL SERVICE] Erro ao fazer parse do JSON:', e);
        console.error('🔴 [EMAIL SERVICE] Response text:', responseText);
      }

      if (!response.ok) {
        console.error('🔴 [EMAIL SERVICE] Edge function retornou erro');
        console.error('🔴 [EMAIL SERVICE] Status:', response.status);
        console.error('🔴 [EMAIL SERVICE] Error data:', responseData);

        // Exibir logs mesmo em caso de erro
        if (responseData?.logs && Array.isArray(responseData.logs)) {
          console.error('📋 [LOGS DO SERVIDOR SMTP - ERRO]');
          console.error('═'.repeat(60));
          responseData.logs.forEach((log: string) => console.error(log));
          console.error('═'.repeat(60));
        }

        const errorMsg = responseData?.message || responseData?.error || 'Falha ao enviar e-mail de teste';
        throw new Error(errorMsg);
      }

      console.log('✅ [EMAIL SERVICE] Edge function executada com sucesso!');
      console.log('✅ [EMAIL SERVICE] Detalhes:', responseData?.details);

      // Exibir logs da edge function
      if (responseData?.logs && Array.isArray(responseData.logs)) {
        console.log('📋 [LOGS DO SERVIDOR SMTP]');
        console.log('═'.repeat(60));
        responseData.logs.forEach((log: string) => console.log(log));
        console.log('═'.repeat(60));
      }

      await this.updateTestStatus(request.config_id, true);
      console.log('✅ [EMAIL SERVICE] Status de teste atualizado no banco');

      return {
        success: true,
        message: `E-mail de teste enviado com sucesso para ${request.recipient_email}`
      };

    } catch (error: any) {
      console.error('🔴 [EMAIL SERVICE] Erro ao testar configuração de email:', error);
      console.error('🔴 [EMAIL SERVICE] Error name:', error.name);
      console.error('🔴 [EMAIL SERVICE] Error message:', error.message);
      console.error('🔴 [EMAIL SERVICE] Error stack:', error.stack);

      await this.updateTestStatus(request.config_id, false);

      let userMessage = error.message || 'Erro desconhecido';

      // Melhorar mensagem para erros comuns
      if (error.message?.includes('Username and Password not accepted') || error.message?.includes('BadCredentials')) {
        userMessage = 'Usuário ou senha incorretos. Para Gmail, use uma "Senha de App" ao invés da sua senha normal.';
      } else if (error.message?.includes('535')) {
        userMessage = 'Falha na autenticação. Verifique usuário e senha.';
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
