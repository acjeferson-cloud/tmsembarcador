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
      const { data, error } = await supabase
        .from('orders')
        .select(`
          order_number,
          tracking_code,
          customer_name,
          carrier_name,
          status,
          expected_delivery,
          destination_city,
          destination_state,
          issue_date,
          freight_value,
          order_value,
          delivery_status:order_delivery_status(
            id,
            status,
            date,
            location,
            observation,
            created_at
          ),
          order_items(
            id,
            product_code,
            product_description,
            quantity,
            unit_price,
            total_price
          )
        `)
        .eq('tracking_code', trackingCode.trim().toUpperCase())
        .maybeSingle();

      if (error) {

        return null;
      }

      if (!data) {
        return null;
      }

      return data as PublicTrackingInfo;
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
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${supabaseUrl}/functions/v1/validate-tracking-security`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey
          },
          body: JSON.stringify({
            tracking_code: trackingCode.trim().toUpperCase(),
            recaptcha_token: recaptchaToken,
            session_id: sessionId
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          blocked: result.blocked || false,
          message: result.message || 'Erro ao processar solicitação',
          attempts: result.attempts,
          max_attempts: result.max_attempts
        };
      }

      return result;
    } catch (error) {

      return {
        success: false,
        blocked: false,
        message: 'Erro ao processar solicitação. Tente novamente.'
      };
    }
  }
};
