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
    console.error('Error parsing NFe XML:', error);
    return null;
  }
};

export const importNFeToDatabase = async (
  nfeData: NFeXmlData,
  establishmentId: string
): Promise<{ success: boolean; invoiceId?: string; error?: string }> => {
  try {
    // Obter contexto do tenant (organization_id e environment_id)
    const tenantContext = await TenantContextHelper.getCurrentContext();
    if (!tenantContext || !tenantContext.organizationId || !tenantContext.environmentId) {
      throw new Error('Contexto de organização/ambiente não encontrado');
    }

    const { organizationId, environmentId } = tenantContext;

    let carrierId: string | undefined;

    // Buscar transportador pelo CNPJ se disponível
    if (nfeData.carrier?.cnpj) {
      const cnpjClean = nfeData.carrier.cnpj.replace(/\D/g, '');

      console.log('=== BUSCANDO TRANSPORTADOR ===');
      console.log('CNPJ original:', nfeData.carrier.cnpj);
      console.log('CNPJ limpo:', cnpjClean);
      console.log('Nome do transportador:', nfeData.carrier.name);

      const { data: carrier, error: carrierError } = await supabase
        .from('carriers')
        .select('id, codigo, razao_social, nome_fantasia, cnpj')
        .eq('cnpj', cnpjClean)
        .maybeSingle();

      if (carrierError) {
        console.error('Erro ao buscar transportador:', carrierError);
      }

      if (carrier) {
        carrierId = carrier.id;
        console.log('✅ Transportador encontrado:', {
          id: carrier.id,
          codigo: carrier.codigo,
          nome: carrier.nome_fantasia || carrier.razao_social
        });
      } else {
        console.warn('⚠️ Transportador NÃO encontrado no cadastro');
        console.warn('CNPJ buscado:', cnpjClean);
        console.warn('Nome no XML:', nfeData.carrier.name);
        console.warn('A nota será importada sem vínculo com transportador.');
      }
    } else {
      console.log('ℹ️ XML não contém informações de transportador na tag <transporta>');
    }

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices_nfe')
      .insert({
        establishment_id: establishmentId,
        organization_id: organizationId,
        environment_id: environmentId,
        invoice_type: nfeData.invoiceType,
        number: nfeData.number,
        series: nfeData.series,
        access_key: nfeData.accessKey,
        issue_date: nfeData.issueDate,
        delivery_forecast_date: nfeData.deliveryForecastDate,
        operation_nature: nfeData.operationNature,
        order_number: nfeData.orderNumber,
        weight: nfeData.weight,
        volumes: nfeData.volumes,
        total_value: nfeData.totalValue,
        pis_value: nfeData.pisValue,
        cofins_value: nfeData.cofinsValue,
        icms_value: nfeData.icmsValue,
        status: nfeData.status,
        xml_data: nfeData.xmlData,
        carrier_id: carrierId
      })
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    const { error: customerError } = await supabase
      .from('invoices_nfe_customers')
      .insert({
        invoice_id: invoice.id,
        name: nfeData.customer.name,
        cnpj: nfeData.customer.cnpj,
        state_registration: nfeData.customer.stateRegistration,
        address: nfeData.customer.address,
        number: nfeData.customer.number,
        complement: nfeData.customer.complement,
        neighborhood: nfeData.customer.neighborhood,
        city: nfeData.customer.city,
        state: nfeData.customer.state,
        zip_code: nfeData.customer.zipCode,
        country: nfeData.customer.country,
        phone: nfeData.customer.phone,
        email: nfeData.customer.email
      });

    if (customerError) throw customerError;

    if (nfeData.products.length > 0) {
      const { error: productsError } = await supabase
        .from('invoices_nfe_products')
        .insert(
          nfeData.products.map(product => ({
            invoice_id: invoice.id,
            item_order: product.itemOrder,
            product_code: product.productCode,
            description: product.description,
            quantity: product.quantity,
            unit: product.unit,
            unit_value: product.unitValue,
            total_value: product.totalValue,
            ncm: product.ncm,
            ean: product.ean
          }))
        );

      if (productsError) throw productsError;
    }

    // XML já está salvo em invoices_nfe.xml_data
    console.log('✅ XML da NFe salvo em invoices_nfe.xml_data');

    return { success: true, invoiceId: invoice.id };
  } catch (error: any) {
    console.error('Error importing NFe to database:', error);
    return { success: false, error: error.message };
  }
};
