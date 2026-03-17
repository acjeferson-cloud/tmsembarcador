import { supabase } from '../lib/supabase';
import { interactionLogsService } from './interactionLogsService';
import { whatsappService } from './whatsappService';

export const deliveryNotificationHandler = {
  async processOccurrenceNotification(
    invoiceId: string, 
    occurrenceCode: string, 
    occurrenceDescription: string,
    invoiceNumber: string
  ) {
    if (occurrenceCode !== '001' && occurrenceCode !== '002') {
      return; // Apenas eventos de entrega
    }

    try {
      // 1. Fetch NFe to get Customer (Business Partner)
      const { data: invoice, error: invoiceError } = await (supabase as any)
        .from('invoices_nfe')
        .select(`
          id,
          numero,
          establishment_id,
          customer:invoices_nfe_customers(cnpj_cpf)
        `)
        .eq('id', invoiceId)
        .single();
        
      if (invoiceError || !invoice) throw new Error('Invoice not found');

      const customerCnpjRaw = invoice.customer?.[0]?.cnpj_cpf;
      if (!customerCnpjRaw) return;
      
      // format to match business_partners 'cpf_cnpj' which stores with punctuation
      const digits = customerCnpjRaw.replace(/\D/g, '');
      let formattedCnpjCpf = customerCnpjRaw;
      if (digits.length === 11) {
        formattedCnpjCpf = digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      } else if (digits.length === 14) {
        formattedCnpjCpf = digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
      }

      // 2. Fetch Business Partner ID
      const { data: partner, error: partnerError } = await (supabase as any)
        .from('business_partners')
        .select('id, razao_social')
        .eq('cpf_cnpj', formattedCnpjCpf)
        .single();

      if (partnerError || !partner) return; // No business partner linked

      // 3. Fetch Contacts with notification preferences
      const { data: contacts, error: contactsError } = await (supabase as any)
        .from('business_partner_contacts')
        .select('*')
        .eq('partner_id', partner.id);

      if (contactsError || !contacts || contacts.length === 0) return;

      const eventType = occurrenceCode === '001' ? 'Entrega Realizada Normalmente' : 'Entrega Fora da Data Programada';

      // 4. Process each contact
      for (const contact of contacts) {
        
        // Handle Email Notification
        if (contact.receive_email_notifications && contact.email_notify_delivered && contact.email) {
          try {
            // 1. Fetch active SMTP Configuration for the invoice's establishment
            const { data: smtpConfigData, error: smtpError } = await (supabase as any)
              .from('email_outgoing_config')
              .select('*')
              .eq('establishment_id', invoice.establishment_id)
              .eq('ativo', true)
              .limit(1)
              .maybeSingle();

            if (smtpError || !smtpConfigData) {
              throw new Error('Nenhuma configuração SMTP ativa encontrada para envio de e-mails.');
            }

            const emailPayload = {
              email: {
                from: { email: smtpConfigData.from_email, name: smtpConfigData.from_name },
                to: contact.email,
                subject: `Atualização de Entrega - NFe ${invoiceNumber}`,
                html: `<p>Olá ${contact.nome || contact.name || 'Cliente'},</p><p>A sua entrega referente à Nota Fiscal <strong>${invoiceNumber}</strong> foi registrada com o status: <strong>${eventType}</strong>.</p>`
              },
              smtp_config: {
                host: smtpConfigData.smtp_host,
                port: smtpConfigData.smtp_port,
                secure: smtpConfigData.smtp_secure,
                auth: {
                  user: smtpConfigData.smtp_user,
                  pass: smtpConfigData.smtp_password
                }
              }
            };

            const { data: edgeFunctionReturn, error: emailError } = await (supabase as any).functions.invoke('send-test-email', {
              body: emailPayload
            });

            if (emailError) throw emailError;
            if (edgeFunctionReturn && !edgeFunctionReturn.success) {
               throw new Error(edgeFunctionReturn.error || edgeFunctionReturn.message || 'Falha no servidor de disparo de E-mails');
            }

            await interactionLogsService.insertLog({
              organization_id: contact.organization_id,
              environment_id: contact.environment_id,
              invoice_id: invoiceId,
              invoice_number: invoiceNumber,
              business_partner_id: partner.id,
              contact_id: contact.id,
              contact_name: contact.name,
              channel: 'email',
              event_type: eventType,
              occurrence_code: occurrenceCode,
              status: 'success',
              log_message: `E-mail de notificação enviado com sucesso para ${contact.email}`
            });

          } catch (err: any) {
            await interactionLogsService.insertLog({
              organization_id: contact.organization_id,
              environment_id: contact.environment_id,
              invoice_id: invoiceId,
              invoice_number: invoiceNumber,
              business_partner_id: partner.id,
              contact_id: contact.id,
              contact_name: contact.name,
              channel: 'email',
              event_type: eventType,
              occurrence_code: occurrenceCode,
              status: 'error',
              log_message: err.message || 'Erro inesperado ao disparar e-mail'
            });
          }
        }

        // Handle WhatsApp Notification
        if (contact.receive_whatsapp_notifications && contact.whatsapp_notify_delivered && contact.phone) {
          try {
            const templateName = occurrenceCode === '001' ? 'order_management_7' : undefined;
            const msgContent = `Olá ${contact.nome || contact.name || 'Cliente'},\nA sua entrega referente à Nota Fiscal *${invoiceNumber}* foi registrada com o status: *${eventType}*.`;

            const waResult = await whatsappService.sendMessage({
              recipientPhone: contact.phone,
              recipientName: contact.nome || contact.name || 'Cliente',
              templateName: templateName,
              messageContent: msgContent,
              templateVariables: templateName ? [contact.nome || contact.name || 'Cliente', invoiceNumber] : undefined
            });

            if (!waResult.success) {
               throw new Error(waResult.error || 'Falha ao enviar mensagem via WhatsApp API');
            }
            
            await interactionLogsService.insertLog({
              organization_id: contact.organization_id,
              environment_id: contact.environment_id,
              invoice_id: invoiceId,
              invoice_number: invoiceNumber,
              business_partner_id: partner.id,
              contact_id: contact.id,
              contact_name: contact.name,
              channel: 'whatsapp',
              event_type: eventType,
              occurrence_code: occurrenceCode,
              status: 'success',
              log_message: `Mensagem WhatsApp enviada com sucesso para ${contact.phone}`
            });
          } catch (err: any) {
            await interactionLogsService.insertLog({
              organization_id: contact.organization_id,
              environment_id: contact.environment_id,
              invoice_id: invoiceId,
              invoice_number: invoiceNumber,
              business_partner_id: partner.id,
              contact_id: contact.id,
              contact_name: contact.nome || contact.name || 'Desconhecido',
              channel: 'whatsapp',
              event_type: eventType,
              occurrence_code: occurrenceCode,
              status: 'error',
              log_message: err.message || 'Erro inesperado no WhatsApp'
            });
          }
        }
      }
    } catch (err) {
      console.error('Error processing occurrence notifications:', err);
    }
  }
};
