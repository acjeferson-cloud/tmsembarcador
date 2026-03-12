import { supabase } from '../lib/supabase';

export interface WhatsAppTransaction {
  id: string;
  message_log_id?: string;
  transaction_date: string;
  transaction_type: 'envio' | 'recebimento';
  message_type: 'texto' | 'imagem' | 'template' | 'documento' | 'audio' | 'video' | 'localizacao';
  recipient_phone: string;
  recipient_name?: string;
  establishment_id?: string;
  business_partner_id?: string;
  unit_cost: number;
  status: 'enviada' | 'entregue' | 'lida' | 'falha' | 'pendente';
  message_id?: string;
  session_id?: string;
  order_id?: string;
  template_name?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  transactionType?: string;
  messageType?: string;
  status?: string;
  establishmentId?: string;
  businessPartnerId?: string;
}

export interface TransactionSummary {
  totalTransactions: number;
  totalCost: number;
  bySentType: {
    envio: number;
    recebimento: number;
  };
  byMessageType: {
    [key: string]: number;
  };
  byStatus: {
    [key: string]: number;
  };
}

export const whatsappTransactionsService = {
  async createTransaction(data: Partial<WhatsAppTransaction>): Promise<WhatsAppTransaction | null> {
    const { data: transaction, error } = await supabase
      .from('whatsapp_transactions')
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

  async getTransactions(filters: TransactionFilters = {}, limit = 100): Promise<WhatsAppTransaction[]> {
    let query = supabase
      .from('whatsapp_transactions')
      .select(`
        *,
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

    if (filters.transactionType) {
      query = query.eq('transaction_type', filters.transactionType);
    }

    if (filters.messageType) {
      query = query.eq('message_type', filters.messageType);
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
      bySentType: {
        envio: 0,
        recebimento: 0
      },
      byMessageType: {},
      byStatus: {}
    };

    transactions.forEach(t => {
      summary.totalCost += Number(t.unit_cost);
      summary.bySentType[t.transaction_type]++;

      if (!summary.byMessageType[t.message_type]) {
        summary.byMessageType[t.message_type] = 0;
      }
      summary.byMessageType[t.message_type]++;

      if (!summary.byStatus[t.status]) {
        summary.byStatus[t.status] = 0;
      }
      summary.byStatus[t.status]++;
    });

    return summary;
  },

  async updateTransactionStatus(
    id: string,
    status: WhatsAppTransaction['status'],
    notes?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('whatsapp_transactions')
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
      .from('whatsapp_transactions')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  },

  exportToCSV(transactions: WhatsAppTransaction[]): string {
    const headers = [
      'Data/Hora',
      'Tipo',
      'Tipo Mensagem',
      'Destinatário',
      'Telefone',
      'Valor',
      'Status',
      'Template',
      'Pedido',
      'Message ID'
    ];

    const rows = transactions.map(t => [
      new Date(t.transaction_date).toLocaleString('pt-BR'),
      t.transaction_type,
      t.message_type,
      t.recipient_name || '-',
      t.recipient_phone,
      Number(t.unit_cost).toFixed(4),
      t.status,
      t.template_name || '-',
      t.order_id || '-',
      t.message_id || '-'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  },

  downloadCSV(transactions: WhatsAppTransaction[], filename = 'extrato-whatsapp.csv'): void {
    const csvContent = this.exportToCSV(transactions);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
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
