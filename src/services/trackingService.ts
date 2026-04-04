import { supabase } from '../lib/supabase';
import { ordersService } from './ordersService';

export interface OrderTrackingData {
  order: any;
  invoice?: any;
  pickup?: any;
  cte?: any;
  bill?: any;
  occurrences?: any[];
}

export const trackingService = {
  fetchTrackingDataFromDocument: async (docType: 'nfe' | 'cte', document: any): Promise<OrderTrackingData> => {
    let order = null;
    let invoice = null;
    let pickup = null;
    let cte = null;
    let bill = null;
    let occurrences: any[] = [];

    try {
      if (docType === 'nfe') {
        invoice = document;
        
        // Fetch pickup
        if (invoice.id) {
          const { data: pickupInvoices } = await (supabase as any)
            .from('pickup_invoices')
            .select('pickup_id')
            .eq('invoice_id', invoice.id)
            .limit(1)
            .maybeSingle();

          if (pickupInvoices) {
            const { data: pickupData } = await (supabase as any)
              .from('pickups')
              .select('*')
              .eq('id', pickupInvoices.pickup_id)
              .limit(1)
              .maybeSingle();
            pickup = pickupData;
          }
        }

        // Fetch CTe
        const invNum = invoice.number || invoice.numero;
        if (invNum) {
          const { data: cteData } = await (supabase as any)
            .from('ctes_complete')
            .select('*')
            .or(`invoice_number.eq.${invNum},numero_nfe.eq.${invNum}`)
            .limit(1)
            .maybeSingle();

          if (cteData) {
            cte = cteData;
          } else {
             let { data: ctesInvoicesData } = await (supabase as any)
               .from('ctes_invoices')
               .select('cte_id')
               .eq('number', invNum)
               .limit(1)
               .maybeSingle();

             if (!ctesInvoicesData && invoice.chave_acesso) {
                 const { data: ctesInvoicesByObs } = await (supabase as any)
                   .from('ctes_invoices')
                   .select('cte_id')
                   .ilike('observations', `%${invoice.chave_acesso}%`)
                   .limit(1)
                   .maybeSingle();
                 
                 if (ctesInvoicesByObs) ctesInvoicesData = ctesInvoicesByObs;
             }

             if (ctesInvoicesData) {
                 const { data: fallbackCte } = await (supabase as any)
                   .from('ctes_complete')
                   .select('*')
                   .eq('id', ctesInvoicesData.cte_id)
                   .limit(1)
                   .maybeSingle();
                 if (fallbackCte) cte = fallbackCte;
             }
          }
        }

        if (invoice.order_number || invoice.numero_pedido) {
           const ordNum = invoice.order_number || invoice.numero_pedido;
           const { data: ord } = await (supabase as any).from('orders').select('*').eq('numero_pedido', ordNum).limit(1).maybeSingle();
           if (ord) {
             order = ord;
           } else {
           }
        } else {
        }

      } else if (docType === 'cte') {
        cte = document;

        // Try to fetch invoice linked to this cte from ctes_invoices
        if (cte.id) {
          const { data: cteInvoices } = await (supabase as any)
            .from('ctes_invoices')
            .select('number, observations')
            .eq('cte_id', cte.id);
            
          if (cteInvoices && cteInvoices.length > 0) {
            for (const cteInv of cteInvoices) {
              const matchKey = cteInv.observations?.match(/Chave:\s*([0-9]{44})/);
              if (matchKey && matchKey[1]) {
                const { data: n } = await (supabase as any).from('invoices_nfe').select('*').eq('chave_acesso', matchKey[1]).limit(1).maybeSingle();
                if (n) { invoice = n; break; }
              } else if (cteInv.number) {
                const { data: n } = await (supabase as any)
                   .from('invoices_nfe')
                   .select('*')
                   .or(`numero.eq.${cteInv.number},number.eq.${cteInv.number}`)
                   .limit(1)
                   .maybeSingle();
                if (n) { invoice = n; break; }
              }
            }
          }
        }
        
        if (!invoice && (cte.invoice_number || cte.numero_nfe)) {
           const invNum = cte.invoice_number || cte.numero_nfe;
           const { data: n } = await (supabase as any)
              .from('invoices_nfe')
              .select('*')
              .or(`numero.eq.${invNum},number.eq.${invNum}`)
              .limit(1)
              .maybeSingle();
           if (n) { invoice = n; }
        }

        if (invoice?.order_number || invoice?.numero_pedido) {
           const ordNum = invoice.order_number || invoice.numero_pedido;
           const { data: ord } = await (supabase as any).from('orders').select('*').eq('numero_pedido', ordNum).limit(1).maybeSingle();
           if (ord) order = ord;
        }

        if (invoice) {
          // Fetch pickup
          let pickupInvoices = null;
          
          if (invoice.id) {
            const { data: byId } = await (supabase as any)
              .from('pickup_invoices')
              .select('pickup_id')
              .eq('invoice_id', invoice.id)
              .limit(1)
              .maybeSingle();
            if (byId) pickupInvoices = byId;
          }
          
          if (!pickupInvoices && invoice.chave_acesso) {
            const { data: byKey } = await (supabase as any)
              .from('pickup_invoices')
              .select('pickup_id')
              .eq('access_key', invoice.chave_acesso)
              .limit(1)
              .maybeSingle();
            if (byKey) pickupInvoices = byKey;
          }

          if (pickupInvoices) {
            const { data: pickupData } = await (supabase as any)
              .from('pickups')
              .select('*')
              .eq('id', pickupInvoices.pickup_id)
              .limit(1)
              .maybeSingle();
            pickup = pickupData;
          }
        }

      }

      // Fetch Bill for CTE
      if (cte?.id) {
          const { data: billCte } = await (supabase as any)
            .from('bill_ctes')
            .select('bill_id')
            .eq('cte_id', cte.id)
            .limit(1)
            .maybeSingle();

          if (billCte) {
             const { data: billData } = await (supabase as any)
               .from('bills')
               .select('*')
               .eq('id', billCte.bill_id)
               .limit(1)
               .maybeSingle();
             if (billData) bill = billData;
          }
      }
      // Mesclar e deduplicar ocorrências de todos os documentos
      let rawOccs: any[] = [];
      if (order?.metadata?.occurrences) rawOccs = [...rawOccs, ...order.metadata.occurrences];
      if (invoice?.metadata?.occurrences) rawOccs = [...rawOccs, ...invoice.metadata.occurrences];
      if (cte?.metadata?.occurrences) rawOccs = [...rawOccs, ...cte.metadata.occurrences];
      if (pickup?.metadata?.occurrences) rawOccs = [...rawOccs, ...pickup.metadata.occurrences];

      if (rawOccs.length > 0) {
        const unique = new Map();
        rawOccs.forEach(o => unique.set(o.codigo || o.id, o));
        occurrences = Array.from(unique.values());
      } else if (cte?.status === 'entregue' || invoice?.status === 'entregue' || order?.status === 'entregue' || order?.status === 'delivered') {
        const d = cte?.updated_at || invoice?.updated_at || order?.updated_at;
        occurrences = [
          { codigo: '100', descricao: 'Em rota de entrega', created_at: d },
          { codigo: '01', descricao: 'Entrega realizada', created_at: d }
        ];
      } else if (['saiu_entrega', 'saiu_para_entrega', 'saiu p/ entrega', 'out_for_delivery'].includes(cte?.status?.toLowerCase() || '') ||
                 ['saiu_entrega', 'saiu_para_entrega', 'saiu p/ entrega', 'out_for_delivery'].includes(invoice?.status?.toLowerCase() || '') ||
                 ['saiu_entrega', 'saiu_para_entrega', 'saiu p/ entrega', 'out_for_delivery'].includes(order?.status?.toLowerCase() || '')) {
        const d = cte?.updated_at || invoice?.updated_at || order?.updated_at;
        occurrences = [
          { codigo: '100', descricao: 'Em rota de entrega', created_at: d }
        ];
      } else if (cte?.status === 'em_transito' || order?.status === 'in_transit' || order?.status === 'em_transito') {
        occurrences = [
          // Removemos codigo '100' aqui para nao pular 'Em transporte' direto pra 'Saiu para entrega'
        ];
      }

    } catch (err) {
    }

    return {
      order,
      invoice,
      pickup,
      cte,
      bill,
      occurrences
    };
  },

  fetchOrderTrackingData: async (searchValue: string, isTrackingCode?: boolean): Promise<OrderTrackingData | null> => {
    try {
      // Buscar pedido
      const orders = await ordersService.getAll();
      const order = orders.find(o =>
        isTrackingCode
          ? o.tracking_code?.toLowerCase().includes(searchValue.toLowerCase())
          : o.order_number?.toLowerCase().includes(searchValue.toLowerCase())
      );

      if (!order) return null;

      // Buscar NF-e vinculada ao pedido
      const { data: invoices } = await (supabase as any)
        .from('invoices_nfe')
        .select('*')
        .eq('order_number', order.order_number)
        .limit(1)
        .maybeSingle();

      // Buscar coleta vinculada à NF-e (se existir)
      let pickup = null;
      if (invoices) {
        let pickupInvoices = null;
        
        if (invoices.id) {
           const { data: byId } = await (supabase as any)
             .from('pickup_invoices')
             .select('pickup_id')
             .eq('invoice_id', invoices.id)
             .limit(1)
             .maybeSingle();
           if (byId) pickupInvoices = byId;
        }
        
        if (!pickupInvoices && invoices.chave_acesso) {
           const { data: byKey } = await (supabase as any)
             .from('pickup_invoices')
             .select('pickup_id')
             .eq('access_key', invoices.chave_acesso)
             .limit(1)
             .maybeSingle();
           if (byKey) pickupInvoices = byKey;
        }

        if (pickupInvoices) {
          const { data: pickupData } = await (supabase as any)
            .from('pickups')
            .select('*')
            .eq('id', pickupInvoices.pickup_id)
            .limit(1)
            .maybeSingle();

          pickup = pickupData;
        }
      }

      // Buscar CT-e vinculado à NF-e (se existir)
      let cte = null;
      if (invoices) {
        const invNum = invoices.number || invoices.numero;
        if (invNum) {
          const { data: cteData } = await (supabase as any)
            .from('ctes_complete')
            .select('*')
            .or(`invoice_number.eq.${invNum},numero_nfe.eq.${invNum}`)
            .limit(1)
            .maybeSingle();

          if (cteData) {
            cte = cteData;
          } else {
             let { data: ctesInvoicesData } = await (supabase as any)
               .from('ctes_invoices')
               .select('cte_id')
               .eq('number', invNum)
               .limit(1)
               .maybeSingle();

             if (!ctesInvoicesData && invoices.chave_acesso) {
                 const { data: ctesInvoicesByObs } = await (supabase as any)
                   .from('ctes_invoices')
                   .select('cte_id')
                   .ilike('observations', `%${invoices.chave_acesso}%`)
                   .limit(1)
                   .maybeSingle();
                 
                 if (ctesInvoicesByObs) ctesInvoicesData = ctesInvoicesByObs;
             }

             if (ctesInvoicesData) {
                 const { data: fallbackCte } = await (supabase as any)
                   .from('ctes_complete')
                   .select('*')
                   .eq('id', ctesInvoicesData.cte_id)
                   .limit(1)
                   .maybeSingle();
                 if (fallbackCte) cte = fallbackCte;
             }
          }
        }
      }

      // Buscar Fatura vinculada ao CT-e (se existir)
      let bill = null;
      if (cte?.id) {
          const { data: billCte } = await (supabase as any)
            .from('bill_ctes')
            .select('bill_id')
            .eq('cte_id', cte.id)
            .limit(1)
            .maybeSingle();

          if (billCte) {
             const { data: billData } = await (supabase as any)
               .from('bills')
               .select('*')
               .eq('id', billCte.bill_id)
               .limit(1)
               .maybeSingle();
             if (billData) bill = billData;
          }
      }

      // Mesclar e deduplicar ocorrências de todos os documentos
      let rawOccs: any[] = [];
      if ((order as any)?.metadata?.occurrences) rawOccs = [...rawOccs, ...(order as any).metadata.occurrences];
      if (invoices?.metadata?.occurrences) rawOccs = [...rawOccs, ...invoices.metadata.occurrences];
      if (cte?.metadata?.occurrences) rawOccs = [...rawOccs, ...cte.metadata.occurrences];
      if (pickup?.metadata?.occurrences) rawOccs = [...rawOccs, ...pickup.metadata.occurrences];

      let occurrences: any[] = [];
      if (rawOccs.length > 0) {
        const unique = new Map();
        rawOccs.forEach(o => unique.set(o.codigo || o.id, o));
        occurrences = Array.from(unique.values());
      } else if (cte?.status === 'entregue' || invoices?.status === 'entregue' || order?.status === 'delivered' || (order as any)?.status === 'entregue') {
        const d = cte?.updated_at || invoices?.updated_at || order?.updated_at;
        occurrences = [
          { codigo: '100', descricao: 'Em rota de entrega', created_at: d },
          { codigo: '01', descricao: 'Entrega realizada', created_at: d }
        ];
      } else if (['saiu_entrega', 'saiu_para_entrega', 'saiu p/ entrega', 'out_for_delivery'].includes(cte?.status?.toLowerCase() || '') ||
                 ['saiu_entrega', 'saiu_para_entrega', 'saiu p/ entrega', 'out_for_delivery'].includes(invoices?.status?.toLowerCase() || '') ||
                 ['saiu_entrega', 'saiu_para_entrega', 'saiu p/ entrega', 'out_for_delivery'].includes(order?.status?.toLowerCase() || '') ||
                 ['saiu_entrega', 'saiu_para_entrega', 'saiu p/ entrega', 'out_for_delivery'].includes((order as any)?.status?.toLowerCase() || '')) {
        const d = cte?.updated_at || invoices?.updated_at || order?.updated_at;
        occurrences = [
          { codigo: '100', descricao: 'Em rota de entrega', created_at: d }
        ];
      } else if (cte?.status === 'em_transito' || order?.status === 'in_transit' || (order as any)?.status === 'em_transito') {
        occurrences = [
          // Removemos codigo '100' aqui para nao pular 'Em transporte' direto pra 'Saiu para entrega'
        ];
      }

      return {
        order,
        invoice: invoices,
        pickup,
        cte,
        bill,
        occurrences
      };
    } catch (error) {
      return null;
    }
  },

  syncDocumentTrackingStatus: async (documentType: 'nfe' | 'order', documentId: string, documentValue: string) => {
    try {
      let trackingData = null;
      let orderId = null;
      let nfeId = null;

      if (documentType === 'order') {
        trackingData = await trackingService.fetchOrderTrackingData(documentValue, false);
        if (trackingData && trackingData.order) {
           orderId = trackingData.order.id;
        }
        if (trackingData && trackingData.invoice) {
           nfeId = trackingData.invoice.id;
        }
      } else {
        const { data: invoice } = await (supabase as any).from('invoices_nfe').select('*').eq('id', documentId).maybeSingle();
        if (invoice) {
           trackingData = await trackingService.fetchTrackingDataFromDocument('nfe', invoice);
           nfeId = invoice.id;
           if (trackingData && trackingData.order) {
              orderId = trackingData.order.id;
           }
        }
      }

      if (!trackingData) return;

      const outStatuses = ['saiu_entrega', 'saiu p/ entrega', 'saiu_para_entrega', 'out_for_delivery'];
      const hasOutStatus = outStatuses.includes(trackingData.order?.status?.toLowerCase() || '') ||
                           outStatuses.includes(trackingData.invoice?.status?.toLowerCase() || '') ||
                           outStatuses.includes(trackingData.cte?.status?.toLowerCase() || '');
                           
      const outForDeliveryOcc = trackingData.occurrences?.find(o => 
        o.codigo === '100' || 
        (o.descricao && (o.descricao.toLowerCase().includes('saiu para entrega') || o.descricao.toLowerCase().includes('em rota de entrega') || o.descricao.toLowerCase().includes('saiu p/ entrega')))
      );

      const hasOut = !!outForDeliveryOcc || hasOutStatus;

      const deliveredStatuses = ['entregue', 'delivered'];
      const isDeliveredStatus = deliveredStatuses.includes(trackingData.order?.status?.toLowerCase() || '') ||
                                deliveredStatuses.includes(trackingData.invoice?.status?.toLowerCase() || '') ||
                                deliveredStatuses.includes(trackingData.cte?.status?.toLowerCase() || '');

      const isDeliveredOcc = trackingData.occurrences?.find(o => 
        ['001', '002', '003', '01', '02', '03'].includes(o.codigo) || 
        (o.descricao && (o.descricao.toLowerCase().includes('entrega realizada') || o.descricao.toLowerCase().includes('entregue')))
      );

      const isDelivered = !!isDeliveredOcc || isDeliveredStatus;
      const hasCte = !!trackingData.cte || trackingData.occurrences?.some(o => ['em_transito', '004', '005'].includes(o.codigo));

      const collectOcc = trackingData.occurrences?.find(o => o.codigo === '019' || (o.descricao && o.descricao.toLowerCase().includes('coleta realizada')));
      const collectStatuses = ['coletada', 'coletado_transportadora', 'coleta_realizada'];
      const isCollectedStatus = collectStatuses.includes(trackingData.invoice?.status?.toLowerCase() || '') ||
                                collectStatuses.includes(trackingData.order?.status?.toLowerCase() || '');
      const isCollected = !!collectOcc || isCollectedStatus;

      let calculatedStatus = null;
      if (isDelivered) {
        calculatedStatus = 'entregue';
      } else if (hasOut) {
        calculatedStatus = 'saiu_entrega';
      } else if (hasCte) {
        calculatedStatus = 'em_transito';
      } else if (isCollected) {
        calculatedStatus = 'coletada';
      } else if (trackingData.pickup || trackingData.occurrences?.some(o => o.descricao?.toLowerCase().includes('aguardando coleta'))) {
        calculatedStatus = 'aguardando_coleta';
      }

      if (!calculatedStatus) return;

      if (nfeId) {
        await (supabase as any).from('invoices_nfe').update({ 
          situacao: calculatedStatus, 
          updated_at: new Date().toISOString() 
        }).eq('id', nfeId);
      }
      
      if (orderId) {
        const orderStatus = calculatedStatus === 'coletada' ? 'coletado' : calculatedStatus;
        await (supabase as any).from('orders').update({ 
          status: orderStatus, 
          updated_at: new Date().toISOString() 
        }).eq('id', orderId);
      }
    } catch (error) {
    }
  }
};
