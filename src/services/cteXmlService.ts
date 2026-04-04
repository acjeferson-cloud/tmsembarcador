import { supabase } from '../lib/supabase';
import { trackingService } from './trackingService';
import { TenantContextHelper } from '../utils/tenantContext';

interface ParsedCTeData {
  // Dados básicos
  number: string;
  series: string;
  access_key: string;
  issue_date: string;
  freight_type: string;
  status: string;

  // Valores
  freight_weight_value: number;
  freight_value_value: number;
  seccat_value: number;
  dispatch_value: number;
  ademe_gris_value: number;
  itr_value: number;
  tas_value: number;
  collection_delivery_value: number;
  other_tax_value: number;
  toll_value: number;
  icms_rate: number;
  icms_base: number;
  icms_value: number;
  pis_value: number;
  cofins_value: number;
  other_value: number;
  total_value: number;

  // Emitente
  emitter_cnpj?: string;
  emitter_name?: string;

  // Partes envolvidas
  sender_name?: string;
  sender_document?: string;
  sender_city?: string;
  sender_state?: string;
  recipient_name?: string;
  recipient_document?: string;
  recipient_city?: string;
  recipient_state?: string;
  shipper_name?: string;
  shipper_document?: string;
  receiver_name?: string;
  receiver_document?: string;
  payer_name?: string;
  payer_document?: string;

  // Dados da carga
  cargo_weight?: number;
  cargo_value?: number;
  cargo_volume?: number;
  cargo_m3?: number;
  cargo_weight_cubed?: number;
  cargo_weight_for_calculation?: number;
  cubing_factor?: number;

  // Dados adicionais
  xml_data: any;
  invoices: Array<{
    establishment_code?: string;
    invoice_type: string;
    series?: string;
    number?: string;
    cost_value: number;
  }>;
}

export const cteXmlService = {
  parseXml(xmlString: string): ParsedCTeData {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

    // Verificar se há erros no parse
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      throw new Error('Erro ao fazer parse do XML: XML inválido');
    }

    // Função auxiliar para pegar texto de um elemento
    const getElementText = (parent: Element | Document, tagName: string): string => {
      const element = parent.querySelector(tagName);
      return element?.textContent?.trim() || '';
    };

    // Função auxiliar para pegar número
    const getElementNumber = (parent: Element | Document, tagName: string): number => {
      const text = getElementText(parent, tagName);
      return parseFloat(text.replace(',', '.')) || 0;
    };

    try {
      // Namespace do CT-e
      const infCte = xmlDoc.querySelector('infCte, infCTe');
      if (!infCte) {
        throw new Error('Estrutura de CT-e não encontrada no XML');
      }

      // Dados da chave de acesso
      const chaveAcesso = infCte.getAttribute('Id')?.replace('CTe', '') || '';

      // Identificação do CT-e
      const ide = infCte.querySelector('ide');
      const numero = getElementText(ide || xmlDoc, 'nCT');
      const serie = getElementText(ide || xmlDoc, 'serie');
      const dhEmi = getElementText(ide || xmlDoc, 'dhEmi');
      const tpCTe = getElementText(ide || xmlDoc, 'tpCTe');

      // Tipo de serviço e frete
      const tpServ = getElementText(ide || xmlDoc, 'tpServ');
      const tpEmis = getElementText(ide || xmlDoc, 'tpEmis');

      // Emitente (Transportador)
      const emit = infCte.querySelector('emit');
      const emitente = {
        cnpj: getElementText(emit || xmlDoc, 'CNPJ'),
        nome: getElementText(emit || xmlDoc, 'xNome')
      };

      // Remetente
      const rem = infCte.querySelector('rem');
      const remetente = {
        nome: getElementText(rem || xmlDoc, 'xNome'),
        documento: getElementText(rem || xmlDoc, 'CNPJ') || getElementText(rem || xmlDoc, 'CPF'),
        cidade: getElementText(rem || xmlDoc, 'xMun'),
        estado: getElementText(rem || xmlDoc, 'UF')
      };

      // Destinatário
      const dest = infCte.querySelector('dest');
      const destinatario = {
        nome: getElementText(dest || xmlDoc, 'xNome'),
        documento: getElementText(dest || xmlDoc, 'CNPJ') || getElementText(dest || xmlDoc, 'CPF'),
        cidade: getElementText(dest || xmlDoc, 'xMun'),
        estado: getElementText(dest || xmlDoc, 'UF')
      };

      // Expedidor
      const exped = infCte.querySelector('exped');
      const expedidor = {
        nome: getElementText(exped || xmlDoc, 'xNome'),
        documento: getElementText(exped || xmlDoc, 'CNPJ') || getElementText(exped || xmlDoc, 'CPF')
      };

      // Recebedor
      const receb = infCte.querySelector('receb');
      const recebedor = {
        nome: getElementText(receb || xmlDoc, 'xNome'),
        documento: getElementText(receb || xmlDoc, 'CNPJ') || getElementText(receb || xmlDoc, 'CPF')
      };

      // Tomador
      const toma = infCte.querySelector('toma3, toma4');
      const tomador = {
        nome: getElementText(toma || xmlDoc, 'xNome'),
        documento: getElementText(toma || xmlDoc, 'CNPJ') || getElementText(toma || xmlDoc, 'CPF')
      };

      // Valores do CT-e
      const vPrest = infCte.querySelector('vPrest');
      const imp = infCte.querySelector('imp');
      const ICMS = imp?.querySelector('ICMS, ICMS00, ICMS20, ICMS45, ICMS60, ICMS90, ICMSOutraUF, ICMSSN');

      // Componentes de valor
      const componentes = vPrest?.querySelectorAll('Comp') || [];
      let freteValor = 0;
      let fretePeso = 0;
      let seccat = 0;
      let despacho = 0;
      let ademe = 0;
      let pedagio = 0;
      let tas = 0;
      let outrosValores = 0;
      let outros = 0;

      componentes.forEach(comp => {
        const nome = getElementText(comp, 'xNome').toUpperCase();
        const valor = getElementNumber(comp, 'vComp');

        if (nome.includes('FRETE VALOR') || nome.includes('AD VALOREM')) {
          freteValor += valor;
        } else if (nome.includes('FRETE PESO') || nome.includes('FRETE-PESO')) {
          fretePeso += valor;
        } else if (nome.includes('SECCAT') || nome.includes('SEC/CAT')) {
          seccat += valor;
        } else if (nome.includes('DESPACHO')) {
          despacho += valor;
        } else if (nome.includes('ADEME') || nome.includes('GRIS')) {
          ademe += valor;
        } else if (nome.includes('PEDAGIO') || nome.includes('PEDÁGIO')) {
          pedagio += valor;
        } else if (nome.includes('TAS') || nome.includes('TX-ADM')) {
          tas += valor;
        } else if (nome.includes('OUTROS VALORES') || nome.includes('OUTROS')) {
          outrosValores += valor;
        } else {
          outros += valor;
        }
      });

      // vTPrest = Valor da Prestação (base, sem ICMS quando não embutido)
      // vRec = Valor a Receber (total COM ICMS quando não embutido)
      const valorPrestacao = getElementNumber(vPrest || xmlDoc, 'vTPrest');
      const valorReceber = getElementNumber(vPrest || xmlDoc, 'vRec');

      // Usar vRec como valor total (valor a receber)
      const valorTotal = valorReceber;

      // ICMS
      const vBC = getElementNumber(ICMS || xmlDoc, 'vBC');
      const pICMS = getElementNumber(ICMS || xmlDoc, 'pICMS');
      const vICMS = getElementNumber(ICMS || xmlDoc, 'vICMS');

      // PIS e COFINS
      const PIS = imp?.querySelector('PIS');
      const COFINS = imp?.querySelector('COFINS');
      const vPIS = getElementNumber(PIS || xmlDoc, 'vPIS');
      const vCOFINS = getElementNumber(COFINS || xmlDoc, 'vCOFINS');

      // Notas fiscais referenciadas
      const infNFes = infCte.querySelectorAll('infNFe, infNF');
      const notasFiscais: Array<{
        establishment_code?: string;
        invoice_type: string;
        series?: string;
        number?: string;
        cost_value: number;
      }> = [];

      infNFes.forEach(nfe => {
        const chaveNFe = getElementText(nfe, 'chave');

        if (chaveNFe && chaveNFe.length === 44) {
          notasFiscais.push({
            invoice_type: 'Saída',
            series: chaveNFe.substring(22, 25),
            number: chaveNFe,
            cost_value: 0
          });
        } else {
          const numeroNF = getElementText(nfe, 'nDoc');
          const serieNF = getElementText(nfe, 'serie');

          if (numeroNF) {
            notasFiscais.push({
              invoice_type: 'Saída',
              series: serieNF,
              number: numeroNF,
              cost_value: 0
            });
          }
        }
      });

      // Determinar tipo de frete (CIF ou FOB)
      const toma3Tipo = getElementText(toma || xmlDoc, 'toma');
      let tipoFrete = 'CIF';

      // 0=Remetente, 1=Expedidor, 2=Recebedor, 3=Destinatário, 4=Outros
      if (toma3Tipo === '3' || toma3Tipo === '2') {
        tipoFrete = 'FOB';
      }

      // Extrair dados da carga (peso, valor, volume)
      const infCarga = infCte.querySelector('infCarga');
      let cargaValor = 0;
      let cargaPeso = 0;
      let cargaVolume = 0;
      let cargaM3 = 0;

      // Valor da carga
      cargaValor = getElementNumber(infCarga || xmlDoc, 'vCarga');

      // Peso e medidas da carga
      const infQElements = infCarga?.querySelectorAll('infQ') || [];

      // Variáveis separadas para cada tipo de peso
      let pesoReal = 0;
      let pesoCubadoXml = 0;
      let pesoBruto = 0;

      infQElements.forEach(infQ => {
        const cUnid = getElementText(infQ, 'cUnid');
        const tpMed = getElementText(infQ, 'tpMed').toUpperCase();
        const qCarga = getElementNumber(infQ, 'qCarga');

        // Extrair PESO REAL
        if (tpMed.includes('PESO REAL') || tpMed === 'REAL') {
          pesoReal = qCarga;
        }
        // Extrair PESO CUBADO (que já vem calculado no XML)
        else if (tpMed.includes('PESO CUBADO') || tpMed.includes('CUBADO')) {
          pesoCubadoXml = qCarga;
        }
        // Extrair PESO BRUTO como fallback
        else if (tpMed.includes('PESO BRUTO') || tpMed.includes('BRUTO')) {
          pesoBruto = qCarga;
        }
        // Qualquer outro peso em KG como último fallback
        else if (!cargaPeso && cUnid === '01' && tpMed.includes('PESO')) {
          cargaPeso = qCarga;
        }
        // Volume em M3
        else if (cUnid === '00' && tpMed.includes('VOLUME')) {
          cargaM3 = qCarga;
        }
        // Quantidade de volumes
        else if (cUnid === '03' && tpMed.includes('VOLUMES')) {
          cargaVolume = qCarga;
        }
      });

      // Definir o peso real para uso geral (priorizar: real > bruto > qualquer outro)
      if (pesoReal > 0) {
        cargaPeso = pesoReal;
      } else if (pesoBruto > 0) {
        cargaPeso = pesoBruto;
      } else if (!cargaPeso) {
        // Se não encontrou nenhum peso ainda, usar o primeiro peso disponível
        infQElements.forEach(infQ => {
          const cUnid = getElementText(infQ, 'cUnid');
          if (!cargaPeso && cUnid === '01') {
            cargaPeso = getElementNumber(infQ, 'qCarga');
          }
        });
      }

      // Calcular peso cubado a partir do M³ se não vier no XML
      const fatorCubagem = 250;
      let pesoCubadoCalculado = 0;
      if (cargaM3 > 0) {
        pesoCubadoCalculado = cargaM3 * fatorCubagem;
      }

      // Usar o peso cubado do XML se disponível, senão usar o calculado
      const pesoCubado = pesoCubadoXml > 0 ? pesoCubadoXml : pesoCubadoCalculado;

      // Peso para cálculo: usar o MAIOR entre peso real e peso cubado
      const pesoParaCalculo = Math.max(cargaPeso, pesoCubado);








      return {
        number: numero,
        series: serie,
        access_key: chaveAcesso,
        issue_date: dhEmi ? new Date(dhEmi).toISOString() : new Date().toISOString(),
        freight_type: tipoFrete,
        status: 'importado',

        // Valores
        freight_weight_value: fretePeso,
        freight_value_value: freteValor,
        seccat_value: seccat,
        dispatch_value: despacho,
        ademe_gris_value: ademe,
        itr_value: 0,
        tas_value: tas,
        collection_delivery_value: 0,
        other_tax_value: outros,
        toll_value: pedagio,
        icms_rate: pICMS,
        icms_base: vBC,
        icms_value: vICMS,
        pis_value: vPIS,
        cofins_value: vCOFINS,
        other_value: outrosValores,
        total_value: valorTotal,

        // Emitente
        emitter_cnpj: emitente.cnpj,
        emitter_name: emitente.nome,

        // Partes envolvidas
        sender_name: remetente.nome,
        sender_document: remetente.documento,
        sender_city: remetente.cidade,
        sender_state: remetente.estado,
        recipient_name: destinatario.nome,
        recipient_document: destinatario.documento,
        recipient_city: destinatario.cidade,
        recipient_state: destinatario.estado,
        shipper_name: expedidor.nome,
        shipper_document: expedidor.documento,
        receiver_name: recebedor.nome,
        receiver_document: recebedor.documento,
        payer_name: tomador.nome,
        payer_document: tomador.documento,

        // Dados da carga
        cargo_weight: cargaPeso,
        cargo_value: cargaValor,
        cargo_volume: cargaVolume,
        cargo_m3: cargaM3,
        cargo_weight_cubed: pesoCubado,
        cargo_weight_for_calculation: pesoParaCalculo,
        cubing_factor: fatorCubagem,

        // Dados completos
        xml_data: {
          original: xmlString,
          parsed: new Date().toISOString(),
          tpCTe: tpCTe
        },
        invoices: notasFiscais
      };

    } catch (error: any) {

      throw new Error(`Erro ao processar XML do CT-e: ${error.message}`);
    }
  },

  validateXml(xmlString: string): boolean {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        return false;
      }

      const infCte = xmlDoc.querySelector('infCte, infCTe');
      return infCte !== null;
    } catch (error) {
      return false;
    }
  },

  async importCTeToDatabase(parsedData: ParsedCTeData, establishmentId: string) {
    try {
      const ctx = await TenantContextHelper.getCurrentContext();
      if (ctx && ctx.organizationId && ctx.environmentId) {
        await TenantContextHelper.setSessionContext(ctx);
      }

      const { data: cteData, error: cteError } = await (supabase as any)
        .from('ctes_complete')
        .insert({
          organization_id: ctx?.organizationId,
          environment_id: ctx?.environmentId,
          establishment_id: establishmentId,
          number: parsedData.number,
          series: parsedData.series,
          access_key: parsedData.access_key,
          issue_date: parsedData.issue_date,
          freight_type: parsedData.freight_type,
          status: parsedData.status,
          freight_weight_value: parsedData.freight_weight_value,
          freight_value_value: parsedData.freight_value_value,
          seccat_value: parsedData.seccat_value,
          dispatch_value: parsedData.dispatch_value,
          ademe_gris_value: parsedData.ademe_gris_value,
          itr_value: parsedData.itr_value,
          tas_value: parsedData.tas_value,
          collection_delivery_value: parsedData.collection_delivery_value,
          other_tax_value: parsedData.other_tax_value,
          toll_value: parsedData.toll_value,
          icms_rate: parsedData.icms_rate,
          icms_base: parsedData.icms_base,
          icms_value: parsedData.icms_value,
          pis_value: parsedData.pis_value,
          cofins_value: parsedData.cofins_value,
          other_value: parsedData.other_value,
          total_value: parsedData.total_value,
          sender_name: parsedData.sender_name,
          sender_document: parsedData.sender_document,
          sender_city: parsedData.sender_city,
          sender_state: parsedData.sender_state,
          recipient_name: parsedData.recipient_name,
          recipient_document: parsedData.recipient_document,
          recipient_city: parsedData.recipient_city,
          recipient_state: parsedData.recipient_state,
          shipper_name: parsedData.shipper_name,
          shipper_document: parsedData.shipper_document,
          receiver_name: parsedData.receiver_name,
          receiver_document: parsedData.receiver_document,
          payer_name: parsedData.payer_name,
          payer_document: parsedData.payer_document,
          cargo_weight: parsedData.cargo_weight,
          cargo_value: parsedData.cargo_value,
          cargo_volume: parsedData.cargo_volume,
          cargo_m3: parsedData.cargo_m3,
          cargo_weight_cubed: parsedData.cargo_weight_cubed,
          cargo_weight_for_calculation: parsedData.cargo_weight_for_calculation,
          cubing_factor: parsedData.cubing_factor,
          xml_data: parsedData.xml_data
        })
        .select()
        .single();

      if (cteError) throw cteError;

      if (parsedData.invoices && parsedData.invoices.length > 0) {
        const { error: invoicesError } = await (supabase as any)
          .from('ctes_invoices')
          .insert(
            parsedData.invoices.map(invoice => ({
              organization_id: ctx?.organizationId,
              environment_id: ctx?.environmentId,
              cte_id: cteData.id,
              establishment_code: invoice.establishment_code,
              invoice_type: invoice.invoice_type,
              series: invoice.series,
              number: invoice.number,
              cost_value: invoice.cost_value
            }))
          );

        if (invoicesError) {

        } else {
           // Promove o status de rastreamento das notas vinculadas (ex: Em transporte)
           for (const inv of parsedData.invoices) {
              if (!inv.number) continue;
              try {
                const { data: foundInvoice } = await (supabase as any)
                   .from('invoices_nfe')
                   .select('id, numero')
                   .or(`numero.eq.${inv.number},chave_acesso.eq.${inv.number}`)
                   .limit(1)
                   .maybeSingle();
                   
                if (foundInvoice) {
                   await trackingService.syncDocumentTrackingStatus('nfe', foundInvoice.id, foundInvoice.numero);
                }
              } catch (err) {

              }
           }
        }
      }

      // Also copy to electronic_documents for unified view
      try {
        const { electronicDocumentsService } = await import('./electronicDocumentsService');
        await electronicDocumentsService.create({
          document_type: 'CTe',
          model: '57',
          establishment_id: ctx?.establishmentId || undefined,
          document_number: parsedData.number,
          series: parsedData.series,
          access_key: parsedData.access_key,
          status: 'authorized',
          issuer_name: parsedData.emitter_name || '',
          issuer_document: parsedData.emitter_cnpj || '',
          recipient_name: parsedData.recipient_name || parsedData.sender_name || '',
          recipient_document: parsedData.recipient_document || parsedData.sender_document || '',
          total_value: parsedData.total_value,
          icms_value: parsedData.icms_value,
          freight_value: parsedData.total_value, // CTe total implies freight
          total_weight: parsedData.cargo_weight,
          transport_mode: 'Rodoviário',
          xml_content: parsedData.xml_data?.original || ''
        });
      } catch (e) {

      }

      return { success: true, cteId: cteData.id };
    } catch (error: any) {
      return { success: false, error: error.message || 'Unknown error' };
    }
  }
};
