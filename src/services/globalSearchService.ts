import { supabase } from '../lib/supabase';
import { setSessionContext } from '../lib/sessionContext';

export interface SearchResult {
  id: string;
  type: 'order' | 'invoice' | 'cte' | 'bill' | 'pickup';
  title: string;
  subtitle: string;
  status?: string;
  value?: number;
}

export const globalSearchService = {
  truncateName(name: string, maxLength: number = 25): string {
    if (!name) return '';
    return name.length > maxLength ? `${name.substring(0, maxLength)}...` : name;
  },

  async search(term: string): Promise<SearchResult[]> {
    if (!term || term.length < 2) return [];

    try {
      let orgId: string | undefined;
      let envId: string | undefined;

      const storedUser = localStorage.getItem('tms-user');
      if (storedUser) {
        const userObj = JSON.parse(storedUser);
        orgId = userObj.organization_id || userObj.user?.organization_id;
        envId = userObj.environment_id || userObj.user?.environment_id;
        
        if (orgId && envId) {
          await setSessionContext(orgId, envId);
        }
      }

      if (!orgId) return [];

      const ilikeTerm = `%${term}%`;
      
      const promises = [];

      // 1. Orders
      let ordersQuery = (supabase as any)
        .from('orders')
        .select(`id, numero_pedido, codigo_rastreio, status, valor_mercadoria, destino_cidade, destino_estado, business_partners(razao_social)`);
      
      ordersQuery = ordersQuery.or(`numero_pedido.ilike.${ilikeTerm},codigo_rastreio.ilike.${ilikeTerm}`).limit(5);
      promises.push(ordersQuery);

      // 2. Invoices (NF-e)
      let invoicesQuery = (supabase as any)
        .from('invoices_nfe')
        .select(`id, numero, chave_acesso, situacao, valor_total, customer:invoices_nfe_customers(razao_social), carrier:carriers(razao_social)`);
      
      invoicesQuery = invoicesQuery.or(`numero.ilike.${ilikeTerm},chave_acesso.ilike.${ilikeTerm}`).limit(5);
      promises.push(invoicesQuery);

      // 3. CTes
      let ctesQuery = (supabase as any)
        .from('ctes_complete')
        .select(`id, number, access_key, status, total_value, sender_name, recipient_name, carrier:carriers(razao_social)`);
      
      ctesQuery = ctesQuery.or(`number.ilike.${ilikeTerm},access_key.ilike.${ilikeTerm},sender_name.ilike.${ilikeTerm},recipient_name.ilike.${ilikeTerm}`).limit(5);
      promises.push(ctesQuery);

      // 4. Bills
      let billsQuery = (supabase as any)
        .from('bills')
        .select(`id, bill_number, customer_name, status, total_value`);
      
      billsQuery = billsQuery.or(`bill_number.ilike.${ilikeTerm},customer_name.ilike.${ilikeTerm}`).limit(5);
      promises.push(billsQuery);

      // 5. Pickups
      let pickupsQuery = (supabase as any)
        .from('pickups')
        .select(`id, numero_coleta, status, carrier:carriers(razao_social), contato_nome, valor_total`);
      
      pickupsQuery = pickupsQuery.or(`numero_coleta.ilike.${ilikeTerm},contato_nome.ilike.${ilikeTerm}`).limit(5);

      const [ordersRes, invoicesRes, ctesRes, billsRes, pickupsRes] = await Promise.all([
        ordersQuery,
        invoicesQuery,
        ctesQuery,
        billsQuery,
        pickupsQuery
      ]);

      const results: SearchResult[] = [];

      if (ordersRes.data) {
        ordersRes.data.forEach((o: any) => {
          let mappedStatus = o.status || 'emitido';
          if (o.status === 'processando' || o.status === 'pendente' || o.status === 'emitido') mappedStatus = 'emitido';
          else if (o.status === 'coletado') mappedStatus = 'coletado';
          else if (o.status === 'em_transito') mappedStatus = 'em_transito';
          else if (o.status === 'saiu_entrega') mappedStatus = 'saiu_entrega';
          else if (o.status === 'entregue') mappedStatus = 'entregue';
          else if (o.status === 'cancelado') mappedStatus = 'cancelado';
          
          results.push({
            id: o.id.toString(),
            type: 'order',
            title: `Pedido ${o.numero_pedido || ''}`,
            subtitle: `${globalSearchService.truncateName(o.business_partners?.razao_social || 'Cliente não informado')}`,
            status: mappedStatus,
            value: parseFloat(o.valor_mercadoria || 0)
          });
        });
      }

      if (invoicesRes.data) {
        invoicesRes.data.forEach((i: any) => {
          results.push({
            id: i.id.toString(),
            type: 'invoice',
            title: `NF-e ${i.numero || ''}`,
            subtitle: `${globalSearchService.truncateName(i.customer?.[0]?.razao_social || 'Sem cliente')}`,
            status: i.situacao,
            value: parseFloat(i.valor_total || 0)
          });
        });
      }

      if (ctesRes.data) {
        ctesRes.data.forEach((c: any) => {
          results.push({
            id: c.id.toString(),
            type: 'cte',
            title: `CT-e ${c.number || ''}`,
            subtitle: `${globalSearchService.truncateName(c.sender_name || 'Remetente não informado')}`,
            status: c.status,
            value: parseFloat(c.total_value || 0)
          });
        });
      }

      if (billsRes.data) {
        billsRes.data.forEach((b: any) => {
          results.push({
            id: b.id.toString(),
            type: 'bill',
            title: `Fatura ${b.bill_number}`,
            subtitle: `${globalSearchService.truncateName(b.customer_name || 'Diversos')}`,
            status: b.status,
            value: parseFloat(b.total_value || 0)
          });
        });
      }

      if (pickupsRes.data) {
        pickupsRes.data.forEach((p: any) => {
          const transportador = p.carrier && p.carrier.razao_social ? p.carrier.razao_social : 'Não inf.';
          results.push({
            id: p.id.toString(),
            type: 'pickup',
            title: `Coleta ${p.numero_coleta || p.id}`,
            subtitle: `${globalSearchService.truncateName(p.contato_nome || 'Remetente não informado')}`,
            status: p.status,
            value: parseFloat(p.valor_total || 0)
          });
        });
      }

      if (ordersRes.error) null;
      if (invoicesRes.error) null;
      if (ctesRes.error) null;
      if (billsRes.error) null;
      if (pickupsRes.error) null;

      return results;
    } catch (error) {
      return [];
    }
  }
};
