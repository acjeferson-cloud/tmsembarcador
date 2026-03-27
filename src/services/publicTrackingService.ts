import { trackingService } from './trackingService';

// ... (keep the rest of the top part intact, starting from import { supabase } up to publicTrackingService declaration)
import { supabase } from '../lib/supabase';
import { Order, OrderDeliveryStatus } from './ordersService';

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

      // Note: this is a dummy partial return just to avoid compile errors on the unused method
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
    recaptchaToken: string,
    sessionId: string
  ): Promise<SecureTrackingResponse> {
    try {
      const trackingData = await trackingService.fetchOrderTrackingData(trackingCode.trim().toUpperCase(), true);

      if (!trackingData || !trackingData.order) {
        return {
          success: false,
          blocked: false,
          message: 'Código de rastreamento não encontrado',
        };
      }
      
      const order = trackingData.order;

      const publicInfo: PublicTrackingInfo = {
        order_number: order.numero_pedido || '',
        tracking_code: order.codigo_rastreio || '',
        customer_name: '', 
        carrier_name: 'Log Axis',
        status: order.status || (trackingData.cte ? trackingData.cte.status : 'pendente'),
        expected_delivery: order.data_prevista_entrega,
        destination_city: order.destino_cidade || '',
        destination_state: order.destino_estado || '',
        issue_date: order.data_pedido || new Date().toISOString(),
        freight_value: order.valor_frete || 0,
        order_value: order.valor_mercadoria || 0,
        delivery_status: trackingData.occurrences?.map(occ => ({
          id: occ.id || occ.codigo,
          order_id: order.id,
          status: occ.descricao || occ.status || 'Atualização',
          date: occ.created_at || occ.date || new Date().toISOString(),
          location: occ.location || '',
          observation: occ.observacao || occ.observation || '',
          created_at: occ.created_at || occ.date || new Date().toISOString()
        } as OrderDeliveryStatus)) || [],
        order_items: [] 
      };

      if (order.carrier_id) {
         const { data: carrierData } = await (supabase as any).from('business_partners').select('razao_social, nome_fantasia').eq('id', order.carrier_id).maybeSingle();
         if (carrierData) {
            publicInfo.carrier_name = carrierData.nome_fantasia || carrierData.razao_social || 'Log Axis';
         }
      }

      const { data: itemsData } = await (supabase as any).from('order_items').select('*').eq('order_id', order.id);
      if (itemsData && itemsData.length > 0) {
         publicInfo.order_items = itemsData.map((item: any) => ({
            id: item.id || Math.random().toString(),
            product_code: item.codigo_produto || item.product_code || '',
            product_description: item.descricao || item.product_description || '',
            quantity: item.quantidade || item.quantity || 0,
            unit_price: item.valor_unitario || item.unit_price || 0,
            total_price: item.valor_total || item.total_price || 0
         }));
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
