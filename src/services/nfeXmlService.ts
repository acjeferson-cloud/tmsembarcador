import { supabase } from '../lib/supabase';
import { findOrCreateCityByCEP } from './citiesService';
import { freightQuoteService } from './freightQuoteService';
import { electronicDocumentsService } from './electronicDocumentsService';
import { TenantContextHelper } from '../utils/tenantContext';

export interface NFeXmlData {
  invoiceType: string;
  number: string;
  series: string;
  accessKey: string;
  issueDate: string;
  deliveryForecastDate?: string;
  operationNature: string;
  orderNumber?: string;
  weight: number;
  volumes: number;
  totalValue: number;
  pisValue: number;
  cofinsValue: number;
  icmsValue: number;
  status: string;
  customer: {
    name: string;
    cnpj: string;
    stateRegistration?: string;
    address: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone?: string;
    email?: string;
  };
  products: Array<{
    itemOrder: number;
    productCode: string;
    description: string;
    quantity: number;
    unit: string;
    unitValue: number;
    totalValue: number;
    weight?: number;
    cubicMeters?: number;
    ncm?: string;
    ean?: string;
  }>;
  carrier?: {
    cnpj: string;
    name: string;
    stateRegistration: string;
    address: string;
    city: string;
    state: string;
  };
  emitter?: {
    name: string;
    cnpj: string;
  };
  rawXml?: string;
  xmlData: any;
}

export const parseNFeXml = (xmlString: string): NFeXmlData | null => {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    
    if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
      throw new Error('Erro ao fazer parse: XML inválido');
    }

    const getNFeElement = (tagName: string): Element | null => {
      return xmlDoc.getElementsByTagName(tagName)[0] || null;
    };

    const getTextContent = (element: Element | null | undefined, tagName: string, defaultValue: string = ''): string => {
      if (!element) return defaultValue;
      const el = element.getElementsByTagName(tagName)[0];
      return el?.textContent || defaultValue;
    };

    const infNFe = getNFeElement('infNFe');
    const ide = getNFeElement('ide');
    const dest = getNFeElement('dest');
    const emit = getNFeElement('emit');
    const enderDest = dest?.getElementsByTagName('enderDest')[0];
    const transp = getNFeElement('transp');
    const transporta = transp?.getElementsByTagName('transporta')[0];
    const total = getNFeElement('total');
    const icmsTot = total?.getElementsByTagName('ICMSTot')[0];
    const vol = transp?.getElementsByTagName('vol')[0];
    const cobr = getNFeElement('cobr');
    const dup = cobr?.getElementsByTagName('dup');

    const accessKey = infNFe?.getAttribute('Id')?.replace('NFe', '') || '';

    const mod = getTextContent(ide, 'mod');
    if (mod && mod !== '55') {
      throw new Error('Apenas XML do modelo 55 (NF-e) é permitido.');
    }

    const tpNF = getTextContent(ide, 'tpNF');
    const invoiceType = tpNF === '0' ? 'Entrada' : 'Saída';

    const dhEmi = getTextContent(ide, 'dhEmi');
    const issueDate = dhEmi ? new Date(dhEmi).toISOString() : new Date().toISOString();

    let deliveryForecastDate: string | undefined;
    if (dup && dup.length > 0) {
      const lastDup = dup[dup.length - 1];
      const dVenc = getTextContent(lastDup, 'dVenc');
      if (dVenc) {
        deliveryForecastDate = new Date(dVenc).toISOString();
      }
    }

    const products: Array<{
      itemOrder: number;
      productCode: string;
      description: string;
      quantity: number;
      unit: string;
      unitValue: number;
      totalValue: number;
      weight?: number;
      cubicMeters?: number;
      ncm?: string;
      ean?: string;
    }> = [];

    const detElements = xmlDoc.getElementsByTagName('det');
    for (let i = 0; i < detElements.length; i++) {
      const det = detElements[i];
      const prod = det.getElementsByTagName('prod')[0];
      if (prod) {
        const nItem = det.getAttribute('nItem') || String(i + 1);
        products.push({
          itemOrder: parseInt(nItem),
          productCode: getTextContent(prod, 'cProd'),
          description: getTextContent(prod, 'xProd'),
          quantity: parseFloat(getTextContent(prod, 'qCom', '0')),
          unit: getTextContent(prod, 'uCom'),
          unitValue: parseFloat(getTextContent(prod, 'vUnCom', '0')),
          totalValue: parseFloat(getTextContent(prod, 'vProd', '0')),
          weight: 0,
          cubicMeters: 0,
          ncm: getTextContent(prod, 'NCM'),
          ean: getTextContent(prod, 'cEAN')
        });
      }
    }

    const totalWeight = parseFloat(getTextContent(vol, 'pesoB', '0'));
    const totalQtd = products.reduce((acc, p) => acc + p.quantity, 0);

    products.forEach(p => {
      p.weight = totalQtd > 0 ? (p.quantity / totalQtd) * totalWeight : (products.length > 0 ? totalWeight / products.length : 0);
      p.cubicMeters = 0;
    });

    const infAdic = getNFeElement('infAdic');
    const infCpl = getTextContent(infAdic, 'infCpl');
    let orderNumber = '';
    if (infCpl) {
      const pedidoMatch = infCpl.match(/Pedido de Compra:\s*(\S+)/);
      if (pedidoMatch) {
        orderNumber = pedidoMatch[1];
      }
    }

    const nfeData: NFeXmlData = {
      invoiceType,
      number: getTextContent(ide, 'nNF'),
      series: getTextContent(ide, 'serie'),
      accessKey,
      issueDate,
      deliveryForecastDate,
      operationNature: getTextContent(ide, 'natOp'),
      orderNumber,
      weight: parseFloat(getTextContent(vol, 'pesoB', '0')),
      volumes: parseInt(getTextContent(vol, 'qVol', '0')),
      totalValue: parseFloat(getTextContent(icmsTot, 'vNF', '0')),
      pisValue: parseFloat(getTextContent(icmsTot, 'vPIS', '0')),
      cofinsValue: parseFloat(getTextContent(icmsTot, 'vCOFINS', '0')),
      icmsValue: parseFloat(getTextContent(icmsTot, 'vICMS', '0')) + parseFloat(getTextContent(icmsTot, 'vST', '0')),
      status: 'emitida',
      customer: {
        name: getTextContent(dest, 'xNome'),
        cnpj: getTextContent(dest, 'CNPJ'),
        stateRegistration: getTextContent(dest, 'IE'),
        address: getTextContent(enderDest, 'xLgr'),
        number: getTextContent(enderDest, 'nro'),
        complement: getTextContent(enderDest, 'xCpl') || undefined,
        neighborhood: getTextContent(enderDest, 'xBairro'),
        city: getTextContent(enderDest, 'xMun'),
        state: getTextContent(enderDest, 'UF'),
        zipCode: getTextContent(enderDest, 'CEP'),
        country: getTextContent(enderDest, 'xPais', 'Brasil'),
        phone: getTextContent(enderDest, 'fone') || undefined,
        email: getTextContent(dest, 'email') || undefined
      },
      products,
      emitter: {
        name: getTextContent(emit, 'xNome'),
        cnpj: getTextContent(emit, 'CNPJ')
      },
      rawXml: xmlString,
      xmlData: xmlDoc
    };

    if (transporta) {
      nfeData.carrier = {
        cnpj: getTextContent(transporta, 'CNPJ'),
        name: getTextContent(transporta, 'xNome'),
        stateRegistration: getTextContent(transporta, 'IE'),
        address: getTextContent(transporta, 'xEnder'),
        city: getTextContent(transporta, 'xMun'),
        state: getTextContent(transporta, 'UF')
      };
    }

    return nfeData;
  } catch (error: any) {
    throw new Error(error.message || 'Erro ao processar o arquivo XML.');
  }
};

export const importNFeToDatabase = async (
  nfeData: NFeXmlData,
  establishmentId: string,
  organizationId: string,
  environmentId: string,
  carrierId?: string
): Promise<{ success: boolean; invoiceId?: string; error?: string }> => {
  try {
    const ctx = await TenantContextHelper.getCurrentContext();
    if (ctx && ctx.organizationId && ctx.environmentId) {
      await TenantContextHelper.setSessionContext(ctx);
    }

    if (!organizationId || !environmentId) {
      throw new Error('Contexto de organização/ambiente não encontrado');
    }

    const { data: existingInvoice, error: searchError } = await (supabase as any)
      .from('invoices_nfe')
      .select('id')
      .eq('chave_acesso', nfeData.accessKey)
      .eq('organization_id', organizationId)
      .eq('environment_id', environmentId)
      .maybeSingle();

    if (searchError) throw searchError;

    let finalCarrierId = carrierId;
    if (!finalCarrierId && nfeData.carrier?.cnpj) {
      const cleanCnpj = nfeData.carrier.cnpj.replace(/\D/g, '');
      const { data: foundCarrier } = await (supabase as any)
        .from('carriers')
        .select('id')
        .eq('organization_id', organizationId)
        .like('cnpj', `%${cleanCnpj}%`)
        .limit(1)
        .maybeSingle();
      if (foundCarrier) {
        finalCarrierId = foundCarrier.id;
      }
    }

    let destinatarioNome = nfeData.customer.name;
    if (nfeData.customer.cnpj) {
      const cleanCnpj = nfeData.customer.cnpj.replace(/\D/g, '');
      const { data: foundPartner } = await (supabase as any)
        .from('business_partners')
        .select('razao_social')
        .eq('organization_id', organizationId)
        .like('cpf_cnpj', `%${cleanCnpj}%`)
        .limit(1)
        .maybeSingle();
      if (foundPartner && foundPartner.razao_social) {
        destinatarioNome = foundPartner.razao_social;
      }
    }

    let cidadeDestino = nfeData.customer.city;
    let ufDestino = nfeData.customer.state;

    if (nfeData.customer.zipCode) {
      try {
        const cityData = await findOrCreateCityByCEP(nfeData.customer.zipCode);
        if (cityData) {
          cidadeDestino = cityData.name;
          ufDestino = cityData.stateAbbreviation;
        }
      } catch (err) {
        // Fallback to XML values on failure
      }
    }

    let invoiceId: string;

    // Cálculo de 'Valor Custo' na importação (Frete)
    let freightResults: any[] = [];
    let specificCalculation: any = null;
    let specificCarrierData: any = null;
    let valorFreteCalculado = 0;

    const destZipCode = nfeData.customer.zipCode ? nfeData.customer.zipCode.replace(/\D/g, '') : undefined;
    const weight = Number(nfeData.weight) || 100;
    const value = Number(nfeData.totalValue) || 0;

    try {
      if (finalCarrierId) {
         const { invoicesCostService } = await import('./invoicesCostService');
         specificCarrierData = await invoicesCostService.getCarrierData(finalCarrierId);
         if (specificCarrierData) {
            const invoiceDataReq = {
               weight,
               value,
               volume: Number(nfeData.volumes) || 1,
               m3: 0,
               destinationCity: cidadeDestino,
               destinationState: ufDestino,
               issueDate: nfeData.issueDate,
               items: nfeData.products.map(p => ({
                 itemCode: p.productCode,
                 eanCode: p.ean === 'SEM GTIN' ? undefined : p.ean,
                 ncmCode: p.ncm
               }))
            };
            specificCalculation = await invoicesCostService.calculateInvoiceCost(invoiceDataReq, finalCarrierId, nfeData.issueDate);
            if (specificCalculation) {
               valorFreteCalculado = specificCalculation.valorTotal;
               freightResults = [{
                 carrierId: finalCarrierId,
                 carrierName: specificCarrierData.razao_social,
                 totalValue: specificCalculation.valorTotal,
                 calculationDetails: specificCalculation
               }];
            }
         }
      }
      
      if (!freightResults.length && destZipCode) {
        freightResults = await freightQuoteService.calculateQuote({
          destinationZipCode: destZipCode,
          weight,
          volumeQty: Number(nfeData.volumes) || 1,
          cargoValue: value,
          cubicMeters: 0,
          establishmentId: establishmentId,
          items: nfeData.products.map(p => ({ // pass items so that restricted carriers are omitted
             itemCode: p.productCode,
             eanCode: p.ean === 'SEM GTIN' ? undefined : p.ean,
             ncmCode: p.ncm
          }))
        });
        if (freightResults && freightResults.length > 0 && finalCarrierId) {
             const selectedQuote = freightResults.find(r => r.carrierId === finalCarrierId);
             if (selectedQuote) {
               valorFreteCalculado = selectedQuote.totalValue;
             }
        }
      }
    } catch (e) {
// null
    }

    if (existingInvoice) {
      invoiceId = existingInvoice.id;
      // Atualiza os dados da invoice existente
      const { error: updateError } = await (supabase as any)
        .from('invoices_nfe')
        .update({
          organization_id: organizationId,
          environment_id: environmentId,
          numero: nfeData.number,
          serie: nfeData.series,
          data_emissao: nfeData.issueDate,
          natureza_operacao: nfeData.operationNature,
          modelo: '55',
          destinatario_cnpj: nfeData.customer.cnpj,
          destinatario_nome: destinatarioNome,
          valor_total: nfeData.totalValue,
          valor_produtos: nfeData.totalValue - nfeData.icmsValue,
          valor_icms: nfeData.icmsValue,
          peso_total: nfeData.weight,
          quantidade_volumes: nfeData.volumes,
          cubagem_total: 0,
          carrier_id: finalCarrierId,
          establishment_id: establishmentId,
          valor_frete: valorFreteCalculado,
          freight_results: freightResults
        })
        .eq('id', invoiceId);
        
      if (updateError) throw updateError;
    } else {
      // Insere nova
      const { data: inserted, error: insertError } = await (supabase as any)
        .from('invoices_nfe')
        .insert({
          organization_id: organizationId,
          environment_id: environmentId,
          numero: nfeData.number,
          serie: nfeData.series,
          chave_acesso: nfeData.accessKey,
          data_emissao: nfeData.issueDate,
          natureza_operacao: nfeData.operationNature,
          modelo: '55',
          destinatario_cnpj: nfeData.customer.cnpj,
          destinatario_nome: destinatarioNome,
          valor_total: nfeData.totalValue,
          valor_produtos: nfeData.totalValue - nfeData.icmsValue,
          valor_icms: nfeData.icmsValue,
          peso_total: nfeData.weight,
          quantidade_volumes: nfeData.volumes,
          cubagem_total: 0,
          situacao: 'emitida',
          xml_content: nfeData.rawXml || '',
          carrier_id: finalCarrierId,
          establishment_id: establishmentId,
          valor_frete: valorFreteCalculado,
          freight_results: freightResults
        })
        .select()
        .single();
        
      if (insertError) throw insertError;
      invoiceId = inserted.id;
    }

    // Apaga cliente e produtos (se for reprocessamento) pra recriar
    await (supabase as any).from('invoices_nfe_customers').delete().eq('invoice_nfe_id', invoiceId);
    await (supabase as any).from('invoices_nfe_products').delete().eq('invoice_nfe_id', invoiceId);



    const { error: customerError } = await (supabase as any)
      .from('invoices_nfe_customers')
      .insert({
        invoice_nfe_id: invoiceId,
        organization_id: organizationId,
        environment_id: environmentId,
        cnpj_cpf: nfeData.customer.cnpj,
        razao_social: destinatarioNome,
        inscricao_estadual: nfeData.customer.stateRegistration,
        logradouro: nfeData.customer.address,
        numero: nfeData.customer.number,
        complemento: nfeData.customer.complement,
        bairro: nfeData.customer.neighborhood,
        cidade: cidadeDestino,
        estado: ufDestino,
        cep: nfeData.customer.zipCode,
        telefone: nfeData.customer.phone,
        email: nfeData.customer.email
      });

    if (customerError) throw customerError;

    if (nfeData.products.length > 0) {
      const { error: productsError } = await (supabase as any)
        .from('invoices_nfe_products')
        .insert(
          nfeData.products.map(product => ({
            invoice_nfe_id: invoiceId,
            organization_id: organizationId,
            environment_id: environmentId,
            numero_item: product.itemOrder,
            codigo_produto: product.productCode,
            descricao: product.description,
            quantidade: product.quantity,
            unidade: product.unit,
            peso: product.weight || 0,
            cubagem: product.cubicMeters || 0,
            valor_unitario: product.unitValue,
            valor_total: product.totalValue,
            ncm: product.ncm
          }))
        );

      if (productsError) throw productsError;
    }

    if (specificCalculation && specificCarrierData && finalCarrierId) {
       try {
         const { invoicesCostService } = await import('./invoicesCostService');
         await (supabase as any).from('invoices_nfe_carrier_costs').delete().eq('invoice_id', invoiceId);
         await invoicesCostService.saveCostsToInvoice(invoiceId, finalCarrierId, specificCalculation, specificCarrierData);
       } catch(e) { 
// null
       }
    }

    // XML já está salvo em invoices_nfe.xml_data
    if (!existingInvoice) {
      try {
        await electronicDocumentsService.create({
          document_type: 'NFe',
          model: '55',
          establishment_id: establishmentId,
          document_number: nfeData.number,
          series: nfeData.series,
          access_key: nfeData.accessKey,
          status: 'authorized',
          issuer_name: nfeData.emitter?.name || '',
          issuer_document: nfeData.emitter?.cnpj || '',
          recipient_name: nfeData.customer?.name || '',
          recipient_document: nfeData.customer?.cnpj || '',
          total_value: nfeData.totalValue,
          icms_value: nfeData.icmsValue,
          total_weight: nfeData.weight,
          transport_mode: 'Rodoviário',
          xml_content: nfeData.rawXml || ''
        });
      } catch (e) {
// null
      }
    }

    return { success: true, invoiceId: invoiceId };
  } catch (error: any) {

    return { success: false, error: error.message };
  }
};
