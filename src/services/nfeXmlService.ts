import { supabase } from '../lib/supabase';
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
  xmlData: any;
}

export const parseNFeXml = (xmlString: string): NFeXmlData | null => {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

    const getNFeElement = (tagName: string): Element | null => {
      return xmlDoc.getElementsByTagName(tagName)[0] || null;
    };

    const getTextContent = (element: Element | null, tagName: string, defaultValue: string = ''): string => {
      if (!element) return defaultValue;
      const el = element.getElementsByTagName(tagName)[0];
      return el?.textContent || defaultValue;
    };

    const infNFe = getNFeElement('infNFe');
    const ide = getNFeElement('ide');
    const emit = getNFeElement('emit');
    const dest = getNFeElement('dest');
    const enderDest = dest?.getElementsByTagName('enderDest')[0];
    const transp = getNFeElement('transp');
    const transporta = transp?.getElementsByTagName('transporta')[0];
    const total = getNFeElement('total');
    const icmsTot = total?.getElementsByTagName('ICMSTot')[0];
    const vol = transp?.getElementsByTagName('vol')[0];
    const cobr = getNFeElement('cobr');
    const dup = cobr?.getElementsByTagName('dup');

    const accessKey = infNFe?.getAttribute('Id')?.replace('NFe', '') || '';

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
          ncm: getTextContent(prod, 'NCM'),
          ean: getTextContent(prod, 'cEAN')
        });
      }
    }

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
      status: 'nfe_emitida',
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
  } catch (error) {

    return null;
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
    if (!organizationId || !environmentId) {
      throw new Error('Contexto de organização/ambiente não encontrado');
    }

    const { data: existingInvoice, error: searchError } = await supabase
      .from('invoices_nfe')
      .select('id')
      .eq('chave_acesso', nfeData.accessKey)
      .maybeSingle();

    if (searchError) throw searchError;

    let invoiceId: string;

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
          destinatario_nome: nfeData.customer.name,
          valor_total: nfeData.totalValue,
          valor_produtos: nfeData.totalValue - nfeData.icmsValue,
          valor_icms: nfeData.icmsValue,
          carrier_id: carrierId,
          establishment_id: establishmentId
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
          destinatario_nome: nfeData.customer.name,
          valor_total: nfeData.totalValue,
          valor_produtos: nfeData.totalValue - nfeData.icmsValue,
          valor_icms: nfeData.icmsValue,
          situacao: 'pendente',
          xml_content: '', // O XML raw idealmente seria salvo aqui caso houvesse na sourceData.
          carrier_id: carrierId,
          establishment_id: establishmentId
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
        razao_social: nfeData.customer.name,
        inscricao_estadual: nfeData.customer.stateRegistration,
        logradouro: nfeData.customer.address,
        numero: nfeData.customer.number,
        complemento: nfeData.customer.complement,
        bairro: nfeData.customer.neighborhood,
        cidade: nfeData.customer.city,
        estado: nfeData.customer.state,
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
            valor_unitario: product.unitValue,
            valor_total: product.totalValue,
            ncm: product.ncm
          }))
        );

      if (productsError) throw productsError;
    }

    // XML já está salvo em invoices_nfe.xml_data

    return { success: true, invoiceId: invoiceId };
  } catch (error: any) {

    return { success: false, error: error.message };
  }
};
