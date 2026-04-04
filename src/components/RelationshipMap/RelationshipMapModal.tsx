import React, { useState, useEffect } from 'react';
import { X, FileText, Package, Truck, CreditCard, ExternalLink, RefreshCw, PackageCheck } from 'lucide-react';
import ReactFlow, { 
  Node, 
  Edge, 
  Background, 
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Position,
  Handle
} from 'reactflow';
import 'reactflow/dist/style.css';

// Document types
type DocumentType = 'order' | 'invoice' | 'pickup' | 'cte' | 'bill';

// Document interface
interface Document {
  id: string;
  type: DocumentType;
  number: string;
  date: string;
  status: string;
  value: number;
}

// Relationship map modal props
interface RelationshipMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceDocument: Document;
  onDocumentClick?: (document: Document) => void;
}

import { supabase } from '../../lib/supabase';

// Add these to imports at the top:
// import { supabase } from '../../lib/supabase';

const getLiveRelatedDocuments = async (sourceDocument: Document) => {
  const documents: Document[] = [sourceDocument];
  const relationships: Array<{from: string, to: string}> = [];
  
  if (sourceDocument.type === 'order') {
    // Busca Invoices e CTes relacionados a esse pedido
    const orderId = sourceDocument.id.replace('order-', '');
    const orderNumber = sourceDocument.number;
    
    // Invoices by order_number no invoices_nfe
    const { data: invoicesData } = await (supabase as any)
      .from('invoices_nfe')
      .select('id, numero, data_emissao, situacao, valor_total')
      .eq('order_number', orderNumber);

    if (invoicesData && invoicesData.length > 0) {
      const invoiceIds = invoicesData.map((inv: any) => inv.id);

      for (const inv of invoicesData) {
        const invId = `invoice-${inv.id}`;
        documents.push({
          id: invId,
          type: 'invoice',
          number: inv.numero,
          date: inv.data_emissao || new Date().toISOString(),
          status: inv.situacao || 'Emitida',
          value: Number(inv.valor_total || 0)
        });
        relationships.push({ from: sourceDocument.id, to: invId });
      }

      // Busca CTes conectados a essas Invoices usando 'invoice_id' + tabela ponte 'ctes_invoices'
      const invoiceNumbers = invoicesData.map((inv: any) => inv.numero);

      const { data: cteLinksByNum } = await (supabase as any)
        .from('ctes_invoices')
        .select('cte_id, number')
        .in('number', invoiceNumbers);

      const resolvedCteIds = cteLinksByNum ? cteLinksByNum.map((l:any) => l.cte_id) : [];

      const ctesData: any[] = [];

      if (resolvedCteIds.length > 0) {
        const { data: ctesDataLinked } = await (supabase as any)
          .from('ctes_complete')
          .select('id, number, issue_date, status, total_value')
          .in('id', resolvedCteIds);
          
        if (ctesDataLinked) {
          for (const c of ctesDataLinked) {
            if (!ctesData.some(existing => existing.id === c.id)) {
              ctesData.push(c);
            }
          }
        }
      }
        
      const cteIds: string[] = [];
      if (ctesData && ctesData.length > 0) {
        for (const cte of ctesData) {
          cteIds.push(cte.id);
          const cteId = `cte-${cte.id}`;
          documents.push({
            id: cteId,
            type: 'cte',
            number: cte.number,
            date: cte.issue_date || new Date().toISOString(),
            status: cte.status || 'Emitido',
            value: Number(cte.total_value || 0)
          });
          
          // Connect back to the corresponding invoice
          let sourceInvId = null;
          // Find which invoice number linked to this CTE from cteLinksByNum
          const link = cteLinksByNum?.find((l:any) => l.cte_id === cte.id);
          if (link) {
            const inv = invoicesData.find((i:any) => i.numero === link.number);
            if (inv) sourceInvId = `invoice-${inv.id}`;
          }
          if (sourceInvId) {
            relationships.push({ from: sourceInvId, to: cteId });
          }
        }
      }

      // Busca Coletas conectadas a essas Invoices
      const { data: pickupLinks } = await (supabase as any)
        .from('pickup_invoices')
        .select('invoice_id, pickup_id, pickups(numero_coleta, created_at, status, valor_total)')
        .in('invoice_id', invoiceIds);

      if (pickupLinks && pickupLinks.length > 0) {
        for (const link of pickupLinks) {
          if (link.pickups) {
            const pickupDocId = `pickup-${link.pickup_id}`;
            if (!documents.some(d => d.id === pickupDocId)) {
              documents.push({
                id: pickupDocId,
                type: 'pickup',
                number: link.pickups.numero_coleta,
                date: link.pickups.created_at || new Date().toISOString(),
                status: link.pickups.status || 'Emitida',
                value: Number(link.pickups.valor_total || 0)
              });
            }
            if (!relationships.some(r => r.from === `invoice-${link.invoice_id}` && r.to === pickupDocId)) {
              relationships.push({ from: `invoice-${link.invoice_id}`, to: pickupDocId });
            }
          }
        }
      }

      // Busca Faturas conectadas a esses CTes
      if (cteIds.length > 0) {
        const { data: billLinks } = await (supabase as any)
          .from('bill_ctes')
          .select('cte_id, bill_id, bills(bill_number, issue_date, status, total_value)')
          .in('cte_id', cteIds);

        if (billLinks && billLinks.length > 0) {
          for (const link of billLinks) {
            if (link.bills) {
              const billDocId = `bill-${link.bill_id}`;
              if (!documents.some(d => d.id === billDocId)) {
                documents.push({
                  id: billDocId,
                  type: 'bill',
                  number: link.bills.bill_number,
                  date: link.bills.issue_date || new Date().toISOString(),
                  status: link.bills.status || 'Emitida',
                  value: Number(link.bills.total_value || 0)
                });
              }
              if (!relationships.some(r => r.from === `cte-${link.cte_id}` && r.to === billDocId)) {
                relationships.push({ from: `cte-${link.cte_id}`, to: billDocId });
              }
            }
          }
        }
      }
    } else {
      // Se não tem invoice, tenta achar CTe direto pelo order_id
      const { data: ctesDirect } = await (supabase as any)
        .from('ctes')
        .select('id, numero, data_emissao, status, valor_servico')
        .eq('order_id', orderId);
        
      if (ctesDirect && ctesDirect.length > 0) {
        for (const cte of ctesDirect) {
          const cteId = `cte-${cte.id}`;
          documents.push({
            id: cteId,
            type: 'cte',
            number: cte.numero,
            date: cte.data_emissao || new Date().toISOString(),
            status: cte.status || 'Emitido',
            value: Number(cte.valor_servico || 0)
          });
          relationships.push({ from: sourceDocument.id, to: cteId });
        }
      }
    }
  } else if (sourceDocument.type === 'invoice') {
    // A partir daqui pode-se expandir os fluxos reversos (abre mapa pela Invoice)
    const invoiceId = sourceDocument.id.replace('invoice-', '');
    
    // Busca Pedido relacionado a essa invoice
    const { data: invoiceData } = await (supabase as any)
      .from('invoices_nfe')
      .select('order_number')
      .eq('id', invoiceId)
      .maybeSingle();

    if (invoiceData && invoiceData.order_number) {
      const { data: orderData } = await (supabase as any)
        .from('orders')
        .select('id, numero_pedido, data_pedido, status, valor_mercadoria')
        .eq('numero_pedido', invoiceData.order_number)
        .maybeSingle();

      if (orderData) {
        const orderId = `order-${orderData.id}`;
        documents.push({
          id: orderId,
          type: 'order',
          number: orderData.numero_pedido,
          date: orderData.data_pedido || new Date().toISOString(),
          status: orderData.status || 'Pendente',
          value: Number(orderData.valor_mercadoria || 0)
        });
        relationships.push({ from: orderId, to: sourceDocument.id });
      }
    }
    
    // Procura CTes conectados a essa Invoice (buscando via tabela ponte ctes_invoices)
    const invNumber = sourceDocument.number;
      
    // Busca na tabela ponte ctes_invoices
    const { data: cteLinksByNum } = await (supabase as any)
      .from('ctes_invoices')
      .select('cte_id, number')
      .eq('number', invNumber);
      
    const resolvedCteIds = cteLinksByNum ? cteLinksByNum.map((l:any) => l.cte_id) : [];
    
    const ctesData: any[] = [];
    
    if (resolvedCteIds.length > 0) {
      const { data: ctesDataLinked } = await (supabase as any)
        .from('ctes_complete')
        .select('id, number, issue_date, status, total_value')
        .in('id', resolvedCteIds);
        
      if (ctesDataLinked) {
        for (const c of ctesDataLinked) {
          if (!ctesData.some(existing => existing.id === c.id)) {
            ctesData.push(c);
          }
        }
      }
    }
      
    if (ctesData && ctesData.length > 0) {
      const cteIds = ctesData.map((cte:any) => cte.id);
      for (const cte of ctesData) {
        const cteId = `cte-${cte.id}`;
        documents.push({
          id: cteId,
          type: 'cte',
          number: cte.number,
          date: cte.issue_date || new Date().toISOString(),
          status: cte.status || 'Emitido',
          value: Number(cte.total_value || 0)
        });
        relationships.push({ from: sourceDocument.id, to: cteId });
      }

      // Procura Faturas a partir do CTe
      const { data: billLinks } = await (supabase as any)
        .from('bill_ctes')
        .select('cte_id, bill_id, bills(bill_number, issue_date, status, total_value)')
        .in('cte_id', cteIds);

      if (billLinks && billLinks.length > 0) {
        for (const link of billLinks) {
          if (link.bills) {
            const billDocId = `bill-${link.bill_id}`;
            if (!documents.some(d => d.id === billDocId)) {
              documents.push({
                id: billDocId,
                type: 'bill',
                number: link.bills.bill_number,
                date: link.bills.issue_date || new Date().toISOString(),
                status: link.bills.status || 'Emitida',
                value: Number(link.bills.total_value || 0)
              });
            }
            if (!relationships.some(r => r.from === `cte-${link.cte_id}` && r.to === billDocId)) {
              relationships.push({ from: `cte-${link.cte_id}`, to: billDocId });
            }
          }
        }
      }
    }

    // Busca Coletas ligadas a essa Invoice
    const { data: pickupLink } = await (supabase as any)
      .from('pickup_invoices')
      .select('pickup_id, pickups(numero_coleta, created_at, status, valor_total)')
      .eq('invoice_id', invoiceId);
      
    if (pickupLink && pickupLink.length > 0) {
      for (const link of pickupLink) {
        if (link.pickups) {
          const pickupDocId = `pickup-${link.pickup_id}`;
          documents.push({
            id: pickupDocId,
            type: 'pickup',
            number: link.pickups.numero_coleta,
            date: link.pickups.created_at || new Date().toISOString(),
            status: link.pickups.status || 'Emitida',
            value: Number(link.pickups.valor_total || 0)
          });
          relationships.push({ from: sourceDocument.id, to: pickupDocId });
        }
      }
    }
  } else if (sourceDocument.type === 'pickup') {
    const pickupId = sourceDocument.id.replace('pickup-', '');
    
    // Busca links na tabela-ponte
    const { data: invoiceLinks } = await (supabase as any)
      .from('pickup_invoices')
      .select('invoice_id')
      .eq('pickup_id', pickupId);
      
    if (invoiceLinks && invoiceLinks.length > 0) {
      const ids = invoiceLinks.map((l: any) => l.invoice_id);
      
      // Procura no invoices_nfe
      const { data: nfes } = await (supabase as any)
        .from('invoices_nfe')
        .select('id, numero, data_emissao, situacao, valor_total, order_number')
        .in('id', ids);
        
      if (nfes && nfes.length > 0) {
        for (const nfe of nfes) {
          const invId = `invoice-${nfe.id}`;
          documents.push({
            id: invId,
            type: 'invoice',
            number: nfe.numero,
            date: nfe.data_emissao || new Date().toISOString(),
            status: nfe.situacao || 'Emitida',
            value: Number(nfe.valor_total || 0)
          });
          // Seta saindo da Nota para a Coleta
          relationships.push({ from: invId, to: sourceDocument.id });
          
          // Busca Pedido upstream dessa invoice se houver
          if (nfe.order_number) {
            const { data: orderData } = await (supabase as any)
              .from('orders')
              .select('id, numero_pedido, data_pedido, status, valor_mercadoria')
              .eq('numero_pedido', nfe.order_number)
              .maybeSingle();

            if (orderData) {
              const orderId = `order-${orderData.id}`;
              // previne duplicatas caso múltiplas notas venham do mesmo pedido
              if (!documents.some(d => d.id === orderId)) {
                documents.push({
                  id: orderId,
                  type: 'order',
                  number: orderData.numero_pedido,
                  date: orderData.data_pedido || new Date().toISOString(),
                  status: orderData.status || 'Pendente',
                  value: Number(orderData.valor_mercadoria || 0)
                });
              }
              relationships.push({ from: orderId, to: invId });
            }
          }
        }

        // Procura CTes conectados a essas Invoices (buscando via tabela ponte ctes_invoices)
        const invoiceNumbers = nfes.map((nfe: any) => nfe.numero);
        
        const { data: cteLinksByNum } = await (supabase as any)
          .from('ctes_invoices')
          .select('cte_id, number')
          .in('number', invoiceNumbers);
          
        const resolvedCteIds = cteLinksByNum ? cteLinksByNum.map((l:any) => l.cte_id) : [];
        
        const ctesData: any[] = [];
        
        if (resolvedCteIds.length > 0) {
          const { data: ctesDataLinked } = await (supabase as any)
            .from('ctes_complete')
            .select('id, number, issue_date, status, total_value')
            .in('id', resolvedCteIds);
            
          if (ctesDataLinked) {
            for (const c of ctesDataLinked) {
              if (!ctesData.some(existing => existing.id === c.id)) {
                ctesData.push(c);
              }
            }
          }
        }
          
        if (ctesData && ctesData.length > 0) {
          const cteIds = ctesData.map((cte:any) => cte.id);
          for (const cte of ctesData) {
            const cteId = `cte-${cte.id}`;
            documents.push({
              id: cteId,
              type: 'cte',
              number: cte.number,
              date: cte.issue_date || new Date().toISOString(),
              status: cte.status || 'Emitido',
              value: Number(cte.total_value || 0)
            });
            
            // Connect back to the corresponding invoice
            let sourceInvId = null;
            const link = cteLinksByNum?.find((l:any) => l.cte_id === cte.id);
            if (link) {
              const inv = nfes.find((i:any) => i.numero === link.number);
              if (inv) sourceInvId = `invoice-${inv.id}`;
            }
            if (sourceInvId) {
              relationships.push({ from: sourceInvId, to: cteId });
            }
          }

          // Busca Faturas a partir do CTe
          const { data: billLinks } = await (supabase as any)
            .from('bill_ctes')
            .select('cte_id, bill_id, bills(bill_number, issue_date, status, total_value)')
            .in('cte_id', cteIds);

          if (billLinks && billLinks.length > 0) {
            for (const link of billLinks) {
              if (link.bills) {
                const billDocId = `bill-${link.bill_id}`;
                if (!documents.some(d => d.id === billDocId)) {
                  documents.push({
                    id: billDocId,
                    type: 'bill',
                    number: link.bills.bill_number,
                    date: link.bills.issue_date || new Date().toISOString(),
                    status: link.bills.status || 'Emitida',
                    value: Number(link.bills.total_value || 0)
                  });
                }
                if (!relationships.some(r => r.from === `cte-${link.cte_id}` && r.to === billDocId)) {
                  relationships.push({ from: `cte-${link.cte_id}`, to: billDocId });
                }
              }
            }
          }
        }
      }
    }
  } else if (sourceDocument.type === 'cte') {
    const cteId = sourceDocument.id.replace('cte-', '');
    
    // Busca Invoices e Pedidos relacionados ao CTe na tabela ctes_invoices
    const { data: cteInvoices } = await (supabase as any)
      .from('ctes_invoices')
      .select('number, observations')
      .eq('cte_id', cteId);

    if (cteInvoices && cteInvoices.length > 0) {
      const accessKeys: string[] = [];
      const invoiceNumbers: string[] = [];
      
      cteInvoices.forEach((cteInv: any) => {
        // Se a observação conter a chave de acesso gerada na importação
        const matchKey = cteInv.observations?.match(/Chave:\s*([0-9]{44})/);
        if (matchKey && matchKey[1]) {
          accessKeys.push(matchKey[1]);
        } else if (cteInv.number) {
          invoiceNumbers.push(cteInv.number);
        }
      });

      // Busca por chave primeiro
      if (accessKeys.length > 0) {
        const { data: nfesByKey } = await (supabase as any)
          .from('invoices_nfe')
          .select('id, numero, data_emissao, situacao, valor_total, order_number')
          .in('chave_acesso', accessKeys);
          
        if (nfesByKey && nfesByKey.length > 0) {
          for (const nfe of nfesByKey) {
            const invId = `invoice-${nfe.id}`;
            documents.push({
              id: invId,
              type: 'invoice',
              number: nfe.numero,
              date: nfe.data_emissao || new Date().toISOString(),
              status: nfe.situacao || 'Emitida',
              value: Number(nfe.valor_total || 0)
            });
            relationships.push({ from: invId, to: sourceDocument.id });
            
            // Busca pedido
            if (nfe.order_number) {
              const { data: orderData } = await (supabase as any)
                .from('orders')
                .select('id, numero_pedido, data_pedido, status, valor_mercadoria')
                .eq('numero_pedido', nfe.order_number)
                .maybeSingle();
                
              if (orderData) {
                const orderId = `order-${orderData.id}`;
                if (!documents.some(d => d.id === orderId)) {
                  documents.push({
                    id: orderId,
                    type: 'order',
                    number: orderData.numero_pedido,
                    date: orderData.data_pedido || new Date().toISOString(),
                    status: orderData.status || 'Pendente',
                    value: Number(orderData.valor_mercadoria || 0)
                  });
                }
                relationships.push({ from: orderId, to: invId });
              }
            }
          }
        }
      }
      
      // Busca por numero da Invoice para os CTes não linkados por chave
      if (invoiceNumbers.length > 0) {
        // Excluindo os já achados
        const nfesAchados = documents.map(d => d.number);
        const numerosBuscados = invoiceNumbers.filter(n => !nfesAchados.includes(n));
        
        if (numerosBuscados.length > 0) {
          const { data: nfesByNum } = await (supabase as any)
            .from('invoices_nfe')
            .select('id, numero, data_emissao, situacao, valor_total, order_number')
            .in('numero', numerosBuscados);
            
          if (nfesByNum && nfesByNum.length > 0) {
            for (const nfe of nfesByNum) {
              const invId = `invoice-${nfe.id}`;
              if (!documents.some(d => d.id === invId)) {
                documents.push({
                  id: invId,
                  type: 'invoice',
                  number: nfe.numero,
                  date: nfe.data_emissao || new Date().toISOString(),
                  status: nfe.situacao || 'Emitida',
                  value: Number(nfe.valor_total || 0)
                });
                relationships.push({ from: invId, to: sourceDocument.id });
                
                // Busca Pedido
                if (nfe.order_number) {
                  const { data: orderData } = await (supabase as any)
                    .from('orders')
                    .select('id, numero_pedido, data_pedido, status, valor_mercadoria')
                    .eq('numero_pedido', nfe.order_number)
                    .maybeSingle();

                  if (orderData) {
                    const orderId = `order-${orderData.id}`;
                    if (!documents.some(d => d.id === orderId)) {
                      documents.push({
                        id: orderId,
                        type: 'order',
                        number: orderData.numero_pedido,
                        date: orderData.data_pedido || new Date().toISOString(),
                        status: orderData.status || 'Pendente',
                        value: Number(orderData.valor_mercadoria || 0)
                      });
                    }
                    relationships.push({ from: orderId, to: invId });
                  }
                }
              }
            }
          }
        }
      }
    } else {
      // Se não, busca fallback onde o invoice_id pode estar diretamente no cte
      const { data: cteDireto } = await (supabase as any)
        .from('ctes')
        .select('invoice_id, invoices_nfe(id, numero, data_emissao, situacao, valor_total, order_number)')
        .eq('id', cteId)
        .maybeSingle();
        
      if (cteDireto && cteDireto.invoices_nfe) {
        const nfe = cteDireto.invoices_nfe;
        const invId = `invoice-${nfe.id}`;
        documents.push({
          id: invId,
          type: 'invoice',
          number: nfe.numero,
          date: nfe.data_emissao || new Date().toISOString(),
          status: nfe.situacao || 'Emitida',
          value: Number(nfe.valor_total || 0)
        });
        relationships.push({ from: invId, to: sourceDocument.id });
      }
    }

    // Busca Coletas ligadas às Invoices encontradas para esse CT-e
    const invIdsToCheck = documents.filter(d => d.type === 'invoice').map(d => d.id.replace('invoice-', ''));
    if (invIdsToCheck.length > 0) {
      const { data: pickupLinks } = await (supabase as any)
        .from('pickup_invoices')
        .select('invoice_id, pickup_id, pickups(numero_coleta, created_at, status, valor_total)')
        .in('invoice_id', invIdsToCheck);
        
      if (pickupLinks && pickupLinks.length > 0) {
        for (const link of pickupLinks) {
          if (link.pickups) {
            const pickupDocId = `pickup-${link.pickup_id}`;
            if (!documents.some(d => d.id === pickupDocId)) {
              documents.push({
                id: pickupDocId,
                type: 'pickup',
                number: link.pickups.numero_coleta,
                date: link.pickups.created_at || new Date().toISOString(),
                status: link.pickups.status || 'Emitida',
                value: Number(link.pickups.valor_total || 0)
              });
            }
            const invId = `invoice-${link.invoice_id}`;
            if (!relationships.some(r => r.from === invId && r.to === pickupDocId)) {
              relationships.push({ from: invId, to: pickupDocId });
            }
          }
        }
      }
    }
    
    // Procura Faturas diretamente conectadas a esse CT-e na raiz
    const { data: billLinks } = await (supabase as any)
      .from('bill_ctes')
      .select('cte_id, bill_id, bills(bill_number, issue_date, status, total_value)')
      .eq('cte_id', cteId);

    if (billLinks && billLinks.length > 0) {
      for (const link of billLinks) {
        if (link.bills) {
          const billDocId = `bill-${link.bill_id}`;
          if (!documents.some(d => d.id === billDocId)) {
            documents.push({
              id: billDocId,
              type: 'bill',
              number: link.bills.bill_number,
              date: link.bills.issue_date || new Date().toISOString(),
              status: link.bills.status || 'Emitida',
              value: Number(link.bills.total_value || 0)
            });
          }
          if (!relationships.some(r => r.from === sourceDocument.id && r.to === billDocId)) {
            relationships.push({ from: sourceDocument.id, to: billDocId });
          }
        }
      }
    }
  } else if (sourceDocument.type === 'bill') {
    const billId = sourceDocument.id.replace('bill-', '');

    // Busca as chaves de ligação na tabela bill_ctes primeiro (não possui FK direta para ctes no schema)
    const { data: rawCteLinks } = await (supabase as any)
      .from('bill_ctes')
      .select('cte_id')
      .eq('bill_id', billId);

    const cteIds = (rawCteLinks || []).map((l: any) => l.cte_id);

    if (cteIds.length > 0) {
      // Agora busca os dados dos CT-es
      const { data: cteRecords } = await (supabase as any)
        .from('ctes_complete')
        .select('id, number, issue_date, status, total_value')
        .in('id', cteIds);

      if (cteRecords && cteRecords.length > 0) {
        for (const cte of cteRecords) {
          const cteDocId = `cte-${cte.id}`;
          
          if (!documents.some(d => d.id === cteDocId)) {
            documents.push({
              id: cteDocId,
              type: 'cte',
              number: cte.number,
              date: cte.issue_date || new Date().toISOString(),
              status: cte.status || 'Emitido',
              value: Number(cte.total_value || 0)
            });
          }
          // Fatura vem depois do CT-e
          relationships.push({ from: cteDocId, to: sourceDocument.id });
        }
      }

      if (cteIds.length > 0) {
        // Busca Invoices e Pedidos relacionados aos CT-es na tabela ctes_invoices
        const { data: cteInvoices } = await (supabase as any)
          .from('ctes_invoices')
          .select('cte_id, number, observations')
          .in('cte_id', cteIds);

        const accessKeys: string[] = [];
        const invoiceNumbers: string[] = [];
        const cteToKeyMap = new Map<string, string>();
        const cteToNumMap = new Map<string, string>();

        if (cteInvoices && cteInvoices.length > 0) {
          cteInvoices.forEach((cteInv: any) => {
            const matchKey = cteInv.observations?.match(/Chave:\s*([0-9]{44})/);
            if (matchKey && matchKey[1]) {
              accessKeys.push(matchKey[1]);
              cteToKeyMap.set(matchKey[1], cteInv.cte_id);
            } else if (cteInv.number) {
              invoiceNumbers.push(cteInv.number);
              cteToNumMap.set(cteInv.number, cteInv.cte_id);
            }
          });
        }

        const invoiceIdsFound: string[] = [];

        // Busca por chave
        if (accessKeys.length > 0) {
          const { data: nfesByKey } = await (supabase as any)
            .from('invoices_nfe')
            .select('id, numero, data_emissao, situacao, valor_total, order_number, chave_acesso')
            .in('chave_acesso', accessKeys);

          if (nfesByKey && nfesByKey.length > 0) {
            for (const nfe of nfesByKey) {
              const invId = `invoice-${nfe.id}`;
              invoiceIdsFound.push(nfe.id);

              if (!documents.some(d => d.id === invId)) {
                documents.push({
                  id: invId,
                  type: 'invoice',
                  number: nfe.numero,
                  date: nfe.data_emissao || new Date().toISOString(),
                  status: nfe.situacao || 'Emitida',
                  value: Number(nfe.valor_total || 0)
                });
              }

              const cteIdSource = cteToKeyMap.get(nfe.chave_acesso);
              if (cteIdSource) {
                if (!relationships.some(r => r.from === invId && r.to === `cte-${cteIdSource}`)) {
                  relationships.push({ from: invId, to: `cte-${cteIdSource}` });
                }
              }

              // Busca pedido
              if (nfe.order_number) {
                const { data: orderData } = await (supabase as any)
                  .from('orders')
                  .select('id, numero_pedido, data_pedido, status, valor_mercadoria')
                  .eq('numero_pedido', nfe.order_number)
                  .maybeSingle();

                if (orderData) {
                  const orderId = `order-${orderData.id}`;
                  if (!documents.some(d => d.id === orderId)) {
                    documents.push({
                      id: orderId,
                      type: 'order',
                      number: orderData.numero_pedido,
                      date: orderData.data_pedido || new Date().toISOString(),
                      status: orderData.status || 'Pendente',
                      value: Number(orderData.valor_mercadoria || 0)
                    });
                  }
                  relationships.push({ from: orderId, to: invId });
                }
              }
            }
          }
        }

        // Busca por numero da Invoice para as que não foram achadas
        if (invoiceNumbers.length > 0) {
          const nfesAchados = documents.map(d => d.number);
          const numerosBuscados = invoiceNumbers.filter(n => !nfesAchados.includes(n));
          
          if (numerosBuscados.length > 0) {
            const { data: nfesByNum } = await (supabase as any)
              .from('invoices_nfe')
              .select('id, numero, data_emissao, situacao, valor_total, order_number')
              .in('numero', numerosBuscados);

            if (nfesByNum && nfesByNum.length > 0) {
              for (const nfe of nfesByNum) {
                const invId = `invoice-${nfe.id}`;
                invoiceIdsFound.push(nfe.id);

                if (!documents.some(d => d.id === invId)) {
                  documents.push({
                    id: invId,
                    type: 'invoice',
                    number: nfe.numero,
                    date: nfe.data_emissao || new Date().toISOString(),
                    status: nfe.situacao || 'Emitida',
                    value: Number(nfe.valor_total || 0)
                  });
                }

                const cteIdSource = cteToNumMap.get(nfe.numero);
                if (cteIdSource) {
                  if (!relationships.some(r => r.from === invId && r.to === `cte-${cteIdSource}`)) {
                    relationships.push({ from: invId, to: `cte-${cteIdSource}` });
                  }
                }

                // Busca Pedido
                if (nfe.order_number) {
                  const { data: orderData } = await (supabase as any)
                    .from('orders')
                    .select('id, numero_pedido, data_pedido, status, valor_mercadoria')
                    .eq('numero_pedido', nfe.order_number)
                    .maybeSingle();

                  if (orderData) {
                    const orderId = `order-${orderData.id}`;
                    if (!documents.some(d => d.id === orderId)) {
                      documents.push({
                        id: orderId,
                        type: 'order',
                        number: orderData.numero_pedido,
                        date: orderData.data_pedido || new Date().toISOString(),
                        status: orderData.status || 'Pendente',
                        value: Number(orderData.valor_mercadoria || 0)
                      });
                    }
                    relationships.push({ from: orderId, to: invId });
                  }
                }
              }
            }
          }
        }

        // Fallback: CTE com invoice_id preenchido diretamente
        for (const cte of cteRecords) {
          if (cte.invoice_id) {
            const { data: nfe } = await (supabase as any)
              .from('invoices_nfe')
              .select('id, numero, data_emissao, situacao, valor_total, order_number')
              .eq('id', cte.invoice_id)
              .maybeSingle();

            if (nfe) {
              const invId = `invoice-${nfe.id}`;
              invoiceIdsFound.push(nfe.id);

              if (!documents.some(d => d.id === invId)) {
                documents.push({
                  id: invId,
                  type: 'invoice',
                  number: nfe.numero,
                  date: nfe.data_emissao || new Date().toISOString(),
                  status: nfe.situacao || 'Emitida',
                  value: Number(nfe.valor_total || 0)
                });
              }

              if (!relationships.some(r => r.from === invId && r.to === `cte-${cte.id}`)) {
                relationships.push({ from: invId, to: `cte-${cte.id}` });
              }

              // Busca pedido
              if (nfe.order_number) {
                const { data: orderData } = await (supabase as any)
                  .from('orders')
                  .select('id, numero_pedido, data_pedido, status, valor_mercadoria')
                  .eq('numero_pedido', nfe.order_number)
                  .maybeSingle();

                if (orderData) {
                  const orderId = `order-${orderData.id}`;
                  if (!documents.some(d => d.id === orderId)) {
                    documents.push({
                      id: orderId,
                      type: 'order',
                      number: orderData.numero_pedido,
                      date: orderData.data_pedido || new Date().toISOString(),
                      status: orderData.status || 'Pendente',
                      value: Number(orderData.valor_mercadoria || 0)
                    });
                  }
                  relationships.push({ from: orderId, to: invId });
                }
              }
            }
          }
        }

        // Busca coletas associadas às Invoices mapeadas
        if (invoiceIdsFound.length > 0) {
          const { data: pickupLinks } = await (supabase as any)
            .from('pickup_invoices')
            .select('invoice_id, pickup_id, pickups(numero_coleta, created_at, status, valor_total)')
            .in('invoice_id', invoiceIdsFound);

          if (pickupLinks && pickupLinks.length > 0) {
            for (const plink of pickupLinks) {
              if (plink.pickups) {
                const pickupDocId = `pickup-${plink.pickup_id}`;
                if (!documents.some(d => d.id === pickupDocId)) {
                  documents.push({
                    id: pickupDocId,
                    type: 'pickup',
                    number: plink.pickups.numero_coleta,
                    date: plink.pickups.created_at || new Date().toISOString(),
                    status: plink.pickups.status || 'Emitida',
                    value: Number(plink.pickups.valor_total || 0)
                  });
                }
                const invId = `invoice-${plink.invoice_id}`;
                if (!relationships.some(r => r.from === invId && r.to === pickupDocId)) {
                  relationships.push({ from: invId, to: pickupDocId });
                }
              }
            }
          }
        }
      }
    }
  }
  
  return { documents, relationships };
};

// Format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR');
};

// Format currency
const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
};

// Get document icon based on type
const getDocumentIcon = (type: DocumentType) => {
  switch (type) {
    case 'order':
      return <Package className="text-blue-600 dark:text-blue-400" />;
    case 'invoice':
      return <FileText className="text-green-600 dark:text-green-400" />;
    case 'pickup':
      return <PackageCheck className="text-cyan-600 dark:text-cyan-400" />;
    case 'cte':
      return <Truck className="text-orange-600 dark:text-orange-400" />;
    case 'bill':
      return <CreditCard className="text-purple-600 dark:text-purple-400" />;
  }
};

// Get document color based on type
const getDocumentColor = (type: DocumentType) => {
  switch (type) {
    case 'order':
      return { bg: 'bg-blue-50 dark:bg-blue-900/30', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-800 dark:text-blue-200' };
    case 'invoice':
      return { bg: 'bg-green-50 dark:bg-green-900/30', border: 'border-green-200 dark:border-green-800', text: 'text-green-800 dark:text-green-200' };
    case 'pickup':
      return { bg: 'bg-cyan-50 dark:bg-cyan-900/30', border: 'border-cyan-200 dark:border-cyan-800', text: 'text-cyan-800 dark:text-cyan-200' };
    case 'cte':
      return { bg: 'bg-orange-50 dark:bg-orange-900/30', border: 'border-orange-200 dark:border-orange-800', text: 'text-orange-800 dark:text-orange-200' };
    case 'bill':
      return { bg: 'bg-purple-50 dark:bg-purple-900/30', border: 'border-purple-200 dark:border-purple-800', text: 'text-purple-800 dark:text-purple-200' };
  }
};

// Get document type label
const getDocumentTypeLabel = (type: DocumentType, t: any) => {
  switch (type) {
    case 'order':
      return t('orders.relationshipMap.order');
    case 'invoice':
      return t('orders.relationshipMap.invoice');
    case 'pickup':
      return t('orders.relationshipMap.pickup');
    case 'cte':
      return t('orders.relationshipMap.cte');
    case 'bill':
      return t('orders.relationshipMap.bill');
  }
};

// Custom node component
import { useTranslation } from 'react-i18next';

const DocumentNode: React.FC<{
  data: {
    document: Document;
    onClick?: (document: Document) => void;
  };
}> = ({ data }) => {
  const { document, onClick } = data;
  const { t } = useTranslation();
  const colors = getDocumentColor(document.type);
  
  const displayStatus = document.status === 'processando' ? t('orders.relationshipMap.status.emitido', 'Emitido') : t('orders.relationshipMap.status.' + document.status.toLowerCase(), document.status.charAt(0).toUpperCase() + document.status.slice(1));
  
  return (
    <div 
      className={`p-3 rounded-lg shadow-md border ${colors.border} ${colors.bg} min-w-[12rem] cursor-pointer hover:shadow-lg transition-shadow bg-white/80 backdrop-blur-sm`}
      onClick={() => onClick && onClick(document)}
    >
      <Handle type="target" position={Position.Left} className="w-1.5 h-1.5 !bg-gray-400 rounded-full" />
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {getDocumentIcon(document.type)}
          <span className={`text-sm font-semibold ${colors.text}`}>{getDocumentTypeLabel(document.type, t)}</span>
        </div>
        {onClick && (
          <button 
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title={t('orders.relationshipMap.openDoc')}
          >
            <ExternalLink size={14} />
          </button>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-gray-900 dark:text-white font-medium">{document.number}</p>
        <div className="flex justify-between text-xs space-x-4">
          <span className="text-gray-500 dark:text-gray-400">{formatDate(document.date)}</span>
          <span className="font-medium text-gray-700 dark:text-gray-300">{formatCurrency(document.value)}</span>
        </div>
        <div className="mt-1">
          <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-white/50 border border-black/5 dark:bg-black/20 dark:border-white/10 text-gray-800 dark:text-gray-200">
            {displayStatus}
          </span>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="w-1.5 h-1.5 !bg-gray-400 rounded-full" />
    </div>
  );
};

// Node types
const nodeTypes = {
  documentNode: DocumentNode,
};

export const RelationshipMapModal: React.FC<RelationshipMapModalProps> = ({
  isOpen,
  onClose,
  sourceDocument,
  onDocumentClick
}) => {
  const { t } = useTranslation();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Create nodes and edges from documents and relationships
  useEffect(() => {
    if (!isOpen) return;
    
    setIsLoading(true);
    
    // Asynchronous call wrapper
    const loadMap = async () => {
      try {
        const { documents, relationships } = await getLiveRelatedDocuments(sourceDocument);
        
        // Create nodes
        const newNodes: Node[] = documents.map((doc, index) => {
          // Calculate position based on document type
          let position = { x: 0, y: 0 };
          
          // Position nodes in a logical flow: Order -> Invoice -> CTe -> Bill
          switch (doc.type) {
            case 'order':
              position = { x: 0, y: 100 * index };
              break;
            case 'invoice':
              position = { x: 300, y: 100 * index };
              break;
            case 'pickup':
              position = { x: 450, y: 100 * index };
              break;
            case 'cte':
              position = { x: 600, y: 100 * index };
              break;
            case 'bill':
              position = { x: 900, y: 100 * index };
              break;
          }
          
          return {
            id: doc.id,
            type: 'documentNode',
            position,
            data: { 
              document: doc,
              onClick: onDocumentClick
            },
            sourcePosition: Position.Right,
            targetPosition: Position.Left,
          };
        });
        
        // Create edges
        const newEdges: Edge[] = relationships.map((rel, index) => ({
          id: `e${index}`,
          source: rel.from,
          target: rel.to,
          animated: true,
          style: { stroke: '#64748b' },
        }));
        
        setNodes(newNodes);
        setEdges(newEdges);
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };
    
    loadMap();
  }, [isOpen, sourceDocument, onDocumentClick]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-6xl h-[80vh] flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <FileText size={24} className="text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('orders.relationshipMap.title')}</h2>
              <p className="text-gray-600 dark:text-gray-400">
                {getDocumentTypeLabel(sourceDocument.type, t)} {sourceDocument.number}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4 flex-1 flex flex-col min-h-0">
          <h2 className="text-xl font-semibold mb-4 shrink-0">{t('orders.relationshipMap.subtitle')}</h2>
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center border rounded-lg bg-gray-50 dark:bg-gray-900">
              <div className="flex flex-col items-center">
                <RefreshCw size={40} className="text-blue-500 animate-spin mb-4" />
                <p className="text-gray-600 dark:text-gray-400">{t('orders.relationshipMap.loading')}</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 min-h-0 border rounded-lg bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 overflow-hidden">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                attributionPosition="bottom-right"
                className="w-full h-full"
              >
                <Background />
                <Controls />
                <MiniMap 
                  nodeStrokeWidth={3}
                  zoomable 
                  pannable
                  className="bg-white dark:bg-gray-800"
                />
              </ReactFlow>
            </div>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 shrink-0">{t('orders.relationshipMap.footer')}</p>
        </div>
      </div>
    </div>
  );
};