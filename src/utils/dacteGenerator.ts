import { ElectronicDocument } from '../data/electronicDocumentsData';
import { formatCurrency, formatAccessKey } from './formatters';

export const getDacteHtml = (document: ElectronicDocument) => `
    <html>
      <head>
        <title>DACTE - ${document.chaveAcesso}</title>
        <style>
          @page { size: A4 portrait; margin: 10mm; }
          body { font-family: "Times New Roman", Times, serif; margin: 0; padding: 0; font-size: 10px; color: #000; }
          .dacte-container { width: 100%; max-width: 800px; margin: 0 auto; }
          .box { border: 1px solid #000; padding: 2px 4px; border-radius: 2px; position: relative; overflow: hidden; }
          .lbl { font-size: 6px; text-transform: uppercase; font-weight: bold; margin-bottom: 2px; display: block; }
          .val { font-size: 9px; font-weight: bold; }
          .row { display: flex; width: 100%; margin-top: -1px; }
          .row > .box { margin-left: -1px; flex: 1; }
          .row > .box:first-child { margin-left: 0; }
          
          /* Title bands */
          .section-title { font-size: 8px; font-weight: bold; text-transform: uppercase; margin: 10px 0 2px 0; background: #eee; padding: 3px; border: 1px solid #000; text-align: center; }
          
          /* Headers & Canhoto */
          .canhoto-container { margin-bottom: 5px; border-bottom: 1px dashed #000; padding-bottom: 5px; }
          
          .header-main { display: flex; margin-bottom: 5px; }
          .header-left { width: 40%; border: 1px solid #000; padding: 4px; display: flex; flex-direction: column; justify-content: space-between; }
          .header-center { width: 20%; border: 1px solid #000; margin-left: -1px; text-align: center; padding: 4px; }
          .header-right { width: 40%; border: 1px solid #000; margin-left: -1px; padding: 4px; }
          
          .barcode { height: 40px; border: 1px solid #ccc; margin: 5px 0; text-align: center; line-height: 40px; font-size: 10px; background: #eee; }
          
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .mt-1 { margin-top: 5px; }
          .font-sm { font-size: 8px; }
          
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="dacte-container">
          
          <!-- CANHOTO -->
          <div class="canhoto-container">
            <div class="row">
              <div class="box" style="width: 80%; flex: none;">
                <span class="lbl" style="font-size: 7px;">DECLARO QUE RECEBI OS VOLUMES DESTE CONHECIMENTO EM PERFEITO ESTADO PELO QUE DOU POR CUMPRIDO O PRESENTE CONTRATO DE TRANSPORTE</span>
                <div class="row mt-1 border-0" style="margin-top:15px;">
                  <div class="box border-0" style="border:none; border-top: 1px solid #000; padding-top:2px;">
                    <span class="lbl font-sm">NOME</span>
                  </div>
                  <div class="box border-0" style="border:none; border-top: 1px solid #000; padding-top:2px; margin-left: 10px; width: 25%; flex: none;">
                    <span class="lbl font-sm">RG / IDENTIDADE</span>
                  </div>
                  <div class="box border-0" style="border:none; border-top: 1px solid #000; padding-top:2px; margin-left: 10px;">
                    <span class="lbl font-sm">ASSINATURA / CARIMBO</span>
                  </div>
                </div>
              </div>
              <div class="box text-center" style="width: 20%; flex: none; display: flex; flex-direction: column; justify-content: center;">
                <b style="font-size: 14px;">CT-e</b><br/>
                <span style="font-size: 11px;">Nº ${document.numeroDocumento}</span><br/>
                <span style="font-size: 10px;">Série ${document.serie}</span>
              </div>
            </div>
          </div>
          
          <!-- HEADER PRINCIPAL -->
          <div class="header-main text-center bg-gray">
             <div style="width: 100%; border: 1px solid #000; padding: 4px; font-weight:bold; font-size:12px; background:#eee;">
               TIPO DO CT-E: 0 - CT-e Normal
             </div>
          </div>
          <div class="header-main">
            <!-- EMITENTE -->
            <div class="header-left">
              <div class="text-center" style="font-size: 11px; font-weight: bold; margin-bottom: 5px;">
                ${document.emitente.razaoSocial}
              </div>
              <div style="font-size: 9px; text-align: center;">
                ${document.emitente.endereco}<br/>
                ${document.emitente.cidade} - ${document.emitente.uf} - CEP: ${document.emitente.cep}
              </div>
              <div style="font-size: 10px; text-align: center; margin-top:5px;">
                <b>CNPJ: ${document.emitente.cnpj}</b>
              </div>
            </div>
            
            <!-- DACTE -->
            <div class="header-center">
              <b style="font-size: 16px;">DACTE</b><br/>
              <span style="font-size: 9px;">Documento Auxiliar do<br/>Conhecimento de Transporte<br/>Eletrônico</span><br/>
              <br/>
              <b style="font-size: 12px;">MODAL RODOVIÁRIO</b><br/>
              <span style="font-size: 9px;">Página 1 de 1</span><br/>
              <br/>
              <b style="font-size: 11px;">Nº ${document.numeroDocumento}</b><br/>
              <b style="font-size: 11px;">SÉRIE: ${document.serie}</b>
            </div>
            
            <!-- CHAVE/BARRAS -->
            <div class="header-right">
              <div class="barcode">|||| |||||| ||||||| |||||||| ||||| CÓDIGO DE BARRAS</div>
              <span class="lbl mt-1">CHAVE DE ACESSO</span>
              <div class="val text-center" style="font-size: 11px; margin-bottom: 5px;">
                ${formatAccessKey(document.chaveAcesso)}
              </div>
              <div style="font-size: 8px; text-align: center;">
                Consulta de autenticidade no portal nacional do CT-e www.cte.fazenda.gov.br/portal ou no site da Sefaz Autorizadora.
              </div>
              <div class="row mt-1" style="margin-left:-4px; margin-right:-4px; margin-bottom:-4px; border-top:1px solid #000;">
                 <div class="box" style="border:none; border-right:1px solid #000; width:50%; flex:none;">
                   <span class="lbl text-center">PROTOCOLO DE AUTORIZAÇÃO</span>
                   <span class="val text-center" style="display:block;">${document.protocoloAutorizacao || ' - '}</span>
                 </div>
                 <div class="box" style="border:none; width:50%; flex:none;">
                   <span class="lbl text-center">DATA DA AUTORIZAÇÃO</span>
                   <span class="val text-center" style="display:block;">${new Date(document.dataAutorizacao).toLocaleString('pt-BR')}</span>
                 </div>
              </div>
            </div>
          </div>
          
          <div class="row">
            <div class="box" style="width: 25%; flex: none;">
              <span class="lbl">CFOP - NATUREZA DA PRESTAÇÃO</span>
              <span class="val">5351 - PRESTAÇÃO DE SERVIÇO DE TRANSPORTE</span>
            </div>
            <div class="box" style="width: 25%; flex: none;">
              <span class="lbl">MUNICÍPIO DE INÍCIO DA PRESTAÇÃO</span>
              <span class="val">${document.emitente.cidade} - ${document.emitente.uf}</span>
            </div>
            <div class="box" style="width: 25%; flex: none;">
              <span class="lbl">MUNICÍPIO DE TÉRMINO DA PRESTAÇÃO</span>
              <span class="val">${document.destinatario?.cidade} - ${document.destinatario?.uf}</span>
            </div>
          </div>
          
          <!-- TOMADOR -->
          <div class="section-title">TOMADOR DO SERVIÇO</div>
          <div class="row">
            <div class="box" style="width: 50%; flex: none;">
              <span class="lbl">NOME/RAZÃO SOCIAL</span>
              <span class="val">${document.emitente.razaoSocial || document.destinatario?.razaoSocial || ''}</span>
            </div>
            <div class="box" style="width: 15%; flex: none;">
              <span class="lbl">MUNICÍPIO</span>
              <span class="val">${document.emitente.cidade || document.destinatario?.cidade || ''}</span>
            </div>
            <div class="box" style="width: 5%; flex: none;">
              <span class="lbl">UF</span>
              <span class="val">${document.emitente.uf || document.destinatario?.uf || ''}</span>
            </div>
            <div class="box" style="width: 15%; flex: none;">
              <span class="lbl">CNPJ/CPF</span>
              <span class="val">${document.emitente.cnpj || document.destinatario?.cnpjCpf || ''}</span>
            </div>
            <div class="box" style="width: 15%; flex: none;">
              <span class="lbl">INSCRIÇÃO ESTADUAL</span>
              <span class="val">ISENTO</span>
            </div>
          </div>
          
          <!-- REMETENTE -->
          <div class="section-title">REMETENTE</div>
          <div class="row">
            <div class="box" style="width: 40%; flex: none;">
              <span class="lbl">NOME/RAZÃO SOCIAL</span>
              <span class="val">${document.emitente.razaoSocial || ''}</span>
            </div>
            <div class="box" style="width: 30%; flex: none;">
              <span class="lbl">ENDEREÇO</span>
              <span class="val">${document.emitente.endereco || ''}</span>
            </div>
            <div class="box" style="width: 15%; flex: none;">
              <span class="lbl">MUNICÍPIO</span>
              <span class="val">${document.emitente.cidade || ''}</span>
            </div>
            <div class="box" style="width: 15%; flex: none;">
              <span class="lbl">CNPJ/CPF</span>
              <span class="val">${document.emitente.cnpj || ''}</span>
            </div>
          </div>
          
          <!-- DESTINATÁRIO -->
          <div class="section-title">DESTINATÁRIO</div>
          <div class="row">
            <div class="box" style="width: 40%; flex: none;">
              <span class="lbl">NOME/RAZÃO SOCIAL</span>
              <span class="val">${document.destinatario?.razaoSocial || ''}</span>
            </div>
            <div class="box" style="width: 30%; flex: none;">
              <span class="lbl">ENDEREÇO</span>
              <span class="val">${document.destinatario?.endereco || ''}</span>
            </div>
            <div class="box" style="width: 15%; flex: none;">
              <span class="lbl">MUNICÍPIO</span>
              <span class="val">${document.destinatario?.cidade || ''}</span>
            </div>
            <div class="box" style="width: 15%; flex: none;">
              <span class="lbl">CNPJ/CPF</span>
              <span class="val">${document.destinatario?.cnpjCpf || ''}</span>
            </div>
          </div>
          
          <!-- VALORES -->
          <div class="section-title">VALORES DA PRESTAÇÃO DE SERVIÇO / IMPOSTOS</div>
          <div class="row">
            <div class="box text-center" style="width: 20%; flex: none;">
              <span class="lbl">VALOR TOTAL DA PRESTAÇÃO</span>
              <span class="val" style="font-size: 11px;">${formatCurrency(document.valorTotal)}</span>
            </div>
            <div class="box text-center" style="width: 20%; flex: none;">
              <span class="lbl">VALOR RECEBER</span>
              <span class="val" style="font-size: 11px;">${formatCurrency(document.valorTotal)}</span>
            </div>
            <div class="box text-center" style="width: 20%; flex: none;">
              <span class="lbl">BASE DE CÁLCULO</span>
              <span class="val">${formatCurrency(document.valorIcms ? (document.valorFrete || 0) : 0)}</span>
            </div>
            <div class="box text-center" style="width: 20%; flex: none;">
              <span class="lbl">ALÍQUOTA ICMS</span>
              <span class="val">${document.valorIcms ? ((document.valorIcms / (document.valorFrete || 1)) * 100).toFixed(2) + '%' : '0,00%'}</span>
            </div>
            <div class="box text-center" style="width: 20%; flex: none;">
              <span class="lbl">VALOR DO ICMS</span>
              <span class="val">${formatCurrency(document.valorIcms || 0)}</span>
            </div>
          </div>
          <div class="row">
            <div class="box" style="width: 100%;">
               <span class="lbl">COMPONENTES DO VALOR DA PRESTAÇÃO</span>
               <div style="font-size: 8px;">
                 FRETE VALOR: ${formatCurrency(document.valorFrete || document.valorTotal)}&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;PEDÁGIO: R$ 0,00&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;OUTROS: R$ 0,00
               </div>
            </div>
          </div>
          
          <!-- CARGA -->
          <div class="section-title">INFORMAÇÕES DA CARGA</div>
          <div class="row">
            <div class="box" style="width: 50%; flex: none;">
              <span class="lbl">PRODUTO PREDOMINANTE</span>
              <span class="val">MERCADORIAS DIVERSAS</span>
            </div>
            <div class="box" style="width: 50%; flex: none;">
              <span class="lbl">VALOR TOTAL DA CARGA</span>
              <span class="val">${formatCurrency(document.valorTotal * 1.5)}</span> <!-- Simulado base NFe -->
            </div>
          </div>
          <div class="row">
            <div class="box text-center" style="width: 33.3%; flex: none;">
              <span class="lbl">PESO BRUTO (KG)</span>
              <span class="val text-center" style="display:block;">${document.pesoTotal?.toFixed(3) || '0,000'}</span>
            </div>
            <div class="box text-center" style="width: 33.3%; flex: none;">
              <span class="lbl">PESO CUBADO (KG)</span>
              <span class="val text-center" style="display:block;">0,000</span>
            </div>
            <div class="box text-center" style="width: 33.4%; flex: none;">
              <span class="lbl">QTD. VOLUMES</span>
              <span class="val text-center" style="display:block;">1</span>
            </div>
          </div>
          <div class="row">
            <div class="box" style="width: 100%; height: 50px;">
              <span class="lbl">INFORMAÇÕES ADICIONAIS</span>
              <span class="val font-sm" style="font-weight: normal;">
                CT-e emitido de acordo com a NFe vinculada.<br/>
                Isento de PIS/COFINS.<br/>
              </span>
            </div>
          </div>
          
        </div>
      </body>
    </html>
  `;
