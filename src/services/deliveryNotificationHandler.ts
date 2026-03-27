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
          order_number,
          numero_pedido,
          establishment_id,
          customer:invoices_nfe_customers(cnpj_cpf)
        `)
        .eq('id', invoiceId)
        .single();
        
      if (invoiceError || !invoice) throw new Error('Invoice not found');

      // 1.5. Determine Tracking Code
      let trackingCode = invoiceNumber; // fallback
      const ordNum = invoice.order_number || invoice.numero_pedido;
      if (ordNum) {
        const { data: orderDataList, error: orderDataError } = await (supabase as any)
          .from('orders')
          .select('codigo_rastreio')
          .eq('numero_pedido', ordNum)
          .limit(1);
        
        if (orderDataError) {
          console.error('[deliveryNotificationHandler] Erro ao buscar pedido:', orderDataError);
        }
        
        if (orderDataList && orderDataList.length > 0 && orderDataList[0].codigo_rastreio) {
          trackingCode = orderDataList[0].codigo_rastreio;
        }
      }

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

      // 3.5. Fetch establishment metadata for the logo
      const { data: estabData } = await (supabase as any)
        .from('establishments')
        .select('metadata')
        .eq('id', invoice.establishment_id)
        .single();
        
      let logoUrl = null;
      if (estabData?.metadata) {
        logoUrl = estabData.metadata.logo_light_url || estabData.metadata.logo_light_base64;
      }

      const logoHtml = logoUrl 
        ? `<div style="text-align: center; margin-bottom: 30px;">
             <img src="${logoUrl}" alt="Logo" style="max-width: 200px; max-height: 80px; object-fit: contain;" />
           </div>`
        : '';

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
                html: `
                  <div style="background-color: #f3f4f6; padding: 40px 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow: hidden;">
                      
                      <!-- Header / Logo -->
                      <div style="padding: 30px; text-align: center; border-bottom: 1px solid #f3f4f6;">
                        ${logoUrl 
                          ? `<img src="${logoUrl}" alt="Logo" style="max-width: 200px; max-height: 80px; object-fit: contain;" />`
                          : `<h1 style="color: #374151; font-size: 24px; margin: 0;">Logística</h1>`
                        }
                      </div>

                      <!-- Main Content -->
                      <div style="padding: 30px 40px;">
                        <h2 style="color: #2563eb; font-size: 24px; font-weight: 600; margin-top: 0; margin-bottom: 20px; text-align: center;">
                          Atualização de Entrega
                        </h2>
                        
                        <p style="font-size: 16px; color: #374151; margin-bottom: 15px;">
                          Olá <strong>${contact.nome || contact.name || 'Cliente'}</strong>,
                        </p>
                        
                        <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin-bottom: 25px;">
                          A sua entrega referente à Nota Fiscal <strong>${invoiceNumber}</strong> foi registrada com o status:
                        </p>

                        <div style="background-color: ${occurrenceCode === '001' ? '#dcfce7' : '#fee2e2'}; border-left: 4px solid ${occurrenceCode === '001' ? '#22c55e' : '#ef4444'}; padding: 15px 20px; border-radius: 4px; text-align: center; margin-bottom: 30px;">
                          <span style="font-size: 18px; font-weight: 700; color: ${occurrenceCode === '001' ? '#166534' : '#991b1b'};">
                            ${eventType}
                          </span>
                        </div>

                        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px 20px; border-radius: 4px; margin-bottom: 30px; text-align: center;">
                          <p style="font-size: 14px; color: #64748b; margin-bottom: 5px; text-transform: uppercase; font-weight: 600;">Código de Rastreio</p>
                          <p style="font-size: 18px; color: #0f172a; font-weight: 700; margin: 0; font-family: monospace;">${trackingCode}</p>
                        </div>

                        <div style="text-align: center; margin-bottom: 10px;">
                          <a href="https://embarcador.logaxis.com.br/rastrear?codigo=${trackingCode}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 6px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);">
                            Mais Informações
                          </a>
                        </div>
                      </div>
                      
                      <!-- Footer -->
                      <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #f3f4f6;">
                        <p style="font-size: 12px; color: #9ca3af; margin: 0;">
                          Esta é uma mensagem automática, por favor não responda a este e-mail.
                        </p>
                      </div>

                    </div>
                  </div>
                `
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
    console.log('[deliveryNotificationHandler] Notificação processada com o novo layout!');
  }
};
