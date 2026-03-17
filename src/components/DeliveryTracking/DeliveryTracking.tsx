import React, { useState } from 'react';
import Breadcrumbs from '../Layout/Breadcrumbs';
import { Search, Package, FileText, Truck, Calendar, CheckCircle, Clock, Box, XCircle } from 'lucide-react';
import { ordersService, Order } from '../../services/ordersService';
import { nfeService } from '../../services/nfeService';
import { ctesService } from '../../services/ctesService';
import { supabase } from '../../lib/supabase';

type DocumentType = 'order' | 'nfe' | 'cte';
type SearchType = 'number' | 'accessKey';

interface TimelineStep {
  order: number;
  title: string;
  description: string;
  icon: React.ElementType;
  status: 'completed' | 'current' | 'pending';
  date?: string;
  details?: string;
  imageUrl?: string;
}

interface OrderTrackingData {
  order: any;
  invoice?: any;
  pickup?: any;
  cte?: any;
  occurrences?: any[];
}

export const DeliveryTracking: React.FC = () => {
  const breadcrumbItems = [
    { label: 'Área de trabalho' },
    { label: 'Rastreamento de Entregas', current: true }
  ];

  const [documentType, setDocumentType] = useState<DocumentType>('order');
  const [searchType, setSearchType] = useState<SearchType>('number');
  const [searchValue, setSearchValue] = useState('');
  const [trackingData, setTrackingData] = useState<OrderTrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getDocumentTypeLabel = (type: DocumentType): string => {
    const labels = {
      order: 'Pedido',
      nfe: 'Nota Fiscal (NF-e)',
      cte: 'Conhecimento de Transporte (CT-e)'
    };
    return labels[type];
  };

  const getSearchPlaceholder = (): string => {
    if (searchType === 'number') {
      const placeholders = {
        order: 'Digite o número do pedido (ex: PED-001001)',
        nfe: 'Digite o número da NF-e (ex: 25)',
        cte: 'Digite o número do CT-e (ex: 67890)'
      };
      return placeholders[documentType];
    } else {
      const placeholders = {
        order: 'Digite o código de rastreamento',
        nfe: 'Digite a chave de acesso da NF-e (44 dígitos)',
        cte: 'Digite a chave de acesso do CT-e (44 dígitos)'
      };
      return placeholders[documentType];
    }
  };

  const buildTimeline = (data: OrderTrackingData): TimelineStep[] => {
    const steps: TimelineStep[] = [];

    // Etapa 1: Pedido Realizado (sempre ativo se pedido existe)
    steps.push({
      order: 1,
      title: 'Pedido Realizado',
      description: 'Pedido foi criado no sistema',
      icon: Package,
      status: 'completed',
      date: data.order?.created_at ? new Date(data.order.created_at).toLocaleString('pt-BR') : '-',
      details: `Pedido Nº ${data.order?.order_number || ''}`
    });

    // Etapa 2: Pedido Faturado (ativo se tem NF-e vinculada)
    const hasInvoice = !!data.invoice;
    steps.push({
      order: 2,
      title: 'Pedido Faturado',
      description: hasInvoice ? 'Nota fiscal emitida e vinculada ao pedido' : 'Aguardando emissão da nota fiscal',
      icon: FileText,
      status: hasInvoice ? 'completed' : 'pending',
      date: hasInvoice && data.invoice?.issue_date ? new Date(data.invoice.issue_date).toLocaleString('pt-BR') : undefined,
      details: hasInvoice ? `NF-e Nº ${data.invoice?.number || ''} - Série ${data.invoice?.series || ''}` : undefined
    });

    // Etapa 3: Aguardando Coleta (ativo se tem coleta vinculada)
    const hasPickup = !!data.pickup;
    steps.push({
      order: 3,
      title: 'Aguardando Coleta',
      description: hasPickup ? 'Coleta agendada com a transportadora' : 'Aguardando agendamento de coleta',
      icon: Clock,
      status: hasPickup ? 'completed' : 'pending',
      date: hasPickup && data.pickup?.created_at ? new Date(data.pickup.created_at).toLocaleString('pt-BR') : undefined,
      details: hasPickup ? `Coleta Nº ${data.pickup?.pickup_number || ''} - Status: ${data.pickup?.status || ''}` : undefined
    });

    // Etapa 4: Coletado pela Transportadora (ativo se coleta status = REALIZADA)
    const isPickupCompleted = data.pickup?.status?.toUpperCase() === 'REALIZADA';
    steps.push({
      order: 4,
      title: 'Coletado pela Transportadora',
      description: isPickupCompleted ? 'Mercadoria coletada pela transportadora' : 'Aguardando coleta pela transportadora',
      icon: Box,
      status: isPickupCompleted ? 'completed' : 'pending',
      date: isPickupCompleted && data.pickup?.updated_at ? new Date(data.pickup.updated_at).toLocaleString('pt-BR') : undefined,
      details: isPickupCompleted ? `Transportadora: ${data.order?.carrier_name || 'N/A'}` : undefined
    });

    // Etapa 5: Em Transporte (ativo se tem CT-e vinculado)
    const hasCte = !!data.cte;
    steps.push({
      order: 5,
      title: 'Em Transporte',
      description: hasCte ? 'Mercadoria em trânsito' : 'Aguardando início do transporte',
      icon: Truck,
      status: hasCte ? 'completed' : 'pending',
      date: hasCte && data.cte?.issue_date ? new Date(data.cte.issue_date).toLocaleString('pt-BR') : undefined,
      details: hasCte ? `CT-e Nº ${data.cte?.number || data.cte?.cte_number || ''} - Série ${data.cte?.series || data.cte?.cte_series || ''}` : undefined
    });

    // Etapa 6: Saiu para Entrega (ativo se tem ocorrência EDI código 100)
    const hasOutForDelivery = data.occurrences?.some(occ => occ.codigo === '100');
    const outForDeliveryOcc = data.occurrences?.find(occ => occ.codigo === '100');
    steps.push({
      order: 6,
      title: 'Saiu para Entrega',
      description: hasOutForDelivery ? 'Mercadoria em rota de entrega' : 'Aguardando saída para entrega',
      icon: Truck,
      status: hasOutForDelivery ? 'completed' : 'pending',
      date: hasOutForDelivery && (outForDeliveryOcc?.data_ocorrencia || outForDeliveryOcc?.created_at) ? new Date(outForDeliveryOcc.data_ocorrencia || outForDeliveryOcc.created_at).toLocaleString('pt-BR') : undefined,
      details: hasOutForDelivery ? 'Ocorrência: 100 - Em rota de entrega' : undefined
    });

    // Etapa 7: Entrega Realizada (ativo se tem ocorrência EDI código 001 ou 002)
    const isDelivered = data.occurrences?.some(occ => occ.codigo === '001' || occ.codigo === '002');
    const deliveryOcc = data.occurrences?.find(occ => occ.codigo === '001' || occ.codigo === '002');
    steps.push({
      order: 7,
      title: 'Entrega Realizada',
      description: isDelivered ? 'Mercadoria entregue ao destinatário' : 'Aguardando confirmação de entrega',
      icon: CheckCircle,
      status: isDelivered ? 'completed' : 'pending',
      date: isDelivered && (deliveryOcc?.data_ocorrencia || deliveryOcc?.created_at) ? new Date(deliveryOcc.data_ocorrencia || deliveryOcc.created_at).toLocaleString('pt-BR') : undefined,
      details: isDelivered ? `Ocorrência: ${deliveryOcc?.codigo} - ${deliveryOcc?.descricao || 'Entrega realizada'}` : undefined,
      imageUrl: isDelivered ? deliveryOcc?.foto_url : undefined
    });

    // NOVA LÓGICA: Determinar a etapa mais avançada concluída e marcar todas anteriores como concluídas
    let highestCompletedStep = 0;
    steps.forEach(step => {
      if (step.status === 'completed' && step.order > highestCompletedStep) {
        highestCompletedStep = step.order;
      }
    });

    // Marcar todas as etapas anteriores à mais avançada como concluídas
    const updatedSteps = steps.map(step => {
      if (step.order < highestCompletedStep && step.status === 'pending') {
        return {
          ...step,
          status: 'completed' as const,
          description: step.description.includes('Aguardando')
            ? step.description.replace('Aguardando', 'Etapa concluída -')
            : step.description
        };
      }
      return step;
    });

    // Ordenar em ordem decrescente (mais recente primeiro)
    return updatedSteps.reverse();
  };

  const fetchOrderTrackingData = async (orderNumber: string): Promise<OrderTrackingData | null> => {
    try {
      // Buscar pedido
      const orders = await ordersService.getAll();
      const order = orders.find(o =>
        o.order_number.toLowerCase().includes(orderNumber.toLowerCase())
      );

      if (!order) return null;

      // Buscar NF-e vinculada ao pedido
      const { data: invoices } = await (supabase as any)
        .from('invoices_nfe')
        .select('*')
        .eq('order_number', order.order_number)
        .maybeSingle();

      // Buscar coleta vinculada à NF-e (se existir)
      let pickup = null;
      if (invoices) {
        const { data: pickupInvoices } = await (supabase as any)
          .from('pickups_invoices')
          .select('pickup_id')
          .eq('invoice_id', invoices.id)
          .maybeSingle();

        if (pickupInvoices) {
          const { data: pickupData } = await (supabase as any)
            .from('pickups')
            .select('*')
            .eq('id', pickupInvoices.pickup_id)
            .maybeSingle();

          pickup = pickupData;
        }
      }

      // Buscar CT-e vinculado à NF-e (se existir)
      let cte = null;
      if (invoices) {
        const { data: cteData } = await (supabase as any)
          .from('ctes_complete')
          .select('*')
          .eq('invoice_number', invoices.number)
          .maybeSingle();

        cte = cteData;
      }

      // Buscar ocorrências do banco
      let occurrences: any[] = [];
      if (invoices?.metadata?.occurrences) {
        occurrences = invoices.metadata.occurrences;
      } else if ((order as any).metadata?.occurrences) {
        occurrences = (order as any).metadata.occurrences;
      } else if (order.status === 'delivered' || (order as any).status === 'entregue') {
        occurrences = [
          { codigo: '100', descricao: 'Em rota de entrega', created_at: order.updated_at },
          { codigo: '001', descricao: 'Entrega realizada', created_at: order.updated_at }
        ];
      } else if (order.status === 'in_transit' || (order as any).status === 'em_transito') {
        occurrences = [
          { codigo: '100', descricao: 'Em rota de entrega', created_at: order.updated_at }
        ];
      }

      return {
        order,
        invoice: invoices,
        pickup,
        cte,
        occurrences
      };
    } catch (error) {
      console.error('Erro ao buscar dados de rastreamento:', error);
      return null;
    }
  };

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      setError('Por favor, digite um valor para buscar');
      return;
    }

    setIsLoading(true);
    setError(null);
    setTrackingData(null);

    try {
      if (documentType === 'order') {
        const data = await fetchOrderTrackingData(searchValue);

        if (data) {
          setTrackingData(data);
        } else {
          setError(`Pedido não encontrado: ${searchValue}`);
        }
      } else if (documentType === 'nfe') {
        // Buscar NF-e e depois o pedido relacionado
        const invoices = await nfeService.getAll();
        let found;

        if (searchType === 'number') {
          found = invoices.find((inv: any) => inv.number === searchValue);
        } else {
          found = invoices.find((inv: any) => inv.access_key === searchValue);
        }

        if (found && (found as any).order_number) {
          const data = await fetchOrderTrackingData((found as any).order_number);
          if (data) {
            setTrackingData(data);
          } else {
            setError('Pedido vinculado à NF-e não encontrado');
          }
        } else {
          setError(`NF-e não encontrada ou não possui pedido vinculado: ${searchValue}`);
        }
      } else if (documentType === 'cte') {
        // Buscar CT-e, depois NF-e e depois pedido
        const ctes = await ctesService.getAll();
        let found;

        if (searchType === 'number') {
          found = ctes.find((cte) => cte.cte_number === searchValue);
        } else {
          found = ctes.find((cte) => cte.access_key === searchValue);
        }

        if (found && found.invoice_number) {
          // Buscar NF-e
          const { data: invoice } = await (supabase as any)
            .from('invoices_nfe')
            .select('order_number')
            .eq('number', found.invoice_number)
            .maybeSingle();

          if (invoice && invoice.order_number) {
            const data = await fetchOrderTrackingData(invoice.order_number);
            if (data) {
              setTrackingData(data);
            } else {
              setError('Pedido vinculado ao CT-e não encontrado');
            }
          } else {
            setError('NF-e vinculada ao CT-e não possui pedido relacionado');
          }
        } else {
          setError(`CT-e não encontrado ou não possui NF-e vinculada: ${searchValue}`);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar:', err);
      setError('Erro ao realizar a busca. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderTimeline = (data: OrderTrackingData) => {
    const timeline = buildTimeline(data);

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3 mb-4">
            <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Informações do Pedido</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Número do Pedido</p>
              <p className="font-semibold text-gray-900 dark:text-white">{data.order?.order_number}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Cliente</p>
              <p className="font-semibold text-gray-900 dark:text-white">{data.order?.customer_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Transportadora</p>
              <p className="font-semibold text-gray-900 dark:text-white">{data.order?.carrier_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Data de Criação</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {data.order?.created_at ? new Date(data.order.created_at).toLocaleDateString('pt-BR') : '-'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Timeline de Entregas</h3>
          </div>

          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-green-500 via-blue-500 to-gray-300"></div>

            <div className="space-y-6 relative">
              {timeline.map((step, index) => (
                <TimelineItem
                  key={step.order}
                  icon={step.icon}
                  title={step.title}
                  description={step.description}
                  date={step.date}
                  details={step.details}
                  status={step.status}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Resumo de documentos vinculados */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg border-2 ${data.invoice ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800'}`}>
            <div className="flex items-center gap-2 mb-2">
              <FileText className={`w-5 h-5 ${data.invoice ? 'text-green-600' : 'text-gray-400'}`} />
              <span className="font-semibold text-gray-900 dark:text-white">Nota Fiscal</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {data.invoice ? `NF-e Nº ${data.invoice.number}` : 'Não vinculada'}
            </p>
          </div>

          <div className={`p-4 rounded-lg border-2 ${data.pickup ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Box className={`w-5 h-5 ${data.pickup ? 'text-green-600' : 'text-gray-400'}`} />
              <span className="font-semibold text-gray-900 dark:text-white">Coleta</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {data.pickup ? `Coleta Nº ${data.pickup.pickup_number}` : 'Não vinculada'}
            </p>
          </div>

          <div className={`p-4 rounded-lg border-2 ${data.cte ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Truck className={`w-5 h-5 ${data.cte ? 'text-green-600' : 'text-gray-400'}`} />
              <span className="font-semibold text-gray-900 dark:text-white">CT-e</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {data.cte ? `CT-e Nº ${data.cte.cte_number}` : 'Não vinculado'}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <Breadcrumbs items={breadcrumbItems} />

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Rastreamento de Entregas
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Busque pedidos, notas fiscais ou conhecimentos de transporte para acompanhar o status de entrega
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Selecione o tipo de documento que deseja rastrear
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => {
                  setDocumentType('order');
                  setSearchType('number');
                  setSearchValue('');
                  setTrackingData(null);
                  setError(null);
                }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  documentType === 'order'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <Package className={`w-8 h-8 ${documentType === 'order' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className={`font-semibold ${documentType === 'order' ? 'text-blue-900 dark:text-blue-100' : 'text-gray-700 dark:text-gray-300'}`}>
                    Pedido
                  </span>
                </div>
              </button>

              <button
                onClick={() => {
                  setDocumentType('nfe');
                  setSearchType('number');
                  setSearchValue('');
                  setTrackingData(null);
                  setError(null);
                }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  documentType === 'nfe'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <FileText className={`w-8 h-8 ${documentType === 'nfe' ? 'text-green-600' : 'text-gray-400'}`} />
                  <span className={`font-semibold ${documentType === 'nfe' ? 'text-green-900 dark:text-green-100' : 'text-gray-700 dark:text-gray-300'}`}>
                    Nota Fiscal (NF-e)
                  </span>
                </div>
              </button>

              <button
                onClick={() => {
                  setDocumentType('cte');
                  setSearchType('number');
                  setSearchValue('');
                  setTrackingData(null);
                  setError(null);
                }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  documentType === 'cte'
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <Truck className={`w-8 h-8 ${documentType === 'cte' ? 'text-amber-600' : 'text-gray-400'}`} />
                  <span className={`font-semibold ${documentType === 'cte' ? 'text-amber-900 dark:text-amber-100' : 'text-gray-700 dark:text-gray-300'}`}>
                    CT-e
                  </span>
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Como deseja buscar o {getDocumentTypeLabel(documentType)}?
            </label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="searchType"
                  value="number"
                  checked={searchType === 'number'}
                  onChange={(e) => {
                    setSearchType(e.target.value as SearchType);
                    setSearchValue('');
                    setTrackingData(null);
                    setError(null);
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  {documentType === 'order' ? 'Buscar por Número do Pedido' : 'Buscar por Número'}
                </span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="searchType"
                  value="accessKey"
                  checked={searchType === 'accessKey'}
                  onChange={(e) => {
                    setSearchType(e.target.value as SearchType);
                    setSearchValue('');
                    setTrackingData(null);
                    setError(null);
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  {documentType === 'order' ? 'Buscar por Código de Rastreamento' : 'Buscar por Chave de Acesso'}
                </span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Digite o valor para busca
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                placeholder={getSearchPlaceholder()}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <button
                onClick={handleSearch}
                disabled={isLoading || !searchValue.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                {isLoading ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          {trackingData && (
            <div className="mt-6">
              {renderTimeline(trackingData)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface TimelineItemProps {
  icon: React.ElementType;
  title: string;
  description: string;
  date?: string;
  details?: string;
  imageUrl?: string;
  status: 'completed' | 'current' | 'pending';
}

const TimelineItem: React.FC<TimelineItemProps> = ({ icon: Icon, title, description, date, details, status, imageUrl }) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'current':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 ring-4 ring-blue-100 dark:ring-blue-900/50';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-600';
    }
  };

  return (
    <div className="flex gap-4 relative">
      <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 z-10 ${getStatusStyles()}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 pb-8">
        <h4 className="font-semibold text-gray-900 dark:text-white">{title}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</p>
        {details && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">{details}</p>
        )}
        {imageUrl && (
          <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:opacity-90 transition-opacity">
            <img src={imageUrl} alt="Comprovante de entrega" className="h-24 object-contain bg-white dark:bg-gray-800" />
          </a>
        )}
        {date && (
          <div className="flex items-center gap-2 mt-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-500 dark:text-gray-500 dark:text-gray-400">{date}</span>
          </div>
        )}
      </div>
    </div>
  );
};
