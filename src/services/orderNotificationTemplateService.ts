interface OrderNotificationEmailData {
  clienteNome: string;
  numeroOrder: string;
  dataEmissao: string;
  cidadeDestino: string;
  estadoDestino: string;
  valorFrete: number;
  valorPedido: number;
  transportadoraNome?: string;
  estabelecimento: {
    razaoSocial: string;
    cnpj?: string;
    codigo?: string;
    logoBase64?: string;
    logoUrl?: string;
  };
}

export const orderNotificationTemplateService = {
  generateOrderCreatedEmail(data: OrderNotificationEmailData): string {
    const formatMoney = (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    };

    const formatDate = (dateString: string) => {
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      } catch {
        return dateString;
      }
    };

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Pedido Emitido - ${data.estabelecimento.razaoSocial}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      margin: 0;
      padding: 0;
      background-color: #e8edf2;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
      max-width: 100%;
      display: block;
    }

    table {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }

    .email-wrapper {
      width: 100%;
      background-color: #e8edf2;
      padding: 30px 15px;
    }

    .email-container {
      max-width: 640px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
    }

    .logo-area {
      background: #ffffff;
      padding: 40px 25px;
      text-align: center;
      border-bottom: 3px solid #e2e8f0;
    }

    .header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      padding: 35px 25px;
      text-align: center;
    }

    .header-icon {
      font-size: 48px;
      margin-bottom: 12px;
    }

    .header-title {
      color: #ffffff;
      font-size: 26px;
      font-weight: 700;
      line-height: 1.3;
      margin-bottom: 8px;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .header-subtitle {
      color: rgba(255, 255, 255, 0.9);
      font-size: 15px;
      font-weight: 400;
      line-height: 1.4;
    }

    .content {
      background: #ffffff;
      padding: 35px 25px;
    }

    .greeting {
      font-size: 22px;
      font-weight: 700;
      color: #1a202c;
      margin-bottom: 15px;
      line-height: 1.3;
    }

    .message {
      font-size: 15px;
      color: #4a5568;
      line-height: 1.7;
      margin-bottom: 25px;
    }

    .info-card {
      background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
      border-left: 4px solid #10b981;
      padding: 25px;
      margin: 25px 0;
      border-radius: 10px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
    }

    .info-card-title {
      font-size: 14px;
      font-weight: 700;
      color: #10b981;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 18px;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid #e2e8f0;
    }

    .info-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .info-label {
      font-weight: 600;
      color: #4a5568;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .info-value {
      color: #1a202c;
      font-weight: 600;
      font-size: 14px;
      text-align: right;
    }

    .highlight-box {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border-radius: 12px;
      padding: 25px;
      text-align: center;
      margin: 30px 0;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
    }

    .highlight-label {
      color: rgba(255, 255, 255, 0.9);
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }

    .highlight-value {
      color: #ffffff;
      font-size: 32px;
      font-weight: 700;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .status-badge {
      display: inline-block;
      background: #10b981;
      color: #ffffff;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
    }

    .footer {
      background: #2d3748;
      padding: 30px 25px;
      color: #cbd5e0;
      font-size: 12px;
      line-height: 1.6;
      text-align: center;
    }

    .footer-company {
      font-weight: 700;
      font-size: 14px;
      color: #ffffff;
      margin-bottom: 6px;
    }

    .footer-info {
      margin: 3px 0;
      color: #a0aec0;
      font-size: 11px;
    }

    .footer-divider {
      height: 1px;
      background: #4a5568;
      margin: 18px 0;
      opacity: 0.5;
    }

    .footer-disclaimer {
      font-size: 10px;
      color: #718096;
      margin-top: 18px;
      padding-top: 18px;
      border-top: 1px solid #4a5568;
      line-height: 1.6;
    }

    @media only screen and (max-width: 640px) {
      .email-wrapper {
        padding: 15px 8px !important;
      }

      .header {
        padding: 25px 20px !important;
      }

      .header-title {
        font-size: 22px !important;
      }

      .content {
        padding: 25px 18px !important;
      }

      .greeting {
        font-size: 19px !important;
      }

      .message {
        font-size: 14px !important;
      }

      .info-card {
        padding: 18px !important;
      }

      .info-row {
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 5px;
      }

      .info-value {
        text-align: left !important;
      }

      .highlight-value {
        font-size: 26px !important;
      }

      .footer {
        padding: 25px 18px !important;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td align="center">
          <table role="presentation" class="email-container" cellspacing="0" cellpadding="0" border="0" width="640">

            ${data.estabelecimento.logoBase64 ? `
            <tr>
              <td class="logo-area">
                <img
                  src="${data.estabelecimento.logoBase64}"
                  alt="${data.estabelecimento.razaoSocial}"
                  style="max-width: 280px; height: auto; margin: 0 auto; display: block;"
                />
              </td>
            </tr>
            ` : ''}

            <tr>
              <td class="header">
                <div class="header-icon">✅</div>
                <h1 class="header-title">Pedido Emitido com Sucesso!</h1>
                <p class="header-subtitle">Seu pedido foi registrado e está sendo processado</p>
              </td>
            </tr>

            <tr>
              <td class="content">

                <h2 class="greeting">Olá, ${data.clienteNome}!</h2>

                <p class="message">
                  Temos uma ótima notícia: seu pedido foi <strong>emitido com sucesso</strong> e já está em nosso sistema!
                  Em breve você receberá novas atualizações sobre o andamento da entrega.
                </p>

                <div style="text-align: center; margin: 25px 0;">
                  <span class="status-badge">✓ PEDIDO EMITIDO</span>
                </div>

                <div class="info-card">
                  <div class="info-card-title">📋 Detalhes do Pedido</div>
                  <div class="info-row">
                    <span class="info-label">📦 Número do Pedido</span>
                    <span class="info-value"><strong>${data.numeroOrder}</strong></span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">📅 Data de Emissão</span>
                    <span class="info-value">${formatDate(data.dataEmissao)}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">📍 Destino</span>
                    <span class="info-value">${data.cidadeDestino} - ${data.estadoDestino}</span>
                  </div>
                  ${data.transportadoraNome ? `
                  <div class="info-row">
                    <span class="info-label">🚚 Transportadora</span>
                    <span class="info-value">${data.transportadoraNome}</span>
                  </div>
                  ` : ''}
                </div>

                <div class="info-card" style="border-left-color: #667eea;">
                  <div class="info-card-title" style="color: #667eea;">💰 Valores</div>
                  <div class="info-row">
                    <span class="info-label">Valor do Pedido</span>
                    <span class="info-value">${formatMoney(data.valorPedido)}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Valor do Frete</span>
                    <span class="info-value">${formatMoney(data.valorFrete)}</span>
                  </div>
                  <div class="info-row" style="border-top: 2px solid #e2e8f0; padding-top: 12px; margin-top: 8px;">
                    <span class="info-label" style="font-size: 15px;"><strong>Valor Total</strong></span>
                    <span class="info-value" style="font-size: 18px; color: #10b981;">
                      <strong>${formatMoney(data.valorPedido + data.valorFrete)}</strong>
                    </span>
                  </div>
                </div>

                <div style="background: #fef5e7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 25px 0;">
                  <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                    <strong>📱 Fique por dentro!</strong><br>
                    Você receberá notificações sobre cada etapa do seu pedido: faturamento, coleta, transporte e entrega.
                  </p>
                </div>

                <div style="text-align: center; margin-top: 30px; color: #718096; font-size: 13px;">
                  <p style="margin: 0;">
                    Em caso de dúvidas, entre em contato conosco.
                  </p>
                </div>

              </td>
            </tr>

            <tr>
              <td class="footer">
                <div class="footer-company">
                  ${data.estabelecimento.razaoSocial}
                </div>
                ${data.estabelecimento.cnpj ? `
                <div class="footer-info">
                  CNPJ: ${data.estabelecimento.cnpj}
                </div>
                ` : ''}
                ${data.estabelecimento.codigo ? `
                <div class="footer-info">
                  Código do Estabelecimento: ${data.estabelecimento.codigo}
                </div>
                ` : ''}

                <div class="footer-divider"></div>

                <div class="footer-disclaimer">
                  Este é um e-mail automático de notificação. Por favor, não responda esta mensagem.
                  <br><br>
                  © ${new Date().getFullYear()} ${data.estabelecimento.razaoSocial}. Todos os direitos reservados.
                </div>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
    `.trim();
  }
};
