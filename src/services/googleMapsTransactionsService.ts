import { supabase } from '../lib/supabase';

export interface GoogleMapsTransaction {
  id: string;
  transaction_date: string;
  service_type: 'geocoding' | 'distance_matrix' | 'directions' | 'autocomplete' | 'places' | 'elevation' | 'timezone' | 'static_map';
  request_params?: any;
  origin?: string;
  destination?: string;
  coordinates?: string;
  user_id?: string;
  establishment_id?: string;
  business_partner_id?: string;
  order_id?: string;
  quote_id?: string;
  unit_cost: number;
  status: 'sucesso' | 'erro' | 'timeout' | 'limite_excedido' | 'invalido';
  status_code?: number;
  error_message?: string;
  request_id?: string;
  response_time_ms?: number;
  api_response?: any;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  serviceType?: string;
  status?: string;
  establishmentId?: string;
  businessPartnerId?: string;
  userId?: string;
}

export interface TransactionSummary {
  totalTransactions: number;
  totalCost: number;
  byServiceType: {
    [key: string]: number;
  };
  byStatus: {
    [key: string]: number;
  };
  avgResponseTime: number;
  successRate: number;
}

export const googleMapsTransactionsService = {
  async createTransaction(data: Partial<GoogleMapsTransaction>): Promise<GoogleMapsTransaction | null> {
    const { data: transaction, error } = await supabase
      .from('google_maps_transactions')
      .insert({
        ...data,
        transaction_date: data.transaction_date || new Date().toISOString(),
        unit_cost: data.unit_cost || 0
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return transaction;
  },

  async getTransactions(filters: TransactionFilters = {}, limit = 100): Promise<GoogleMapsTransaction[]> {
    let query = supabase
      .from('google_maps_transactions')
      .select(`
        *,
        users (
          id,
          nome,
          email
        ),
        establishments (
          id,
          nome_fantasia
        ),
        business_partners (
          id,
          name
        )
      `)
      .order('transaction_date', { ascending: false })
      .limit(limit);

    if (filters.startDate) {
      query = query.gte('transaction_date', filters.startDate);
    }

    if (filters.endDate) {
      const endOfDay = new Date(filters.endDate);
      endOfDay.setHours(23, 59, 59, 999);
      query = query.lte('transaction_date', endOfDay.toISOString());
    }

    if (filters.serviceType) {
      query = query.eq('service_type', filters.serviceType);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.establishmentId) {
      query = query.eq('establishment_id', filters.establishmentId);
    }

    if (filters.businessPartnerId) {
      query = query.eq('business_partner_id', filters.businessPartnerId);
    }

    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data || [];
  },

  async getTransactionSummary(filters: TransactionFilters = {}): Promise<TransactionSummary> {
    const transactions = await this.getTransactions(filters, 10000);

    const summary: TransactionSummary = {
      totalTransactions: transactions.length,
      totalCost: 0,
      byServiceType: {},
      byStatus: {},
      avgResponseTime: 0,
      successRate: 0
    };

    let totalResponseTime = 0;
    let responsesWithTime = 0;
    let successCount = 0;

    transactions.forEach(t => {
      summary.totalCost += Number(t.unit_cost);

      if (!summary.byServiceType[t.service_type]) {
        summary.byServiceType[t.service_type] = 0;
      }
      summary.byServiceType[t.service_type]++;

      if (!summary.byStatus[t.status]) {
        summary.byStatus[t.status] = 0;
      }
      summary.byStatus[t.status]++;

      if (t.response_time_ms) {
        totalResponseTime += t.response_time_ms;
        responsesWithTime++;
      }

      if (t.status === 'sucesso') {
        successCount++;
      }
    });

    summary.avgResponseTime = responsesWithTime > 0 ? Math.round(totalResponseTime / responsesWithTime) : 0;
    summary.successRate = transactions.length > 0 ? (successCount / transactions.length) * 100 : 0;

    return summary;
  },

  async updateTransactionStatus(
    id: string,
    status: GoogleMapsTransaction['status'],
    notes?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('google_maps_transactions')
      .update({
        status,
        notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      throw error;
    }
  },

  async deleteTransaction(id: string): Promise<void> {
    const { error } = await supabase
      .from('google_maps_transactions')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  },

  getServiceLabel(serviceType: string): string {
    const labels: { [key: string]: string } = {
      geocoding: 'Geocodificação',
      distance_matrix: 'Matriz de Distância',
      directions: 'Direções/Rotas',
      autocomplete: 'Autocompletar',
      places: 'Places API',
      elevation: 'Elevação',
      timezone: 'Fuso Horário',
      static_map: 'Mapa Estático'
    };
    return labels[serviceType] || serviceType;
  },

  exportToCSV(transactions: GoogleMapsTransaction[]): string {
    const headers = [
      'Data/Hora',
      'Serviço',
      'Origem',
      'Destino',
      'Usuário',
      'Valor',
      'Status',
      'Tempo (ms)',
      'Pedido',
      'Cotação',
      'Request ID'
    ];

    const rows = transactions.map(t => [
      new Date(t.transaction_date).toLocaleString('pt-BR'),
      this.getServiceLabel(t.service_type),
      t.origin || '-',
      t.destination || '-',
      (t as any).users?.nome || '-',
      Number(t.unit_cost).toFixed(4),
      t.status,
      t.response_time_ms?.toString() || '-',
      t.order_id || '-',
      t.quote_id || '-',
      t.request_id || '-'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  },

  downloadCSV(transactions: GoogleMapsTransaction[], filename = 'extrato-google-maps.csv'): void {
    const csvContent = this.exportToCSV(transactions);
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
