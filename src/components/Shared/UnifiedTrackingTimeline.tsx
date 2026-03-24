import React, { useEffect, useState } from 'react';
import { Package, FileText, Clock, Box, Truck, CheckCircle, Loader, AlertTriangle } from 'lucide-react';
import { trackingService, OrderTrackingData } from '../../services/trackingService';
import { nfeService } from '../../services/nfeService';
import { ctesCompleteService } from '../../services/ctesCompleteService';

interface UnifiedTrackingTimelineProps {
  trackingData?: OrderTrackingData | null;
  documentType?: 'order' | 'nfe' | 'cte';
  documentValue?: string;
  documentObj?: any;
}

interface TimelineStep {
  id: string;
  isFixed: boolean;
  sequence: number; // 1 to 7 for fixed steps
  title: string;
  description: string;
  icon: React.ElementType;
  status: 'completed' | 'current' | 'pending';
  date?: Date;
  details?: string;
  isOccurrence?: boolean;
}

export const UnifiedTrackingTimeline: React.FC<UnifiedTrackingTimelineProps> = ({
  trackingData: initialData,
  documentType,
  documentValue,
  documentObj
}) => {
  const [data, setData] = useState<OrderTrackingData | null>(initialData || null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setData(initialData);
      setIsLoading(false);
      return;
    }

    if (documentType && documentValue) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, documentType, documentValue]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let result = null;
      if (documentType === 'order') {
        result = await trackingService.fetchOrderTrackingData(documentValue as string, false);
      } else if (documentType === 'nfe') {
        if (documentObj) {
           result = await trackingService.fetchTrackingDataFromDocument('nfe', documentObj);
        } else {
           const nfeList = await nfeService.getAll();
           const found = nfeList.find((n: any) => n.numero === documentValue || n.number === documentValue);
           result = await trackingService.fetchTrackingDataFromDocument('nfe', found || { numero: documentValue });
        }
      } else if (documentType === 'cte') {
        if (documentObj) {
           result = await trackingService.fetchTrackingDataFromDocument('cte', documentObj);
        } else {
           const cteList = await ctesCompleteService.getAll();
           const found = cteList.find((c: any) => c.numero === documentValue || c.cte_number === documentValue || c.number === documentValue);
           result = await trackingService.fetchTrackingDataFromDocument('cte', found || { numero: documentValue });
        }
      }
      
      if (result) {
        setData(result);
      } else {
        setError('Não foi possível carregar o rastreamento.');
      }
    } catch {
      setError('Erro ao processar rastreamento.');
    } finally {
      setIsLoading(false);
    }
  };

  const buildTimeline = (): TimelineStep[] => {
    if (!data) return [];

    const fixedSteps: TimelineStep[] = [];
    const occurrencesSteps: TimelineStep[] = [];

    // 1. Pedido confirmado
    const hasOrder = !!data.order;
    const orderDate = data.order?.created_at ? new Date(data.order.created_at) : (data.invoice?.dataEmissao || data.invoice?.issue_date ? new Date(data.invoice?.dataEmissao || data.invoice?.issue_date) : undefined);
    fixedSteps.push({
      id: 'step_1',
      isFixed: true,
      sequence: 1,
      title: 'Pedido confirmado',
      description: hasOrder ? 'Pedido recebido e confirmado' : (orderDate ? 'Pedido confirmado via NF-e' : 'Aguardando confirmação do pedido'),
      icon: Package,
      status: (hasOrder || orderDate) ? 'completed' : 'pending',
      date: orderDate
    });

    // 2. Pedido faturado
    const hasInvoice = !!data.invoice;
    const invoiceDate = data.invoice?.dataEmissao || data.invoice?.issue_date || data.invoice?.created_at ? new Date(data.invoice?.dataEmissao || data.invoice?.issue_date || data.invoice?.created_at) : undefined;
    fixedSteps.push({
      id: 'step_2',
      isFixed: true,
      sequence: 2,
      title: 'Pedido faturado',
      description: hasInvoice ? 'Nota fiscal emitida' : 'Aguardando faturamento',
      icon: FileText,
      status: hasInvoice ? 'completed' : 'pending',
      date: invoiceDate,
      details: hasInvoice ? `NF-e Nº ${data.invoice?.numero || data.invoice?.number || ''}` : undefined
    });

    // 3. Aguardando coleta
    const hasPickup = !!data.pickup || hasInvoice;
    const pickupReqDate = data.pickup?.created_at ? new Date(data.pickup.created_at) : invoiceDate;
    fixedSteps.push({
      id: 'step_3',
      isFixed: true,
      sequence: 3,
      title: 'Aguardando coleta',
      description: hasPickup ? 'Veículo ou transportadora acionada' : 'Aguardando disponibilidade',
      icon: Clock,
      status: hasPickup ? 'completed' : 'pending',
      date: pickupReqDate
    });

    // 4. Coletado pela transportadora
    const isCollected = data.pickup?.status?.toUpperCase() === 'REALIZADA' || data.occurrences?.some(o => o.codigo === '098' || o.codigo?.includes('COLETA'));
    const pickupDoneDate = isCollected && data.pickup?.updated_at ? new Date(data.pickup.updated_at) : undefined;
    fixedSteps.push({
      id: 'step_4',
      isFixed: true,
      sequence: 4,
      title: 'Coletado pela transportadora',
      description: isCollected ? 'Mercadoria em posse da transportadora' : 'Aguardando coleta física',
      icon: Box,
      status: isCollected || !!data.cte ? 'completed' : 'pending',
      date: pickupDoneDate || (data.cte?.issue_date ? new Date(data.cte.issue_date) : undefined)
    });

    // 5. Em transporte
    const hasCte = !!data.cte || data.occurrences?.some(o => ['em_transito', '004', '005'].includes(o.codigo));
    const cteDate = data.cte?.issue_date ? new Date(data.cte.issue_date) : undefined;
    fixedSteps.push({
      id: 'step_5',
      isFixed: true,
      sequence: 5,
      title: 'Em transporte',
      description: hasCte ? 'Mercadoria em trânsito para o destino' : 'Aguardando roteirização',
      icon: Truck,
      status: hasCte ? 'completed' : 'pending',
      date: cteDate,
      details: data.cte ? `CT-e Nº ${data.cte?.numero || data.cte?.cte_number || data.cte?.number || ''}` : undefined
    });

    // 6. Saiu para entrega
    const outForDeliveryOcc = data.occurrences?.find(o => 
      o.codigo === '100' || 
      (o.descricao && (o.descricao.toLowerCase().includes('saiu para entrega') || o.descricao.toLowerCase().includes('em rota de entrega') || o.descricao.toLowerCase().includes('saiu p/ entrega')))
    );
    
    
    const outStatuses = ['saiu_entrega', 'saiu p/ entrega', 'saiu_para_entrega', 'out_for_delivery'];
    const hasOutStatus = outStatuses.includes(data.order?.status?.toLowerCase() || '') ||
                         outStatuses.includes(data.invoice?.status?.toLowerCase() || '') ||
                         outStatuses.includes(data.cte?.status?.toLowerCase() || '');
                         
    const hasOut = !!outForDeliveryOcc || hasOutStatus;
    
    let outDate = undefined;
    if (outForDeliveryOcc) {
      outDate = new Date(outForDeliveryOcc.data_ocorrencia || outForDeliveryOcc.created_at);
    } else if (hasOutStatus) {
      const d = data.cte?.updated_at || data.invoice?.updated_at || data.order?.updated_at;
      if (d) outDate = new Date(d);
    }

    fixedSteps.push({
      id: 'step_6',
      isFixed: true,
      sequence: 6,
      title: 'Saiu para entrega',
      description: hasOut ? 'Motorista em rota de entrega' : 'Aguardando chegada na ponta final',
      icon: Truck,
      status: hasOut ? 'completed' : 'pending',
      date: outDate
    });

    // 7. Entrega realizada
    const deliveryOcc = data.occurrences?.find(o => o.codigo === '001' || o.codigo === '002');
    const isDelivered = !!deliveryOcc || data.invoice?.status === 'entregue' || data.order?.status === 'entregue';
    fixedSteps.push({
      id: 'step_7',
      isFixed: true,
      sequence: 7,
      title: 'Entrega realizada',
      description: isDelivered ? 'Mercadoria entregue ao destinatário' : 'Aguardando finalização',
      icon: CheckCircle,
      status: isDelivered ? 'completed' : 'pending',
      date: deliveryOcc ? new Date(deliveryOcc.data_ocorrencia || deliveryOcc.created_at) : undefined,
      details: deliveryOcc ? `[${deliveryOcc.codigo}] ${deliveryOcc.descricao}` : undefined
    });

    // Extracção de ocorrências como passos dinâmicos (ignorando as que já foram mapeadas diretamente nos fixos se necessário, mas para ser seguro exibimos todas como detalhes extras no meio)
    if (data.occurrences && data.occurrences.length > 0) {
      data.occurrences.forEach((occ, idx) => {
        // Pula ocorrências de "saiu para entrega" ou "entregue" pois elas já fecham os status 6 e 7 puramente
        if (occ.codigo === '100' || occ.codigo === '001' || occ.codigo === '002') return;

        occurrencesSteps.push({
          id: `occ_${idx}`,
          isFixed: false,
          sequence: 99, // Float in time
          title: `Ocorrência [${occ.codigo}]`,
          description: occ.descricao || occ.nome || 'Atualização de tracking',
          icon: AlertTriangle,
          status: 'completed',
          date: new Date(occ.data_ocorrencia || occ.created_at),
          isOccurrence: true
        });
      });
    }

    // Retro-feed: se um status da frente está completed, obrigatoriamente completa os de trás
    let highestCompletedSequence = 0;
    fixedSteps.forEach(s => {
      if (s.status === 'completed' && s.sequence > highestCompletedSequence) {
        highestCompletedSequence = s.sequence;
      }
    });

    fixedSteps.forEach(p => {
      if (p.sequence < highestCompletedSequence && p.status !== 'completed') {
        p.status = 'completed';
      }
    });

    const timelineItems: TimelineStep[] = [...fixedSteps];

    // Ordenar ocorrências cronologicamente antes de injetar
    occurrencesSteps.sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0));

    // Injetar occurrencesSteps na posição cronológica correta
    occurrencesSteps.forEach(occ => {
      let insertIndex = -1;
      for (let i = 0; i < timelineItems.length; i++) {
        const step = timelineItems[i];
        if (step.date && occ.date && step.date.getTime() > occ.date.getTime()) {
          insertIndex = i;
          break;
        }
      }

      if (insertIndex !== -1) {
        timelineItems.splice(insertIndex, 0, occ);
      } else {
        // Se não achou nenhum com data maior, insere após o último completed
        const lastCompletedIdx = timelineItems.map(s => s.status).lastIndexOf('completed');
        if (lastCompletedIdx !== -1) {
          timelineItems.splice(lastCompletedIdx + 1, 0, occ);
        } else {
          timelineItems.push(occ);
        }
      }
    });

    // A ordem final sempre será crescente (1º ao 7º), de cima para baixo.
    return timelineItems;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg">
        <p>{error || 'Nenhum dado de rastreamento encontrado.'}</p>
      </div>
    );
  }

  const timeline = buildTimeline();

  // Active step é o ÚLTIMO passo concluído na lista (pois a ordem é crescente de 1 a 7 de cima p/ baixo)
  const activeIndex = timeline.map(s => s.status).lastIndexOf('completed');

  return (
    <div className="relative">
      <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
      
      <div className="space-y-6">
        {timeline.map((step, index) => {
          const isActive = index === activeIndex;
          const isCompleted = step.status === 'completed';
          const Icon = step.icon;

          return (
            <div key={step.id} className="relative flex items-start space-x-4 group">
              {/* Dot */}
              <div className={`
                relative z-10 w-12 h-12 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-800 shadow-sm transition-colors
                ${isActive
                  ? 'bg-blue-600 text-white'
                  : isCompleted
                    ? (step.isOccurrence ? 'bg-orange-500 text-white' : 'bg-green-600 text-white')
                    : 'bg-gray-200 text-gray-400 dark:bg-gray-700'
                }
              `}>
                <Icon size={20} />
              </div>

              {/* Content box */}
              <div className="flex-1 min-w-0">
                <div className={`
                  p-4 rounded-lg border-2 transition-all
                  ${isActive
                    ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                    : isCompleted
                      ? (step.isOccurrence ? 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20' : 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20')
                      : 'border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'
                  }
                `}>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className={`
                        font-semibold text-lg
                        ${isActive
                          ? 'text-blue-900 dark:text-blue-100'
                          : isCompleted
                            ? (step.isOccurrence ? 'text-orange-900 dark:text-orange-100' : 'text-green-900 dark:text-green-100')
                            : 'text-gray-500 dark:text-gray-400'
                        }
                      `}>
                        {step.title}
                      </h4>
                      <p className={`text-sm mt-1 ${isCompleted ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}`}>
                        {step.description}
                      </p>
                    </div>
                    {step.date && (
                      <div className="text-right whitespace-nowrap">
                        <span className={`text-sm px-2 py-1 rounded-md font-medium ${isCompleted ? 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 shadow-sm' : 'text-gray-400'}`}>
                          {step.date.toLocaleDateString('pt-BR')} {step.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}
                  </div>
                  {step.details && (
                    <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/5">
                      <p className="text-xs font-mono text-gray-500 dark:text-gray-400">{step.details}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
