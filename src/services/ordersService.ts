import { supabase } from '../lib/supabase';

export interface Order {
  id?: string;
  order_number: string;
  customer_id?: string;
  customer_name: string;
  issue_date: string;
  entry_date: string;
  expected_delivery?: string;
  carrier_id?: string;
  carrier_name: string;
  freight_value: number;
  order_value: number;
  destination_city: string;
  destination_state: string;
  recipient_phone?: string;
  status: 'pending' | 'confirmed' | 'in_transit' | 'delivered' | 'cancelled';
  tracking_code?: string;
  observations?: string;
  created_at?: string;
  updated_at?: string;
  created_by: number;
  updated_by?: number;
  delivery_status?: OrderDeliveryStatus[];
  items?: OrderItem[];
}

export interface OrderDeliveryStatus {
  id?: string;
  order_id: string;
  status: string;
  date: string;
  location?: string;
  observation?: string;
  created_at?: string;
}

export interface OrderItem {
  id?: string;
  order_id?: string;
  product_code: string;
  product_description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at?: string;
}

// Mapeador para converter dados do banco (PT) para interface (EN)
const mapOrderFromDb = (dbOrder: any): Order => {
  return {
    id: dbOrder.id,
    order_number: dbOrder.numero_pedido || '',
    customer_id: dbOrder.business_partner_id,
    customer_name: dbOrder.business_partner_name || 'Cliente não informado',
    issue_date: dbOrder.data_pedido || new Date().toISOString().split('T')[0],
    entry_date: dbOrder.data_pedido || new Date().toISOString().split('T')[0],
    expected_delivery: dbOrder.data_prevista_entrega,
    carrier_id: dbOrder.carrier_id,
    carrier_name: dbOrder.carrier_name || 'Transportadora não informada',
    freight_value: parseFloat(dbOrder.valor_frete || '0'),
    order_value: parseFloat(dbOrder.valor_mercadoria || '0'),
    destination_city: dbOrder.destino_cidade || '',
    destination_state: dbOrder.destino_estado || '',
    recipient_phone: dbOrder.destino_telefone,
    status: dbOrder.status as any,
    tracking_code: dbOrder.numero_pedido, // Usar número do pedido como tracking code
    observations: dbOrder.observacoes,
    created_at: dbOrder.created_at,
    updated_at: dbOrder.updated_at,
    created_by: 1, // Default
    delivery_status: [],
    items: []
  };
};

export const ordersService = {
  async getAll(): Promise<Order[]> {
    try {
      console.log('📦 [ORDERS] Buscando pedidos...');
      const { data, error } = await supabase.rpc('get_orders_prioritized');

      if (error) {
        console.error('❌ [ORDERS] Erro:', error);
        throw error;
      }

      console.log(`✅ [ORDERS] Encontrados: ${data?.length || 0} pedidos`);

      // Mapear dados do banco (português) para interface (inglês)
      const mapped = (data || []).map(mapOrderFromDb);

      console.log('✅ [ORDERS] Pedidos mapeados:', mapped.length);
      return mapped;
    } catch (error) {
      console.error('❌ [ORDERS] Erro ao buscar pedidos:', error);
      return [];
    }
  },

  async getById(id: string): Promise<Order | null> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          delivery_status:order_delivery_status(*),
          items:order_items(*)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar pedido:', error);
      return null;
    }
  },

  async create(order: Order): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      console.log('[ordersService.create] Iniciando criação do pedido');
      console.log('[ordersService.create] Supabase client disponível:', !!supabase);
      console.log('[ordersService.create] Dados recebidos:', order);

      const { delivery_status, ...orderData } = order;

      console.log('[ordersService.create] Dados limpos (sem delivery_status):', orderData);

      const dataToInsert = {
        ...orderData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('[ordersService.create] Dados a inserir:', dataToInsert);

      const { data, error } = await supabase
        .from('orders')
        .insert(dataToInsert)
        .select()
        .single();

      console.log('[ordersService.create] Resultado da inserção - data:', data);
      console.log('[ordersService.create] Resultado da inserção - error:', error);

      if (error) {
        console.error('[ordersService.create] Erro do Supabase:', error);
        console.error('[ordersService.create] Código do erro:', error.code);
        console.error('[ordersService.create] Detalhes do erro:', error.details);
        console.error('[ordersService.create] Hint:', error.hint);
        return { success: false, error: error.message || 'Erro desconhecido ao criar pedido' };
      }

      if (delivery_status && delivery_status.length > 0) {
        const statusToInsert = delivery_status.map(status => ({
          ...status,
          order_id: data.id,
          created_at: new Date().toISOString()
        }));

        await supabase.from('order_delivery_status').insert(statusToInsert);
      }

      console.log('[ordersService.create] Pedido criado com sucesso, ID:', data.id);
      return { success: true, id: data.id };
    } catch (error: any) {
      console.error('[ordersService.create] Erro capturado no catch:', error);
      console.error('[ordersService.create] Tipo do erro:', typeof error);
      console.error('[ordersService.create] Nome do erro:', error.name);
      console.error('[ordersService.create] Mensagem do erro:', error.message);

      let errorMessage = 'Erro ao criar pedido';

      if (error.message && error.message.includes('Failed to fetch')) {
        errorMessage = 'Erro de conexão. Verifique sua internet ou se o Supabase está configurado corretamente.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      return { success: false, error: errorMessage };
    }
  },

  async update(id: string, order: Partial<Order>): Promise<{ success: boolean; error?: string }> {
    try {
      const { delivery_status, ...orderData } = order;

      const { error } = await supabase
        .from('orders')
        .update({
          ...orderData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) {
      console.error('Erro ao atualizar pedido:', error);
      return { success: false, error: 'Erro ao atualizar pedido' };
    }
  },

  async addDeliveryStatus(orderId: string, status: OrderDeliveryStatus): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('order_delivery_status')
        .insert({
          ...status,
          order_id: orderId,
          created_at: new Date().toISOString()
        });

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) {
      console.error('Erro ao adicionar status:', error);
      return { success: false, error: 'Erro ao adicionar status' };
    }
  },

  async delete(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) {
      console.error('Erro ao excluir pedido:', error);
      return { success: false, error: 'Erro ao excluir pedido' };
    }
  },

  async addItems(orderId: string, items: any[]): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[ordersService.addItems] Iniciando adição de itens');
      console.log('[ordersService.addItems] Order ID:', orderId);
      console.log('[ordersService.addItems] Items recebidos:', items);

      const itemsToInsert = items.map(item => ({
        order_id: orderId,
        product_code: item.product_code,
        product_description: item.product_description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price
      }));

      console.log('[ordersService.addItems] Items a inserir:', itemsToInsert);

      const { error } = await supabase
        .from('order_items')
        .insert(itemsToInsert);

      console.log('[ordersService.addItems] Resultado - error:', error);

      if (error) {
        console.error('[ordersService.addItems] Erro do Supabase:', error);
        return { success: false, error: error.message };
      }

      console.log('[ordersService.addItems] Itens adicionados com sucesso');
      return { success: true };
    } catch (error) {
      console.error('[ordersService.addItems] Erro capturado no catch:', error);
      return { success: false, error: 'Erro ao adicionar itens' };
    }
  },

  async updateItems(orderId: string, items: any[]): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[ordersService.updateItems] Iniciando atualização de itens');
      console.log('[ordersService.updateItems] Order ID:', orderId);
      console.log('[ordersService.updateItems] Items recebidos:', items);

      // Delete existing items
      console.log('[ordersService.updateItems] Deletando itens existentes...');
      const { error: deleteError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId);

      if (deleteError) {
        console.error('[ordersService.updateItems] Erro ao deletar itens:', deleteError);
        return { success: false, error: deleteError.message };
      }

      // Insert new items
      if (items.length > 0) {
        console.log('[ordersService.updateItems] Inserindo novos itens...');
        const itemsToInsert = items.map(item => ({
          order_id: orderId,
          product_code: item.product_code,
          product_description: item.product_description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price
        }));

        console.log('[ordersService.updateItems] Items a inserir:', itemsToInsert);

        const { error: insertError } = await supabase
          .from('order_items')
          .insert(itemsToInsert);

        if (insertError) {
          console.error('[ordersService.updateItems] Erro ao inserir itens:', insertError);
          return { success: false, error: insertError.message };
        }
      }

      console.log('[ordersService.updateItems] Itens atualizados com sucesso');
      return { success: true };
    } catch (error) {
      console.error('[ordersService.updateItems] Erro capturado no catch:', error);
      return { success: false, error: 'Erro ao atualizar itens' };
    }
  }
};
