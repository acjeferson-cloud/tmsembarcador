import { supabase } from '../lib/supabase';
import { orderNotificationTemplateService } from './orderNotificationTemplateService';

export const orderNotificationService = {
  async sendOrderCreatedNotifications(orderId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[orderNotificationService] Iniciando envio de notificações para pedido:', orderId);

      // 1. Buscar dados do pedido
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          carrier:carriers(nome)
        `)
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        console.error('[orderNotificationService] Erro ao buscar pedido:', orderError);
        return { success: false, error: 'Pedido não encontrado' };
      }

      console.log('[orderNotificationService] Pedido encontrado:', order.order_number);

      // 2. Buscar parceiro de negócios do cliente
      const { data: businessPartner, error: bpError } = await supabase
        .from('business_partners')
        .select(`
          id,
          name,
          contacts:business_partner_contacts(*)
        `)
        .eq('name', order.customer_name)
        .maybeSingle();

      if (bpError) {
        console.error('[orderNotificationService] Erro ao buscar parceiro:', bpError);
      }

      if (!businessPartner || !businessPartner.contacts || businessPartner.contacts.length === 0) {
        console.log('[orderNotificationService] Nenhum contato encontrado para o cliente');
        return { success: true }; // Não é erro, apenas não tem contatos
      }

      console.log('[orderNotificationService] Contatos encontrados:', businessPartner.contacts.length);

      // 3. Buscar estabelecimento para pegar logo e dados
      const estabelecimentoStr = localStorage.getItem('tms-current-establishment');
      if (!estabelecimentoStr) {
        console.error('[orderNotificationService] Estabelecimento não encontrado no localStorage');
        return { success: false, error: 'Estabelecimento não configurado' };
      }

      const estabelecimento = JSON.parse(estabelecimentoStr);
      console.log('[orderNotificationService] Estabelecimento:', estabelecimento.razao_social);

      // Buscar logo do estabelecimento
      let logoBase64 = null;
      if (estabelecimento.logo_url) {
        try {
          const { data: logoData } = await supabase.storage
            .from('logos')
            .download(estabelecimento.logo_url);

          if (logoData) {
            const reader = new FileReader();
            logoBase64 = await new Promise((resolve) => {
              reader.onloadend = () => resolve(reader.result);
              reader.readAsDataURL(logoData);
            });
          }
        } catch (error) {
          console.warn('[orderNotificationService] Erro ao buscar logo:', error);
        }
      }

      // 4. Preparar dados do email
      const emailData = {
        clienteNome: order.customer_name,
        numeroOrder: order.order_number,
        dataEmissao: order.issue_date || order.created_at,
        cidadeDestino: order.destination_city,
        estadoDestino: order.destination_state,
        valorFrete: Number(order.freight_value) || 0,
        valorPedido: Number(order.order_value) || 0,
        transportadoraNome: order.carrier?.nome || order.carrier_name,
        estabelecimento: {
          razaoSocial: estabelecimento.razao_social,
          cnpj: estabelecimento.cnpj,
          codigo: estabelecimento.codigo,
          logoBase64: logoBase64 as string | undefined
        }
      };

      const htmlEmail = orderNotificationTemplateService.generateOrderCreatedEmail(emailData);

      // 5. Filtrar contatos que querem receber notificação de "Pedido Realizado"
      const contactsToNotifyEmail = businessPartner.contacts.filter(
        (contact: any) =>
          contact.receive_email_notifications &&
          contact.email_notify_order_created
      );

      const contactsToNotifyWhatsapp = businessPartner.contacts.filter(
        (contact: any) =>
          contact.receive_whatsapp_notifications &&
          contact.whatsapp_notify_order_created
      );

      console.log('[orderNotificationService] Contatos para e-mail:', contactsToNotifyEmail.length);
      console.log('[orderNotificationService] Contatos para WhatsApp:', contactsToNotifyWhatsapp.length);

      // 6. Enviar e-mails
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const emailPromises = contactsToNotifyEmail.map(async (contact: any) => {
        try {
          console.log('[orderNotificationService] Enviando e-mail para:', contact.email);

          const response = await fetch(`${supabaseUrl}/functions/v1/enviar-email-nps`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
              estabelecimentoId: estabelecimento.id,
              to: contact.email,
              subject: `✅ Pedido ${order.order_number} Emitido - ${estabelecimento.razao_social}`,
              html: htmlEmail
            })
          });

          const result = await response.json();

          if (result.success) {
            console.log('[orderNotificationService] E-mail enviado com sucesso para:', contact.email);
          } else {
            console.error('[orderNotificationService] Erro ao enviar e-mail:', result.error);
          }

          return result;
        } catch (error) {
          console.error('[orderNotificationService] Erro ao enviar e-mail para', contact.email, error);
          return { success: false, error: String(error) };
        }
      });

      // 7. Enviar WhatsApp (placeholder - implementar quando tiver o serviço)
      const whatsappPromises = contactsToNotifyWhatsapp.map(async (contact: any) => {
        console.log('[orderNotificationService] WhatsApp para:', contact.phone);
        // TODO: Implementar envio de WhatsApp
        return { success: true, message: 'WhatsApp não implementado ainda' };
      });

      // 8. Aguardar todos os envios
      await Promise.all([...emailPromises, ...whatsappPromises]);

      console.log('[orderNotificationService] Notificações enviadas com sucesso!');
      return { success: true };

    } catch (error: any) {
      console.error('[orderNotificationService] Erro geral:', error);
      return { success: false, error: error.message };
    }
  }
};
