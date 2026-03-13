interface NPSEmailItemPedido {
  codigo: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

interface NPSEmailData {
  clienteNome: string;
  transportadoraNome: string;
  numeroPedido: string;
  dataEntrega: string;
  tokenPesquisa: string;
  itensPedido?: NPSEmailItemPedido[];
  totalItens?: number;
  valorProdutos?: number;
  valorTotalPedido?: number;
  estabelecimento: {
    razaoSocial: string;
    cnpj?: string;
    codigo?: string;
    logoBase64?: string;
    logoUrl?: string;
  };
}

export const npsEmailTemplateService = {
  generateNPSEmail(data: NPSEmailData, baseUrl: string): string {
    // Forçar URL de Produção caso o base-url injetado seja localhost (Devido o teste ocorrer na máquila local do Admin)
    const secureBaseUrl = baseUrl.includes('localhost') ? 'https://embarcador.logaxis.com.br' : baseUrl;
    
    // Gerar links individuais para cada nota (0 a 10)
    const notasLinks = Array.from({ length: 11 }, (_, i) =>
      `${secureBaseUrl}/nps-responder/${data.tokenPesquisa}?nota=${i}`
    );
        
    // Formatar valores monetários
    const formatMoney = (value?: number) => {
      if (!value) return 'R$ 0,00';
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    };

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Pesquisa de Satisfação - ${data.estabelecimento.razaoSocial}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, sans-serif !important;}
  </style>
  <![endif]-->
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      margin: 0; padding: 0;
      background-color: #f4f6f9;
      font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
    img { border: 0; height: auto; outline: none; text-decoration: none; max-width: 100%; display: block; }
    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }

    .email-wrapper { width: 100%; background-color: #f4f6f9; padding: 40px 15px; }
    .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05); }

    .logo-area { background: #ffffff; padding: 30px 20px; text-align: center; border-bottom: 1px solid #edf2f7; }

    .header { background: #ffffff; padding: 40px 30px 20px; text-align: center; }
    
    .nps-hero { background: #ffffff; padding: 10px 30px 40px; text-align: center; }
    .nps-question { color: #1e293b; font-size: 24px; font-weight: 700; line-height: 1.4; margin-bottom: 15px; }
    .nps-subtitle { color: #64748b; font-size: 15px; font-weight: 400; margin-bottom: 30px; line-height: 1.5; }

    /* NOVA ÁREA DE NPS APRIMORADA */
    .nps-buttons-container {
      background: #f8fafc;
      padding: 30px 20px;
      border-radius: 16px;
      margin: 0 auto;
      max-width: 100%;
      border: 1px solid #e2e8f0;
    }
    .nps-buttons {
      display: flex;
      justify-content: space-between;
      gap: 6px;
      margin-bottom: 15px;
    }
    .nps-button {
      display: block;
      width: 100%;
      min-width: 38px;
      height: 44px;
      line-height: 44px;
      text-align: center;
      border-radius: 8px;
      color: #ffffff;
      font-size: 18px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s ease;
    }
    .nps-button:hover { opacity: 0.9; }

    /* Cores das Notas do Net Promoter Score */
    .bg-0, .bg-1, .bg-2, .bg-3, .bg-4, .bg-5, .bg-6 { background-color: #ef4444; } /* Detratores: Vermelho Vivo */
    .bg-7, .bg-8 { background-color: #eab308; } /* Neutros: Amarelo Ouro */
    .bg-9, .bg-10 { background-color: #22c55e; } /* Promotores: Verde Vivo */

    .nps-scale {
      display: flex;
      justify-content: space-between;
      margin-top: 20px;
      padding: 0 5px;
      border-top: 1px dashed #cbd5e1;
      padding-top: 15px;
    }
    .scale-label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .scale-left { color: #ef4444; }
    .scale-right { color: #22c55e; }

    /* Conteúdo - COMPACTO */
    .content {
      background: #ffffff;
      padding: 30px 25px;
    }

    .greeting {
      font-size: 20px;
      font-weight: 700;
      color: #1a202c;
      margin-bottom: 12px;
      line-height: 1.3;
    }

    .message {
      font-size: 14px;
      color: #4a5568;
      line-height: 1.6;
      margin-bottom: 20px;
    }

    /* Card de informações - COMPACTO */
    .info-card {
      background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
      border-left: 4px solid #667eea;
      padding: 20px;
      margin: 25px 0;
      border-radius: 10px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
    }

    .info-card-title {
      font-size: 13px;
      font-weight: 700;
      color: #667eea;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 14px;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #e2e8f0;
    }

    .info-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .info-label {
      font-weight: 600;
      color: #4a5568;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .info-value {
      color: #1a202c;
      font-weight: 600;
      font-size: 13px;
      text-align: right;
    }

    /* Tabela de itens - COMPACTA */
    .items-table {
      width: 100%;
      margin: 20px 0;
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
    }

    .items-table th {
      background: #667eea;
      color: white;
      padding: 10px 8px;
      text-align: left;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .items-table td {
      padding: 10px 8px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 12px;
      color: #2d3748;
    }

    .items-table tr:last-child td {
      border-bottom: none;
    }

    .items-table tr:nth-child(even) {
      background: #f7fafc;
    }

    .items-table .text-right {
      text-align: right;
    }

    .items-table .text-center {
      text-align: center;
    }

    /* Totais do pedido - SEM O VALOR TOTAL */
    .order-totals {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin: 20px 0;
    }

    .total-box {
      background: white;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px;
      text-align: center;
    }

    .total-label {
      font-size: 11px;
      color: #718096;
      font-weight: 600;
      text-transform: uppercase;
      margin-bottom: 6px;
    }

    .total-value {
      font-size: 18px;
      font-weight: 700;
      color: #1a202c;
    }

    /* Call to action alternativa - COMPACTO */
    .cta-section {
      text-align: center;
      margin: 30px 0;
      padding: 20px;
      background: linear-gradient(135deg, #fef5e7 0%, #fff9e6 100%);
      border-radius: 10px;
      border: 2px solid #f6e05e;
    }

    .cta-icon {
      font-size: 36px;
      margin-bottom: 8px;
      display: block;
    }

    .cta-text {
      font-size: 14px;
      color: #744210;
      font-weight: 600;
      margin-bottom: 16px;
      line-height: 1.4;
    }

    .cta-button {
      display: inline-block !important;
      padding: 16px 50px;
      background: #667eea !important;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 25px;
      font-weight: 700;
      font-size: 16px;
      box-shadow: 0 5px 16px rgba(102, 126, 234, 0.3);
      transition: all 0.2s ease;
      border: none;
      text-align: center;
      white-space: nowrap;
      line-height: 1.3;
    }

    .cta-button:hover {
      background: #5568d3 !important;
      transform: translateY(-2px);
      box-shadow: 0 6px 22px rgba(102, 126, 234, 0.4);
    }

    /* Tempo de resposta - COMPACTO */
    .time-notice {
      text-align: center;
      margin-top: 20px;
      padding: 12px;
      background: #edf2f7;
      border-radius: 6px;
    }

    .time-notice-text {
      font-size: 12px;
      color: #4a5568;
      font-weight: 500;
    }

    /* Rodapé - COMPACTO */
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

    .footer-links {
      margin: 15px 0;
    }

    .footer-link {
      color: #667eea;
      text-decoration: none;
      margin: 0 10px;
      font-weight: 500;
      transition: color 0.2s ease;
    }

    .footer-link:hover {
      color: #7c8ff0;
      text-decoration: underline;
    }

    .footer-disclaimer {
      font-size: 10px;
      color: #718096;
      margin-top: 18px;
      padding-top: 18px;
      border-top: 1px solid #4a5568;
      line-height: 1.6;
    }

    /* Responsividade */
    @media only screen and (max-width: 640px) {
      .email-wrapper {
        padding: 15px 8px !important;
      }

      .header {
        padding: 25px 20px !important;
      }

      .nps-hero {
        padding: 30px 18px !important;
      }

      .nps-question {
        font-size: 19px !important;
      }

      .nps-subtitle {
        font-size: 13px !important;
      }

      .nps-buttons-container {
        padding: 18px 12px !important;
        max-width: 100% !important;
      }

      .nps-buttons {
        gap: 4px !important;
      }

      .nps-button {
        min-width: 35px !important;
        width: 35px !important;
        height: 35px !important;
        line-height: 35px !important;
        font-size: 14px !important;
      }

      .content {
        padding: 25px 18px !important;
      }

      .greeting {
        font-size: 18px !important;
      }

      .message {
        font-size: 13px !important;
      }

      .info-card {
        padding: 16px !important;
      }

      .info-row {
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 5px;
      }

      .info-value {
        text-align: left !important;
      }

      .items-table {
        font-size: 10px !important;
      }

      .items-table th,
      .items-table td {
        padding: 7px 5px !important;
      }

      .order-totals {
        grid-template-columns: 1fr !important;
      }

      .cta-section {
        padding: 18px 15px !important;
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

            <!-- Logo do Estabelecimento -->
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

            <!-- Saudação -->
            <tr>
              <td style="background: #ffffff; padding: 30px 25px 15px; text-align: center;">
                <h2 style="margin: 0 0 12px 0; color: #1a202c; font-size: 22px; font-weight: 700;">
                  Olá, ${data.clienteNome}!
                </h2>
                <p style="margin: 0; color: #4a5568; font-size: 15px; line-height: 1.6;">
                  Gostaríamos muito de conhecer sua opinião sobre o serviço de entrega realizado pela<br>
                  <strong>${data.transportadoraNome}</strong>
                </p>
              </td>
            </tr>

            <!-- SEÇÃO NPS - Botões de Avaliação -->
            <tr>
              <td style="background: #ffffff; padding: 25px 25px 30px; text-align: center;">
                <div class="nps-buttons-container" style="background: white; padding: 0; box-shadow: none; max-width: 100%;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 20px;">
                    <tr>
                      ${notasLinks.map((link, i) => `
                      <td align="center" width="9%" style="padding: 2px;">
                        <a href="${link}" class="nps-button bg-${i}" style="color: #ffffff; text-decoration: none;" target="_blank">${i}</a>
                      </td>
                      `).join('')}
                    </tr>
                  </table>
                  
                  <div class="nps-scale" style="margin-top: 25px;">
                    <span class="scale-label scale-left">● Nada Provável</span>
                    <span class="scale-label scale-right">Muito Provável ●</span>
                  </div>
                </div>
              </td>
            </tr>

            <!-- Conteúdo Principal -->
            <tr>
              <td class="content">

                <!-- Card de Informações -->
                <div class="info-card">
                  <div class="info-card-title">📋 Detalhes do Serviço</div>
                  <div class="info-row">
                    <span class="info-label">🚚 Transportadora</span>
                    <span class="info-value">${data.transportadoraNome}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">📦 Pedido</span>
                    <span class="info-value">${data.numeroPedido}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">📅 Data de Entrega</span>
                    <span class="info-value">${data.dataEntrega}</span>
                  </div>

                  ${data.itensPedido && data.itensPedido.length > 0 ? `
                  <!-- Itens do Pedido -->
                  <div style="margin-top: 20px;">
                    <div style="font-size: 14px; font-weight: 700; color: #2d3748; margin-bottom: 12px;">
                      Itens do Pedido
                    </div>
                    <table class="items-table" cellspacing="0" cellpadding="0">
                      <thead>
                        <tr>
                          <th>CÓDIGO</th>
                          <th>DESCRIÇÃO</th>
                          <th class="text-center">QTD</th>
                          <th class="text-right">VALOR UNIT.</th>
                          <th class="text-right">VALOR TOTAL</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${data.itensPedido.map(item => `
                        <tr>
                          <td>${item.codigo}</td>
                          <td>${item.descricao}</td>
                          <td class="text-center">${item.quantidade}</td>
                          <td class="text-right">${formatMoney(item.valorUnitario)}</td>
                          <td class="text-right"><strong>${formatMoney(item.valorTotal)}</strong></td>
                        </tr>
                        `).join('')}
                      </tbody>
                    </table>

                    <!-- Totais Finais -->
                    <div style="margin-top: 18px; text-align: center;">
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse: collapse;">
                        <tr>
                          <td style="padding: 12px; background: #f7fafc; border-top: 2px solid #e2e8f0;">
                            <div style="display: flex; justify-content: center; align-items: center; gap: 8px;">
                              <span style="font-size: 12px; color: #718096; font-weight: 600; text-transform: uppercase;">
                                TOTAL DE ITENS
                              </span>
                            </div>
                            <div style="font-size: 20px; font-weight: 700; color: #1a202c; margin-top: 6px;">
                              ${data.totalItens || data.itensPedido.length}
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 12px; background: #ffffff; border-top: 1px solid #e2e8f0;">
                            <div style="display: flex; justify-content: center; align-items: center; gap: 8px;">
                              <span style="font-size: 12px; color: #718096; font-weight: 600; text-transform: uppercase;">
                                VALOR DOS PRODUTOS
                              </span>
                            </div>
                            <div style="font-size: 26px; font-weight: 700; color: #667eea; margin-top: 6px;">
                              ${formatMoney(data.valorProdutos)}
                            </div>
                          </td>
                        </tr>
                      </table>
                    </div>
                  </div>
                  ` : ''}
                </div>

              </td>
            </tr>

            <!-- Rodapé -->
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

                <div class="footer-links">
                  <a href="${baseUrl}/descadastrar?token=${data.tokenPesquisa}" class="footer-link">Não receber mais pesquisas</a>
                  <span style="color: #4a5568;">•</span>
                  <a href="${baseUrl}/privacidade" class="footer-link">Política de Privacidade</a>
                </div>

                <div class="footer-disclaimer">
                  <strong>Sobre esta pesquisa:</strong><br>
                  Este e-mail é enviado automaticamente após a conclusão do serviço de entrega.
                  Suas respostas são confidenciais e utilizadas exclusivamente para melhorar
                  a qualidade dos nossos serviços. Não compartilhamos seus dados pessoais com terceiros.
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
