// Removed unused trackingService import

// ... (keep the rest of the top part intact, starting from import { supabase } up to publicTrackingService declaration)
import { supabase } from '../lib/supabase';
import { OrderDeliveryStatus } from './ordersService';

export interface OrderItem {
  id: string;
  product_code: string;
  product_description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface PublicTrackingInfo {
  order_number: string;
  tracking_code: string;
  customer_name: string;
  carrier_name: string;
  status: string;
  expected_delivery?: string;
  destination_city: string;
  destination_state: string;
  issue_date: string;
  freight_value: number;
  order_value: number;
  delivery_status: OrderDeliveryStatus[];
  order_items?: OrderItem[];
  raw_tracking_data?: any;
}

interface SecureTrackingResponse {
  success: boolean;
  blocked: boolean;
  data?: PublicTrackingInfo;
  message?: string;
  attempts?: number;
  max_attempts?: number;
}

export const publicTrackingService = {
  async getByTrackingCode(trackingCode: string): Promise<PublicTrackingInfo | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('orders')
        .select(`
          codigo_rastreio,
          numero_pedido,
          status,
          destino_cidade,
          destino_estado,
          data_pedido,
          data_prevista_entrega,
          valor_frete,
          valor_mercadoria
        `)
        .eq('codigo_rastreio', trackingCode.trim().toUpperCase())
        .maybeSingle();

      if (error || !data) return null;

      return {
         order_number: data.numero_pedido,
         tracking_code: data.codigo_rastreio,
         customer_name: '',
         carrier_name: 'Log Axis',
         status: data.status,
         destination_city: data.destino_cidade,
         destination_state: data.destino_estado,
         issue_date: data.data_pedido,
         freight_value: data.valor_frete,
         order_value: data.valor_mercadoria,
         delivery_status: []
      } as PublicTrackingInfo;
    } catch (error) {
      return null;
    }
  },

  async getByTrackingCodeSecure(
    trackingCode: string,
    turnstileToken: string
  ): Promise<SecureTrackingResponse> {
    try {
      if (!turnstileToken) {
        return {
          success: false,
          blocked: true,
          message: 'Token de segurança ausente. Atualize a página e tente novamente.'
        };
      }

      const { data: result, error: fetchError } = await (supabase as any).functions.invoke('public-tracking', {
        body: { token: turnstileToken, trackingCode: trackingCode.trim().toUpperCase() }
      });

      if (fetchError || !result?.success) {
        console.error('Erro na Edge Function (Turnstile/Supabase):', { fetchError, result });
        return {
          success: false,
          blocked: result?.blocked || false,
          message: result?.message || 'Falha ao buscar pacote. Tente novamente.'
        };
      }

      const trackingData = result.data;

      if (!trackingData || (!trackingData.order && !trackingData.invoice && !trackingData.cte)) {
        return {
          success: false,
          blocked: false,
          message: 'Código de rastreamento não encontrado',
        };
      }
      
      const order = trackingData.order || {};
      let invoice = trackingData.invoice || {};
      const cte = trackingData.cte || {};

      // HOTFIX: Se a Edge function não encontrou a NFe (retornou vazia devido ao erro de coluna no backend), buscamos via browser.
      if ((!trackingData.invoice || Object.keys(trackingData.invoice).length === 0) && order.order_number) {
        const { data: localInvoice } = await (supabase as any)
          .from('invoices_nfe')
          .select('*')
          .or(`order_number.eq.${order.order_number},numero_pedido.eq.${order.order_number}`)
          .limit(1)
          .maybeSingle();

        if (localInvoice) {
          invoice = localInvoice;
          trackingData.invoice = localInvoice;
          if (localInvoice.metadata?.occurrences) {
            trackingData.occurrences = [...(trackingData.occurrences || []), ...localInvoice.metadata.occurrences];
          }
        }
      }

      // Fallback local caso a Edge Function não esteja atualizada no servidor em nuvem
      if (!trackingData.occurrences || trackingData.occurrences.length === 0) {
        const checkStatus = (s: string) => s?.toLowerCase();
        
        if (checkStatus(cte.status) === 'entregue' || checkStatus(invoice.status) === 'entregue' || checkStatus(order.status) === 'entregue' || checkStatus(order.status) === 'delivered') {
          const d = cte.updated_at || invoice.updated_at || order.updated_at || new Date().toISOString();
          trackingData.occurrences = [
            { codigo: '100', descricao: 'Em rota de entrega', created_at: d },
            { codigo: '001', descricao: 'Entrega realizada', created_at: d }
          ];
        } else if (['saiu_entrega', 'saiu_para_entrega', 'saiu p/ entrega', 'out_for_delivery'].includes(checkStatus(cte.status) || '') ||
                   ['saiu_entrega', 'saiu_para_entrega', 'saiu p/ entrega', 'out_for_delivery'].includes(checkStatus(invoice.status) || '') ||
                   ['saiu_entrega', 'saiu_para_entrega', 'saiu p/ entrega', 'out_for_delivery'].includes(checkStatus(order.status) || '')) {
          const d = cte.updated_at || invoice.updated_at || order.updated_at || new Date().toISOString();
          trackingData.occurrences = [
            { codigo: '100', descricao: 'Em rota de entrega', created_at: d }
          ];
        }
      }

      let fallbackCarrierName = 'Log Axis';
      if (invoice.transp_razao_social) fallbackCarrierName = invoice.transp_razao_social;

      const publicInfo: PublicTrackingInfo = {
        order_number: order.order_number || invoice.numero_pedido || invoice.numero || '',
        tracking_code: order.tracking_code || trackingCode.trim().toUpperCase(),
        customer_name: order.customer_name || '', 
        carrier_name: order.carrier_name && order.carrier_name !== 'Transportadora não informada' ? order.carrier_name : fallbackCarrierName,
        status: order.status || (trackingData.cte ? trackingData.cte.status : invoice.status || 'pendente'),
        expected_delivery: order.expected_delivery,
        destination_city: order.destination_city || invoice.dest_cidade || '',
        destination_state: order.destination_state || invoice.dest_uf || '',
        issue_date: order.issue_date || invoice.dataEmissao || invoice.data_emissao || new Date().toISOString(),
        freight_value: order.freight_value || invoice.valor_frete || 0,
        order_value: order.order_value || invoice.valor_nfe || invoice.valor_produtos || 0,
        delivery_status: trackingData.occurrences?.map((occ: any) => ({
          id: occ.id || occ.codigo,
          order_id: order.id || '',
          status: occ.descricao || occ.status || 'Atualização',
          date: occ.created_at || occ.date || new Date().toISOString(),
          location: occ.location || '',
          observation: occ.observacao || occ.observation || '',
          created_at: occ.created_at || occ.date || new Date().toISOString()
        } as OrderDeliveryStatus)) || [],
        order_items: [],
        raw_tracking_data: trackingData
      };

      if (!publicInfo.carrier_name || publicInfo.carrier_name === 'Log Axis') {
        if (order.carrier_id) {
           const { data: carrierData } = await (supabase as any).from('business_partners').select('razao_social, nome_fantasia').eq('id', order.carrier_id).maybeSingle();
           if (carrierData && (carrierData.nome_fantasia || carrierData.razao_social)) {
              publicInfo.carrier_name = carrierData.nome_fantasia || carrierData.razao_social;
           }
        }
      }

      let itemsFetched = false;
      if (order.items && order.items.length > 0) {
         publicInfo.order_items = order.items.map((item: any) => ({
            id: item.id || Math.random().toString(),
            product_code: item.product_code || item.produto_codigo || item.codigo || item.codigo_produto || '',
            product_description: item.product_description || item.produto_descricao || item.descricao || '',
            quantity: Number(item.quantity || item.quantidade || 0),
            unit_price: Number(item.unit_price || item.valor_unitario || 0),
            total_price: Number(item.total_price || item.valor_total || 0)
         }));
         itemsFetched = true;
      } else if (order.id) {
        const { data: itemsData } = await (supabase as any).from('order_items').select('*').eq('order_id', order.id);
        if (itemsData && itemsData.length > 0) {
           publicInfo.order_items = itemsData.map((item: any) => ({
              id: item.id || Math.random().toString(),
              product_code: item.produto_codigo || item.product_code || '',
              product_description: item.produto_descricao || item.descricao || item.product_description || '',
              quantity: item.quantidade || item.quantity || 0,
              unit_price: item.valor_unitario || item.unit_price || 0,
              total_price: item.valor_total || item.total_price || 0
           }));
           itemsFetched = true;
        }
      }

      if (!itemsFetched && invoice.id) {
         const { data: nfeItems } = await (supabase as any).from('invoices_nfe_products').select('*').eq('invoice_nfe_id', invoice.id);
         if (nfeItems && nfeItems.length > 0) {
            publicInfo.order_items = nfeItems.map((item: any) => ({
                id: item.id || Math.random().toString(),
                product_code: item.codigo_produto || item.codigo || item.product_code || '',
                product_description: item.descricao || item.description || '',
                quantity: item.quantidade || item.quantity || 0,
                unit_price: item.valor_unitario || item.unit_price || 0,
                total_price: item.valor_total || item.total_price || 0
            }));
         }
      }

      return {
        success: true,
        blocked: false,
        data: publicInfo
      };
    } catch (error) {
      console.error('Erro getByTrackingCodeSecure:', error);
      return {
        success: false,
        blocked: false,
        message: 'Erro ao processar solicitação. Tente novamente.'
      };
    }
  }
};
