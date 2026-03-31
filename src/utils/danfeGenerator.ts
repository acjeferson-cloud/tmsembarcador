import { ElectronicDocument } from '../data/electronicDocumentsData';
import { formatCurrency, formatAccessKey } from './formatters';

export const getDanfeHtml = (document: ElectronicDocument) => `
    <html>
      <head>
        <title>DANFE - ${document.chaveAcesso}</title>
        <style>
          @page { size: A4 portrait; margin: 10mm; }
          * { box-sizing: border-box; }
          body { font-family: "Times New Roman", Times, serif; margin: 0; padding: 0; font-size: 10px; color: #000; background-color: #ffffff; }
          .danfe-container { width: 100%; max-width: 800px; margin: 0 auto; padding: 10px 15px; background-color: #ffffff; }
          .box { border: 1px solid #000; padding: 2px 4px; border-radius: 2px; position: relative; overflow: hidden; box-sizing: border-box; }
          .lbl { font-size: 6px; text-transform: uppercase; font-weight: bold; margin-bottom: 2px; display: block; }
          .val { font-size: 9px; font-weight: bold; }
          .row { display: flex; width: 100%; margin-top: -1px; }
          .row > .box { margin-left: -1px; flex: 1; }
          .row > .box:first-child { margin-left: 0; }
          
          /* Title bands */
          .section-title { font-size: 7px; font-weight: bold; text-transform: uppercase; margin: 0; margin-top: -1px; padding: 2px 4px; border: 1px solid #000; }
          
          /* Headers & Canhoto */
          .canhoto-container { margin-bottom: 15px; border-bottom: 1px dashed #000; padding-bottom: 5px; }
          
          .header-main { display: flex; width: 100%; margin-bottom: 0; }
          .header-left { width: 40%; border: 1px solid #000; padding: 4px; display: flex; flex-direction: column; justify-content: space-between; }
          .header-center { width: 15%; border: 1px solid #000; margin-left: -1px; text-align: center; padding: 4px; }
          .header-right { flex: 1; border: 1px solid #000; margin-left: -1px; padding: 4px; }
          
          .barcode { height: 40px; margin: 5px 0; text-align: center; display: flex; justify-content: center; align-items: center; overflow: hidden; }
          
          /* Tables */
          table.items { width: 100%; border-collapse: collapse; margin-top: -1px; }
          table.items th, table.items td { border: 1px solid #000; padding: 2px; font-size: 7px; text-align: center; }
          table.items th { background: #eee; font-weight: bold; }
          table.items td.desc { text-align: left; }
          
          .font-sm { font-size: 8px; font-weight: normal; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .mt-1 { margin-top: 5px; }
          
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="danfe-container">
          
          <!-- CANHOTO -->
          <div class="canhoto-container h-auto">
            <div class="row">
              <div class="box" style="width: 75%; flex: none;">
                <span class="lbl">RECEBEMOS DE ${document.emitente.razaoSocial} OS PRODUTOS/SERVIÇOS CONSTANTES DA NOTA FISCAL INDICADA AO LADO</span>
                <div class="row mt-1 border-0" style="margin-top:10px;">
                  <div class="box border-0" style="border:none; border-top: 1px solid #000; margin-top:5px; padding-top:2px;">
                    <span class="lbl font-sm">DATA DE RECEBIMENTO</span>
                  </div>
                  <div class="box border-0" style="border:none; border-top: 1px solid #000; margin-top:5px; padding-top:2px; margin-left: 10px;">
                    <span class="lbl font-sm">IDENTIFICAÇÃO E ASSINATURA DO RECEBEDOR</span>
                  </div>
                </div>
              </div>
              <div class="box text-center" style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
                <b style="font-size: 14px;">NF-e</b><br/>
                <span style="font-size: 12px;">Nº ${document.numeroDocumento}</span><br/>
                <span style="font-size: 10px;">Série ${document.serie}</span>
              </div>
            </div>
          </div>
          
          <!-- HEADER PRINCIPAL -->
          <div class="header-main">
            <!-- EMITENTE -->
            <div class="header-left">
              <div class="text-center" style="font-size: 10px; font-weight: bold; margin-bottom: 5px;">
                ${document.emitente.razaoSocial}
              </div>
              <div style="font-size: 8px; text-align: center;">
                ${document.emitente.endereco}<br/>
                ${document.emitente.cidade} - ${document.emitente.uf} - CEP: ${document.emitente.cep}
              </div>
            </div>
            
            <!-- DANFE -->
            <div class="header-center">
              <b style="font-size: 14px;">DANFE</b><br/>
              <span style="font-size: 9px;">Documento Auxiliar da<br/>Nota Fiscal Eletrônica</span>
              <div style="border: 1px solid #000; margin: 5px auto; width: 30px; padding: 2px;">
                <b style="font-size: 12px;">1</b>
              </div>
              <span style="font-size: 7px;">0 - ENTRADA<br/>1 - SAÍDA</span><br/>
              <br/>
              <b style="font-size: 11px;">Nº ${document.numeroDocumento}</b><br/>
              <b style="font-size: 11px;">SÉRIE: ${document.serie}</b><br/>
              <span style="font-size: 9px;">Página 1 de 1</span>
            </div>
            
            <!-- CHAVE/BARRAS -->
            <div class="header-right">
              <span class="lbl">CONTROLE DO FISCO</span>
              <div class="barcode">
                <img src="https://bwipjs-api.metafloor.com/?bcid=code128&text=${document.chaveAcesso}&scale=2&height=15&includetext=false" alt="Código de Barras da Chave de Acesso" style="max-width: 100%; max-height: 100%;" />
              </div>
              <span class="lbl mt-1">CHAVE DE ACESSO</span>
              <div class="val text-center" style="font-size: 10px; margin-bottom: 5px;">
                ${formatAccessKey(document.chaveAcesso)}
              </div>
              <div style="font-size: 8px; text-align: center;">
                Consulta de autenticidade no portal nacional da NF-e www.nfe.fazenda.gov.br/portal ou no site da Sefaz Autorizadora.
              </div>
            </div>
          </div>
          
          <div class="row">
            <div class="box" style="width: 50%; flex: none;">
              <span class="lbl">NATUREZA DA OPERAÇÃO</span>
              <span class="val">VENDA DE MERCADORIA</span>
            </div>
            <div class="box" style="flex: 1;">
              <span class="lbl">PROTOCOLO DE AUTORIZAÇÃO DE USO</span>
              <span class="val">${document.protocoloAutorizacao || ' - '} - ${new Date(document.dataAutorizacao).toLocaleString('pt-BR')}</span>
            </div>
          </div>
          
          <div class="row">
            <div class="box" style="width: 33.3%; flex: none;">
              <span class="lbl">INSCRIÇÃO ESTADUAL</span>
              <span class="val">${document.emitente.inscricaoEstadual || 'ISENTO'}</span>
            </div>
            <div class="box" style="width: 33.3%; flex: none;">
              <span class="lbl">INSCRIÇÃO ESTADUAL DO SUBST. TRIB.</span>
              <span class="val"></span>
            </div>
            <div class="box" style="flex: 1;">
              <span class="lbl">CNPJ</span>
              <span class="val">${document.emitente.cnpj}</span>
            </div>
          </div>

          <!-- DESTINATÁRIO -->
          <div class="section-title">DESTINATÁRIO/REMETENTE</div>
          <div class="row">
            <div class="box" style="width: 60%; flex: none;">
              <span class="lbl">NOME/RAZÃO SOCIAL</span>
              <span class="val">${document.destinatario?.razaoSocial || ''}</span>
            </div>
            <div class="box" style="width: 25%; flex: none;">
              <span class="lbl">CNPJ/CPF</span>
              <span class="val">${document.destinatario?.cnpjCpf || ''}</span>
            </div>
            <div class="box" style="flex: 1;">
              <span class="lbl">DATA DA EMISSÃO</span>
              <span class="val">${new Date(document.dataImportacao).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
          <div class="row">
            <div class="box" style="width: 45%; flex: none;">
              <span class="lbl">ENDEREÇO</span>
              <span class="val">${document.destinatario?.endereco || ''}</span>
            </div>
            <div class="box" style="width: 25%; flex: none;">
              <span class="lbl">BAIRRO/DISTRITO</span>
              <span class="val"></span>
            </div>
            <div class="box" style="width: 15%; flex: none;">
              <span class="lbl">CEP</span>
              <span class="val">${document.destinatario?.cep || ''}</span>
            </div>
            <div class="box" style="flex: 1;">
              <span class="lbl">DATA DE SAÍDA/ENTRADA</span>
              <span class="val">${new Date(document.dataImportacao).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
          <div class="row">
            <div class="box" style="width: 45%; flex: none;">
              <span class="lbl">MUNICÍPIO</span>
              <span class="val">${document.destinatario?.cidade || ''}</span>
            </div>
            <div class="box" style="width: 20%; flex: none;">
              <span class="lbl">FONE/FAX</span>
              <span class="val"></span>
            </div>
            <div class="box" style="width: 5%; flex: none;">
              <span class="lbl">UF</span>
              <span class="val">${document.destinatario?.uf || ''}</span>
            </div>
            <div class="box" style="width: 15%; flex: none;">
              <span class="lbl">INSCRIÇÃO ESTADUAL</span>
              <span class="val">ISENTO</span>
            </div>
            <div class="box" style="flex: 1;">
              <span class="lbl">HORA DE SAÍDA</span>
              <span class="val"></span>
            </div>
          </div>

          <!-- FATURA -->
          <div class="section-title">FATURA</div>
          <div class="row">
            <div class="box">
              <span class="lbl">DADOS DA FATURA</span>
              <span class="val">Número: ${document.numeroDocumento} - Valor Original: ${formatCurrency(document.valorTotal)} - Valor Desconto: R$ 0,00 - Valor Líquido: ${formatCurrency(document.valorTotal)}</span>
            </div>
          </div>

          <!-- IMPOSTOS -->
          <div class="section-title">CÁLCULO DO IMPOSTO</div>
          <div class="row">
            <div class="box" style="width: 16.6%; flex: none;">
              <span class="lbl">BASE DE CÁLCULO DE ICMS</span>
              <span class="val text-right" style="display:block;">${formatCurrency(document.valorIcms ? document.valorTotal : 0)}</span>
            </div>
            <div class="box" style="width: 16.6%; flex: none;">
              <span class="lbl">VALOR DO ICMS</span>
              <span class="val text-right" style="display:block;">${formatCurrency(document.valorIcms || 0)}</span>
            </div>
            <div class="box" style="width: 16.6%; flex: none;">
              <span class="lbl">BASE DE CÁLCULO ICMS ST</span>
              <span class="val text-right" style="display:block;">0,00</span>
            </div>
            <div class="box" style="width: 16.6%; flex: none;">
              <span class="lbl">VALOR DO ICMS SUBSTITUIÇÃO</span>
              <span class="val text-right" style="display:block;">0,00</span>
            </div>
            <div class="box" style="flex: 1;">
              <span class="lbl">VALOR TOTAL DOS PRODUTOS</span>
              <span class="val text-right" style="display:block;">${formatCurrency(document.valorTotal)}</span>
            </div>
          </div>
          <div class="row">
            <div class="box" style="width: 16.6%; flex: none;">
              <span class="lbl">VALOR DO FRETE</span>
              <span class="val text-right" style="display:block;">${formatCurrency(document.valorFrete || 0)}</span>
            </div>
            <div class="box" style="width: 16.6%; flex: none;">
              <span class="lbl">VALOR DO SEGURO</span>
              <span class="val text-right" style="display:block;">0,00</span>
            </div>
            <div class="box" style="width: 16.6%; flex: none;">
              <span class="lbl">DESCONTO</span>
              <span class="val text-right" style="display:block;">0,00</span>
            </div>
            <div class="box" style="width: 16.6%; flex: none;">
              <span class="lbl">OUTRAS DESPESAS ACESSÓRIAS</span>
              <span class="val text-right" style="display:block;">0,00</span>
            </div>
            <div class="box" style="width: 16.6%; flex: none;">
              <span class="lbl">VALOR DO IPI</span>
              <span class="val text-right" style="display:block;">0,00</span>
            </div>
            <div class="box" style="flex: 1;">
              <span class="lbl">VALOR TOTAL DA NOTA</span>
              <span class="val text-right" style="display:block;">${formatCurrency(document.valorTotal + (document.valorFrete || 0))}</span>
            </div>
          </div>

          <!-- TRANSPORTADOR -->
          <div class="section-title">TRANSPORTADOR/VOLUMES TRANSPORTADOS</div>
          <div class="row">
            <div class="box" style="width: 45%; flex: none;">
              <span class="lbl">RAZÃO SOCIAL</span>
              <span class="val text-center" style="display:block; margin-top:2px;">O MESMO</span>
            </div>
            <div class="box" style="width: 15%; flex: none;">
              <span class="lbl">FRETE POR CONTA</span>
              <span class="val text-center" style="display:block;">0-Emitente</span>
            </div>
            <div class="box" style="width: 15%; flex: none;">
              <span class="lbl">CÓDIGO ANTT</span>
              <span class="val"></span>
            </div>
            <div class="box" style="width: 10%; flex: none;">
              <span class="lbl">PLACA DO VEÍCULO</span>
              <span class="val"></span>
            </div>
            <div class="box" style="width: 5%; flex: none;">
              <span class="lbl">UF</span>
              <span class="val"></span>
            </div>
            <div class="box" style="flex: 1;">
              <span class="lbl">CNPJ/CPF</span>
              <span class="val"></span>
            </div>
          </div>
          <div class="row">
            <div class="box" style="width: 45%; flex: none;">
              <span class="lbl">ENDEREÇO</span>
              <span class="val"></span>
            </div>
            <div class="box" style="width: 30%; flex: none;">
              <span class="lbl">MUNICÍPIO</span>
              <span class="val"></span>
            </div>
            <div class="box" style="width: 5%; flex: none;">
              <span class="lbl">UF</span>
              <span class="val"></span>
            </div>
            <div class="box" style="flex: 1;">
              <span class="lbl">INSCRIÇÃO ESTADUAL</span>
              <span class="val"></span>
            </div>
          </div>
          <div class="row">
            <div class="box" style="width: 15%; flex: none;">
              <span class="lbl">QUANTIDADE</span>
              <span class="val">1</span>
            </div>
            <div class="box" style="width: 25%; flex: none;">
              <span class="lbl">ESPÉCIE</span>
              <span class="val">VOLUMES</span>
            </div>
            <div class="box" style="width: 20%; flex: none;">
              <span class="lbl">MARCA</span>
              <span class="val"></span>
            </div>
            <div class="box" style="width: 15%; flex: none;">
              <span class="lbl">NUMERAÇÃO</span>
              <span class="val"></span>
            </div>
            <div class="box" style="width: 12.5%; flex: none;">
              <span class="lbl">PESO BRUTO</span>
              <span class="val">${document.pesoTotal || '0,000'}</span>
            </div>
            <div class="box" style="flex: 1;">
              <span class="lbl">PESO LÍQUIDO</span>
              <span class="val">${document.pesoTotal || '0,000'}</span>
            </div>
          </div>
          
          <!-- PRODUTOS -->
          <div class="section-title">DADOS DO PRODUTO / SERVIÇOS</div>
          <table class="items">
            <thead>
              <tr>
                <th style="width: 8%;">CÓDIGO</th>
                <th style="width: 35%;">DESCRIÇÃO DO PRODUTO/SERVIÇO</th>
                <th>NCM/SH</th>
                <th>CST</th>
                <th>CFOP</th>
                <th>UNID.</th>
                <th>QTD.</th>
                <th>V.UNIT.</th>
                <th>V.TOTAL</th>
                <th>BC ICMS</th>
                <th>V.ICMS</th>
                <th>V.IPI</th>
                <th>%ICMS</th>
                <th>%IPI</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>0001</td>
                <td class="desc">MERCADORIAS CONFORME NOTA FISCAL (REFERÊNCIA XML)</td>
                <td>00000000</td>
                <td>000</td>
                <td>5102</td>
                <td>UN</td>
                <td>1,0000</td>
                <td>${formatCurrency(document.valorTotal)}</td>
                <td>${formatCurrency(document.valorTotal)}</td>
                <td>${formatCurrency(document.valorIcms ? document.valorTotal : 0)}</td>
                <td>${formatCurrency(document.valorIcms || 0)}</td>
                <td>0,00</td>
                <td>${document.valorIcms ? '18,00' : '0,00'}</td>
                <td>0,00</td>
              </tr>
              <!-- Espaçamento visual para simular grade preenchida -->
              <tr style="height: 100px;">
                <td colspan="14"></td>
              </tr>
            </tbody>
          </table>
          
          <!-- DADOS ADICIONAIS -->
          <div class="section-title text-center">DADOS ADICIONAIS</div>
          <div class="row">
            <div class="box" style="width: 65%; height: 80px; flex: none;">
              <span class="lbl">INFORMAÇÕES COMPLEMENTARES</span>
              <span class="val font-sm" style="font-weight: normal;">
                Documento emitido por ME ou EPP Optante pelo Simples Nacional.<br/>
                Não gera direito a crédito fiscal de IPI.<br/>
                DANFE Impresso pelo TMS Embarcador Log Axis.
              </span>
            </div>
            <div class="box" style="flex: 1; height: 80px;">
              <span class="lbl">RESERVADO AO FISCO</span>
            </div>
          </div>
          
        </div>
      </body>
    </html>
  `;
