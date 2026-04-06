import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, FileText, CheckCircle, XCircle, AlertCircle, Truck, Upload, Bug, RefreshCw } from 'lucide-react';
import { InvoicesFilters } from './InvoicesFilters';
import { InvoicesTable } from './InvoicesTable';
import { InvoicesActions } from './InvoicesActions';
import { InvoiceDetailsModal } from './InvoiceDetailsModal';
import { InvoiceCTesModal } from './InvoiceCTesModal';
import { InvoiceForm } from './InvoiceForm';
import { SchedulePickupModal } from './SchedulePickupModal';
import { CreatePickupModal } from './CreatePickupModal';
import { BulkXmlUploadModal } from './BulkXmlUploadModal';
import { OccurrenceInvoiceModal } from './OccurrenceInvoiceModal';
import { getDanfeHtml } from '../../utils/danfeGenerator';
import { generateNfeXml } from '../../utils/xmlGenerator';
import Breadcrumbs from '../Layout/Breadcrumbs';
import { AutoDownloadStatus } from '../common/AutoDownloadStatus';
import { AutoImportDebugModal } from '../common/AutoImportDebugModal';
import { establishmentsService } from '../../services/establishmentsService';
import { nfeService, NFeWithCustomer } from '../../services/nfeService';
import { useAuth } from '../../hooks/useAuth';
import { freightQuoteService } from '../../services/freightQuoteService';
import { invoicesCostService } from '../../services/invoicesCostService';
import { sapIntegrationService } from '../../services/sapService';
import { implementationService } from '../../services/implementationService';
import { supabase } from '../../lib/supabase';
import { Toast, ToastType } from '../common/Toast';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useActivityLogger } from '../../hooks/useActivityLogger';

const convertNFeToInvoiceFormat = (nfe: NFeWithCustomer) => ({
  id: nfe.id,
  status: nfe.status || 'emitida',
  serie: nfe.series,
  numero: nfe.number,
  dataEmissao: nfe.issue_date,
  dataEntrada: nfe.created_at,
  previsaoEntrega: (nfe as any).expected_delivery_date || (nfe as any).data_prevista_entrega || null,
  transportador: nfe.carrier
    ? `${nfe.carrier.codigo} - ${nfe.carrier.razao_social}`
    : '',
  valorNFe: parseFloat(nfe.total_value.toString()),
  valorCusto: Array.isArray(nfe.freight_results) && nfe.freight_results.length > 0
    ? parseFloat(nfe.freight_results[0].totalValue.toString())
    : 0,
  cliente: nfe.customer?.razao_social || 'Cliente não especificado',
  cidadeDestino: nfe.customer?.cidade || '',
  ufDestino: nfe.customer?.estado || '',
  pesoTotal: (nfe as any).weight || 0,
  volumes: (nfe as any).volumes || 1,
  metros_cubicos: (nfe as any).cubic_meters || 0,
  chaveAcesso: nfe.access_key,
  cteCount: 0,
  freight_results: nfe.freight_results || [],
  tolerancia_valor_fatura: nfe.carrier?.metadata?.tolerancia_valor_fatura || 0,
  tolerancia_percentual_fatura: nfe.carrier?.metadata?.tolerancia_percentual_fatura || 0,
  order_number: (nfe as any).order_number || (nfe as any).numero_pedido,
  order_serie: (nfe as any).order_serie
});

const mapNFeToElectronicDoc = (nfe: any): any => {
  // Try to parse XML to get rich data
  let xmlData = null;
  if (nfe.xml_data || nfe.xml_content) {
    try {
      const { parseNFeXml } = require('../../services/nfeXmlService');
      xmlData = parseNFeXml(nfe.xml_data || nfe.xml_content);
    } catch (e) {
// null
    }
  }

  return {
    id: nfe.id,
    document_type: 'NFe',
    modelo: '55',
    numeroDocumento: nfe.number || nfe.numero || '',
    serie: nfe.series || nfe.serie || '1',
    chaveAcesso: nfe.access_key,
    protocoloAutorizacao: xmlData?.authorizationProtocol || '',
    dataAutorizacao: nfe.created_at,
    dataImportacao: nfe.created_at,
    status: 'autorizado',
    emitente: xmlData?.carrier ? {
      razaoSocial: xmlData.carrier.name || nfe.carrier?.razao_social || '',
      cnpj: xmlData.carrier.cnpj || nfe.carrier?.cnpj || '',
      endereco: xmlData.carrier.address || '',
      cidade: xmlData.carrier.city || '',
      uf: xmlData.carrier.state || '',
      cep: xmlData.carrier.zipCode || '',
      inscricaoEstadual: xmlData.carrier.stateRegistration || ''
    } : {
      razaoSocial: nfe.carrier?.razao_social || 'EMITENTE PADRÃO',
      cnpj: nfe.carrier?.cnpj || '00000000000000',
      endereco: '',
      cidade: '',
      uf: '',
      cep: '',
      inscricaoEstadual: ''
    },
    destinatario: xmlData?.customer ? {
      razaoSocial: xmlData.customer.name || nfe.customer?.razao_social || '',
      cnpjCpf: xmlData.customer.cnpj || nfe.customer?.cnpj_cpf || '',
      endereco: xmlData.customer.address || nfe.customer?.logradouro || '',
      cep: xmlData.customer.zipCode || nfe.customer?.cep || '',
      cidade: xmlData.customer.city || nfe.customer?.cidade || '',
      uf: xmlData.customer.state || nfe.customer?.estado || '',
      inscricaoEstadual: xmlData.customer.stateRegistration || ''
    } : {
      razaoSocial: nfe.customer?.razao_social || '',
      cnpjCpf: nfe.customer?.cnpj_cpf || '',
      endereco: nfe.customer?.logradouro || '',
      cep: nfe.customer?.cep || '',
      cidade: nfe.customer?.cidade || '',
      uf: nfe.customer?.estado || '',
      inscricaoEstadual: nfe.customer?.inscricao_estadual || ''
    },
    valorTotal: nfe.total_value || 0,
    valorIcms: nfe.icms_value || 0,
    valorFrete: 0,
    pesoTotal: nfe.weight || nfe.peso_total || 0,
    modalTransporte: 'RODOVIARIO',
    xmlContent: nfe.xml_data || nfe.xml_content || ''
  };
};

interface InvoicesProps {
  initialId?: string;
}

export const Invoices: React.FC<InvoicesProps> = ({ initialId }) => {
  const { t } = useTranslation();

  const { user, currentEstablishment: authEstablishment } = useAuth();
  
  useActivityLogger('Notas Fiscais', 'Acesso', 'Acessou a Gestão de Notas Fiscais');

  const [invoices, setInvoices] = useState<any[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<any[]>([]);
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isImportingSAP, setIsImportingSAP] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCTesModal, setShowCTesModal] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showSchedulePickupModal, setShowSchedulePickupModal] = useState(false);
  const [showBulkXmlUploadModal, setShowBulkXmlUploadModal] = useState(false);
  const [showDebugModal, setShowDebugModal] = useState(false);
  const [showCreatePickupModal, setShowCreatePickupModal] = useState(false);
  const [showOccurrenceModal, setShowOccurrenceModal] = useState(false);
  const [isSapActive, setIsSapActive] = useState<boolean>(false);
  const [selectedInvoiceForOccurrence, setSelectedInvoiceForOccurrence] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [currentEstablishment, setCurrentEstablishment] = useState<{id: string, name: string} | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    invoiceId?: string;
    invoiceNumber?: string;
    action?: string;
  }>({ isOpen: false });
  const [filters, setFilters] = useState({
    transportador: '',
    cliente: '',
    periodoEmissao: { start: '', end: '' },
    periodoEntrada: { start: '', end: '' },
    ufDestino: '',
    cidadeDestino: '',
    status: [] as string[],
    baseCusto: '',
    numeroOuChave: ''
  });

  const breadcrumbItems = [
    { label: 'Documentos Operacionais' },
    { label: 'Notas Fiscais', current: true }
  ];

  useEffect(() => {
    const checkSapConfig = async () => {
      try {
        if (!user) return;
        const config = await implementationService.getERPConfig(
          user.organization_id || undefined,
          user.environment_id || undefined,
          user.establishment_id || undefined
        );
        if (config && config.erp_name === 'sap-business-one') {
          setIsSapActive(true);
        }
      } catch (e) {

      }
    };
    checkSapConfig();
  }, [user]);

  useEffect(() => {
    if (authEstablishment) {
      setCurrentEstablishment({
        id: authEstablishment.establishment_id || authEstablishment.id.toString(),
        name: `${authEstablishment.codigo} - ${authEstablishment.razaoSocial || authEstablishment.fantasia || ''}`
      });
    }
  }, [authEstablishment]);

  useEffect(() => {
    refreshData();
    
    window.addEventListener('refresh-invoices-list', refreshData);
    return () => {
      window.removeEventListener('refresh-invoices-list', refreshData);
    };
  }, []);

  // Handle initial invoice from navigation
  const [lastOpenedInitialId, setLastOpenedInitialId] = useState<string | null>(null);
  useEffect(() => {
    if (initialId && invoices.length > 0 && initialId !== lastOpenedInitialId) {
      setLastOpenedInitialId(initialId);
      handleSingleAction(initialId, 'view-details');
    }
  }, [initialId, invoices, lastOpenedInitialId]);

  const handleImportLatestSAPInvoice = async () => {
    setIsImportingSAP(true);
    setToast(null);
    try {
      const response = await sapIntegrationService.importLatestSAPInvoice();
      if (!response.success) {
        setToast({ message: response.error || 'Falha na comunicação com SAP Service Layer', type: 'error' });
      } else {
        setToast({ message: response.message || 'Nota Fiscal SAP Importada e Integrada!', type: 'success' });
        await refreshData();
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Erro inesperado ao invocar integração SAP.', type: 'error' });
    } finally {
      setIsImportingSAP(false);
    }
  };

  // Apply filters to invoices
  useEffect(() => {
    const applyFilters = () => {
      let result = [...invoices];
      
      // Filter by transportador
      if (filters.transportador) {
        result = result.filter(invoice => 
          invoice.transportador.toLowerCase().includes(filters.transportador.toLowerCase())
        );
      }
      
      // Filter by cliente
      if (filters.cliente) {
        result = result.filter(invoice => 
          invoice.cliente.toLowerCase().includes(filters.cliente.toLowerCase())
        );
      }
      
      // Filter by período de emissão
      if (filters.periodoEmissao.start && filters.periodoEmissao.end) {
        const startDate = new Date(filters.periodoEmissao.start);
        const endDate = new Date(filters.periodoEmissao.end);
        endDate.setHours(23, 59, 59, 999); // End of day
        
        result = result.filter(invoice => {
          const emissaoDate = new Date(invoice.dataEmissao);
          return emissaoDate >= startDate && emissaoDate <= endDate;
        });
      }
      
      // Filter by período de entrada
      if (filters.periodoEntrada.start && filters.periodoEntrada.end) {
        const startDate = new Date(filters.periodoEntrada.start);
        const endDate = new Date(filters.periodoEntrada.end);
        endDate.setHours(23, 59, 59, 999); // End of day
        
        result = result.filter(invoice => {
          const entradaDate = new Date(invoice.dataEntrada);
          return entradaDate >= startDate && entradaDate <= endDate;
        });
      }
      
      // Filter by UF destino
      if (filters.ufDestino) {
        result = result.filter(invoice => invoice.ufDestino === filters.ufDestino);
      }
      
      // Filter by cidade destino
      if (filters.cidadeDestino) {
        result = result.filter(invoice => 
          invoice.cidadeDestino.toLowerCase().includes(filters.cidadeDestino.toLowerCase())
        );
      }
      
      // Filter by status
      if (filters.status.length > 0) {
        result = result.filter(invoice => filters.status.includes(invoice.status));
      }

      // Filter by base de custo
      if (filters.baseCusto) {
        result = result.filter(invoice => invoice.baseCusto === filters.baseCusto);
      }
      
      // Filter by número ou chave
      if (filters.numeroOuChave) {
        result = result.filter(invoice => 
          invoice.numero.includes(filters.numeroOuChave) || 
          invoice.chaveAcesso.includes(filters.numeroOuChave)
        );
      }
      
      setFilteredInvoices(result);
    };
    
    applyFilters();
  }, [invoices, filters]);

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedInvoices(filteredInvoices.map(invoice => invoice.id));
    } else {
      setSelectedInvoices([]);
    }
  };

  const handleSelectInvoice = (invoiceId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedInvoices(prev => [...prev, invoiceId]);
    } else {
      setSelectedInvoices(prev => prev.filter(id => id !== invoiceId));
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedInvoices.length === 0) {
      setToast({ message: 'Por favor, selecione pelo menos uma nota fiscal para realizar esta ação.', type: 'warning' });
      return;
    }

    if (action === 'create-pickup') {
      handleCreatePickups();
      return;
    }

    if (action === 'schedule-pickup') {
      setShowSchedulePickupModal(true);
      return;
    }

    if (action === 'recalculate') {
      setIsLoading(true);
      try {
        let successCount = 0;
        for (const invoiceId of selectedInvoices) {
          const nfeData = await nfeService.getById(invoiceId);
          if (!nfeData || !nfeData.id) continue;
          
          const weight = Number(nfeData.products?.reduce((acc: number, p: any) => acc + (p.quantidade || 0), 0)) || 100;
          const volume_qty = Number((nfeData as any).volumes) || 1;
          const m3 = Number((nfeData as any).cubic_meters) || 0;
          const value = Number(nfeData.total_value) || 0;
          
          if (weight === 0 || value === 0) continue;
          
          if (nfeData.carrier_id) {
            try {
              const invoiceData = {
                weight,
                value,
                volume: volume_qty,
                m3,
                destinationCity: nfeData.customer?.cidade || '',
                destinationState: nfeData.customer?.estado || '',
                issueDate: nfeData.issue_date,
                items: nfeData.products?.map((p: any) => ({
                   itemCode: p.codigo_produto,
                   eanCode: p.ean === 'SEM GTIN' ? undefined : p.ean,
                   ncmCode: p.ncm
                })) || []
              };
              
              const carrierData = await invoicesCostService.getCarrierData(nfeData.carrier_id);
              if (carrierData) {
                const calculation = await invoicesCostService.calculateInvoiceCost(invoiceData, nfeData.carrier_id, nfeData.issue_date);
                await invoicesCostService.saveCostsToInvoice(invoiceId, nfeData.carrier_id, calculation, carrierData);
                
                const mockFreightResult = [{
                  carrierId: nfeData.carrier_id,
                  carrierName: carrierData.razao_social,
                  totalValue: calculation.valorTotal,
                  calculationDetails: calculation
                }];
                await (supabase as any).from('invoices_nfe').update({ 
                  valor_frete: calculation.valorTotal,
                  freight_results: mockFreightResult 
                }).eq('id', invoiceId);
                successCount++;
                continue;
              }
            } catch (err) {
// null
            }
          }
          
          let destZipCode = (nfeData.customer as any)?.cep ? (nfeData.customer as any).cep.replace(/\D/g, '') : undefined;
          
          try {
            const results = await freightQuoteService.calculateQuote({
              destinationZipCode: destZipCode,
              weight,
              volumeQty: volume_qty,
              cargoValue: value,
              cubicMeters: m3,
              selectedModals: ['rodoviario', 'aereo', 'aquaviario', 'ferroviario'],
              items: nfeData.products?.map((p: any) => ({
                 itemCode: p.codigo_produto,
                 eanCode: p.ean === 'SEM GTIN' ? undefined : p.ean,
                 ncmCode: p.ncm
              })) || []
            });
            
            let updateData: any = { freight_results: results };
            if (results && results.length > 0) {
              if (nfeData.carrier_id) {
                const selectedQuote = results.find(r => r.carrierId === nfeData.carrier_id);
                if (selectedQuote) {
                  updateData.carrier_id = selectedQuote.carrierId;
                  updateData.valor_frete = selectedQuote.totalValue;
                } else {
                  updateData.carrier_id = nfeData.carrier_id;
                  updateData.valor_frete = 0;
                }
              } else {
                updateData.carrier_id = results[0].carrierId;
                updateData.valor_frete = results[0].totalValue;
              }
            } else if (nfeData.carrier_id) {
               updateData.carrier_id = nfeData.carrier_id;
               updateData.valor_frete = 0;
               updateData.freight_results = [];
            }
            
            await (supabase as any).from('invoices_nfe').update(updateData).eq('id', invoiceId);
            successCount++;
          } catch (innerError) {
// null
          }
        }
        
        setToast({ message: `${successCount} nota(s) fiscal(is) recalculada(s) com sucesso!`, type: 'success' });
        refreshData();
      } catch (error) {
// null
        setToast({ message: 'Erro ao recalcular frete. Tente novamente.', type: 'error' });
      } finally {
        setIsLoading(false);
      }
      setSelectedInvoices([]);
      return;
    }

    if (action === 'print' || action === 'download') {
      setIsLoading(true);
      try {
        const selectedInvoicesData = await nfeService.getByIds(selectedInvoices);
        if (selectedInvoicesData.length === 0) throw new Error('Nenhuma nota encontrada');

        if (action === 'download') {
          if (selectedInvoicesData.length === 1) {
            const nfe = selectedInvoicesData[0];
            const doc = mapNFeToElectronicDoc(nfe);
            let xmlContent = doc.xmlContent || generateNfeXml(doc);
            const blob = new Blob([xmlContent], { type: 'application/xml' });
            const url = window.URL.createObjectURL(blob);
            const a = window.document.createElement('a');
            a.href = url;
            a.download = `NFe_${doc.chaveAcesso}.xml`;
            window.document.body.appendChild(a);
            a.click();
            window.document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            setToast({ message: `XML da nota fiscal baixado com sucesso!`, type: 'success' });
          } else {
            const JSZip = (await import('jszip')).default;
            const zip = new JSZip();
            selectedInvoicesData.forEach(nfe => {
              const doc = mapNFeToElectronicDoc(nfe);
              let xmlContent = doc.xmlContent || generateNfeXml(doc);
              zip.file(`NFe_${doc.chaveAcesso}.xml`, xmlContent);
            });
            const content = await zip.generateAsync({ type: 'blob' });
            const url = window.URL.createObjectURL(content);
            const a = window.document.createElement('a');
            a.href = url;
            a.download = `XMLs_Notas_Fiscais_${new Date().getTime()}.zip`;
            window.document.body.appendChild(a);
            a.click();
            window.document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            setToast({ message: `Arquivo ZIP com ${selectedInvoicesData.length} XMLs baixado com sucesso!`, type: 'success' });
          }
        }

        if (action === 'print') {
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            // Get the HTML and extract the original styles from the first document
            const firstDocHtml = getDanfeHtml(mapNFeToElectronicDoc(selectedInvoicesData[0]));
            const styleMatch = firstDocHtml.match(/<style>([\s\S]*?)<\/style>/i);
            const originalStyles = styleMatch ? styleMatch[1] : '';

            let fullHtml = `<html><head><style>${originalStyles}\n@page{size: A4 portrait; margin: 10mm;}</style></head><body>`;
            
            selectedInvoicesData.forEach((nfe, index) => {
              const doc = mapNFeToElectronicDoc(nfe);
              const html = getDanfeHtml(doc);
              let innerHtml = html;
              const bodyStart = html.indexOf('<body>');
              const bodyEnd = html.indexOf('</body>');
              if (bodyStart !== -1 && bodyEnd !== -1) {
                innerHtml = html.substring(bodyStart + 6, bodyEnd);
              }
              
              const pageBreakStyle = index < selectedInvoicesData.length - 1 ? 'break-after: page; page-break-after: always;' : '';
              fullHtml += `<div style="${pageBreakStyle}">${innerHtml}</div>`;
            });
            fullHtml += '</body></html>';
            
            printWindow.document.write(fullHtml);
            printWindow.document.close();
            setTimeout(() => { printWindow.print(); }, 500);
            setToast({ message: `DANFE gerado para ${selectedInvoices.length} nota(s) fiscal(is).`, type: 'success' });
          }
        }
      } catch (error) {
// null
        setToast({ message: 'Erro ao processar documentos.', type: 'error' });
      } finally {
        setIsLoading(false);
        setSelectedInvoices([]);
      }
      return;
    }

    setIsLoading(true);

    // Any other action...
    setTimeout(() => {
      setIsLoading(false);
      setSelectedInvoices([]);
    }, 1000);
  };

  const handleCreatePickups = async () => {
    if (!currentEstablishment || !user) {
      setToast({ message: 'Estabelecimento ou usuário não identificado', type: 'error' });
      return;
    }

    const selectedInvoicesData = await nfeService.getByIds(selectedInvoices);

    if (selectedInvoicesData.length === 0) {
      setToast({ message: 'Nenhuma nota fiscal encontrada', type: 'error' });
      return;
    }

    const invoicesByCarrier = selectedInvoicesData.reduce((acc: any, invoice: any) => {
      const carrierName = invoice.carrier?.razao_social || 'Sem Transportador';
      if (!acc[carrierName]) {
        acc[carrierName] = [];
      }
      acc[carrierName].push(invoice);
      return acc;
    }, {});

    const carriers = Object.keys(invoicesByCarrier);
    const pickupsToCreate = carriers.length;

    if (pickupsToCreate > 1) {
      // The modal can handle showing multiples
    }

    setShowCreatePickupModal(true);
  };

  const handleSingleAction = async (invoiceId: string | number, action: string) => {
    setIsLoading(true);
    
    try {
      const invoice = invoices.find(i => i.id.toString() === invoiceId.toString());
      
      if (!invoice) {
        setIsLoading(false);
        return;
      }
      
      switch (action) {
        case 'edit': {
          const fullInvoice = await nfeService.getById(invoice.id);
          if (fullInvoice) {
            setEditingInvoice(fullInvoice);
            setShowInvoiceForm(true);
          } else {
            setToast({ message: 'Erro ao carregar dados completos da nota fiscal.', type: 'error' });
          }
          break;
        }
        case 'recalculate': {
          try {
            const nfeData = await nfeService.getById(invoice.id);
            if (!nfeData || !nfeData.id) {
              setToast({ message: 'Erro ao carregar os dados completos da nota fiscal para recálculo.', type: 'error' });
              break;
            }
            
            const weight = Number(nfeData.products?.reduce((acc: number, p: any) => acc + (p.quantidade || 0), 0)) || 100;
            const volume_qty = Number((nfeData as any).volumes) || 1;
            const m3 = Number((nfeData as any).cubic_meters) || 0;
            const value = Number(nfeData.total_value) || 0;
            
            if (weight === 0 || value === 0) {
              setToast({ message: 'A nota fiscal não possui peso ou valor válidos para recálculo.', type: 'warning' });
              break;
            }
            
            if (nfeData.carrier_id) {
              try {
                const invoiceData = {
                  weight,
                  value,
                  volume: volume_qty,
                  m3,
                  destinationCity: nfeData.customer?.cidade || '',
                  destinationState: nfeData.customer?.estado || '',
                  issueDate: nfeData.issue_date
                };
                
                const carrierData = await invoicesCostService.getCarrierData(nfeData.carrier_id);
                if (carrierData) {
                  const calculation = await invoicesCostService.calculateInvoiceCost(invoiceData, nfeData.carrier_id, nfeData.issue_date);
                  await invoicesCostService.saveCostsToInvoice(invoice.id, nfeData.carrier_id, calculation, carrierData);
                  
                  const mockFreightResult = [{
                    carrierId: nfeData.carrier_id,
                    carrierName: carrierData.razao_social,
                    totalValue: calculation.valorTotal,
                    calculationDetails: calculation
                  }];
                  await (supabase as any).from('invoices_nfe').update({ 
                    valor_frete: calculation.valorTotal,
                    freight_results: mockFreightResult 
                  }).eq('id', invoice.id);
                  
                  setToast({ message: `Nota ${invoice.numero} recalculada com sucesso!`, type: 'success' });
                  refreshData();
                  break;
                }
              } catch (err) {
// null
                // Fallback para cotação geral se falhar
              }
            }
            
            let destZipCode = (nfeData.customer as any)?.cep ? (nfeData.customer as any).cep.replace(/\D/g, '') : undefined;
            const results = await freightQuoteService.calculateQuote({
              destinationZipCode: destZipCode,
              weight,
              volumeQty: volume_qty,
              cargoValue: value,
              cubicMeters: m3,
              selectedModals: ['rodoviario', 'aereo', 'aquaviario', 'ferroviario']
            });
            
            let updateData: any = { freight_results: results };
            if (results && results.length > 0) {
              if (nfeData.carrier_id) {
                const selectedQuote = results.find(r => r.carrierId === nfeData.carrier_id);
                if (selectedQuote) {
                  updateData.carrier_id = selectedQuote.carrierId;
                  updateData.valor_frete = selectedQuote.totalValue;
                } else {
                  updateData.carrier_id = nfeData.carrier_id;
                  updateData.valor_frete = 0;
                }
              } else {
                updateData.carrier_id = results[0].carrierId;
                updateData.valor_frete = results[0].totalValue;
              }
            } else if (nfeData.carrier_id) {
               updateData.carrier_id = nfeData.carrier_id;
               updateData.valor_frete = 0;
               updateData.freight_results = [];
            }
            await (supabase as any).from('invoices_nfe').update(updateData).eq('id', invoice.id);
            setToast({ message: `Nota ${invoice.numero} recalculada com sucesso via cotação!`, type: 'success' });
            refreshData();
          } catch (error) {
// null
            setToast({ message: 'Erro ao recalcular frete.', type: 'error' });
          }
          break;
        }
        case 'view-ctes':
          setSelectedInvoice(invoice);
          setShowCTesModal(true);
          break;
        case 'view-details':
          setSelectedInvoice(invoice);
          setShowDetailsModal(true);
          break;
        case 'print': {
          const fullInvoice = await nfeService.getById(invoice.id);
          if (fullInvoice) {
            const doc = mapNFeToElectronicDoc(fullInvoice);
            const printWindow = window.open('', '_blank');
            if (printWindow) {
              printWindow.document.write(getDanfeHtml(doc));
              printWindow.document.close();
              setTimeout(() => { printWindow.print(); }, 500);
            }
            setToast({ message: `DANFE gerado para a nota fiscal ${invoice.numero}.`, type: 'success' });
          }
          break;
        }
        case 'download': {
          const fullInvoice = await nfeService.getById(invoice.id);
          if (fullInvoice) {
            const doc = mapNFeToElectronicDoc(fullInvoice);
            let xmlContent = doc.xmlContent || generateNfeXml(doc);
            const blob = new Blob([xmlContent], { type: 'application/xml' });
            const url = window.URL.createObjectURL(blob);
            const a = window.document.createElement('a');
            a.href = url;
            a.download = `NFe_${doc.chaveAcesso}.xml`;
            window.document.body.appendChild(a);
            a.click();
            window.document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            setToast({ message: `XML da nota fiscal ${invoice.numero} baixado com sucesso!`, type: 'success' });
          }
          break;
        }
        case 'lancar-ocorrencia':
          setSelectedInvoiceForOccurrence(invoice.id);
          setShowOccurrenceModal(true);
          break;
        case 'delete':
          setConfirmDialog({
            isOpen: true,
            invoiceId: invoiceId.toString(),
            invoiceNumber: invoice.numero,
            action: 'delete'
          });
          break;
      }
    } catch (error) {
// null
      setToast({ message: 'Ocorreu um erro ao executar a ação.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    setIsLoading(true);

    try {
      const nfes = await nfeService.getAll();
      const formattedInvoices = nfes.map(convertNFeToInvoiceFormat);
      setInvoices(formattedInvoices);
    } catch (error) {
// null
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (confirmDialog.invoiceId && confirmDialog.invoiceNumber) {
      try {
        const result = await nfeService.delete(confirmDialog.invoiceId);
        if (result.success) {
          setToast({ message: `Nota Fiscal ${confirmDialog.invoiceNumber} excluída com sucesso!`, type: 'success' });
          refreshData();
        } else {
          setToast({ message: `Erro ao excluir Nota Fiscal: ${result.error}`, type: 'error' });
        }
      } catch (error) {
// null
        setToast({ message: 'Erro ao excluir nota fiscal.', type: 'error' });
      }
    }
    setConfirmDialog({ isOpen: false });
  };

  if (showInvoiceForm) {
    if (!currentEstablishment) {
      return (
        <div className="p-6 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-lg text-gray-700 dark:text-gray-300">Carregando estabelecimento...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="p-6">
        <InvoiceForm
          invoice={editingInvoice}
          onBack={() => { setShowInvoiceForm(false); setEditingInvoice(null); }}
          onSave={() => {
            setShowInvoiceForm(false);
            setEditingInvoice(null);
            refreshData();
          }}
          establishmentId={currentEstablishment.id}
          establishmentName={currentEstablishment.name}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Breadcrumbs items={breadcrumbItems} />

      <div className="flex items-center gap-3">
        {currentEstablishment && (
          <div className="flex-1">
            <AutoDownloadStatus establishmentId={currentEstablishment.id} />
          </div>
        )}
        <button
          onClick={() => setShowDebugModal(true)}
          className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors border border-gray-300"
          title="Debug - Importação Automática"
        >
          <Bug size={18} />
          <span className="font-medium">{t('invoices.actions.debugAutoImport')}</span>
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('invoices.pageTitle')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('invoices.pageDescription')}</p>
        </div>
        <div className="flex items-center space-x-3">
          {isSapActive && (
            <button
              onClick={handleImportLatestSAPInvoice}
              disabled={isImportingSAP}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
              title="Conecta no ERP e traz as Notas Fiscais mais recentes"
            >
              <FileText size={20} className={isImportingSAP ? 'animate-bounce' : ''} />
              <span>Baixar Notas Fiscais SAP</span>
            </button>
          )}
          
          <button
            onClick={() => { setEditingInvoice(null); setShowInvoiceForm(true); }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus size={20} />
            <span>{t('invoices.actions.insertInvoice')}</span>
          </button>
          <button
            onClick={() => setShowBulkXmlUploadModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Upload size={20} />
            <span>{t('invoices.actions.bulkXmlImport')}</span>
          </button>
          <button
            onClick={refreshData}
            disabled={isLoading}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
            <span>{isLoading ? t('invoices.actions.loading') : t('invoices.actions.refresh')}</span>
          </button>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('invoices.summary.totalNfes')}</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{invoices.length}</p>
            </div>
            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <FileText size={20} className="text-gray-600 dark:text-gray-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('invoices.summary.issued')}</p>
              <p className="text-2xl font-semibold text-gray-500 mt-1">
                {invoices.filter(invoice => ['emitida', 'Emitida'].includes(invoice.status)).length}
              </p>
            </div>
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <FileText size={20} className="text-gray-500" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('invoices.summary.inCollection')}</p>
              <p className="text-2xl font-semibold text-indigo-600 mt-1">
                {invoices.filter(invoice => ['coletada', 'Coletada'].includes(invoice.status)).length}
              </p>
            </div>
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Truck size={20} className="text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('invoices.summary.inTransit')}</p>
              <p className="text-2xl font-semibold text-blue-500 mt-1">
                {invoices.filter(invoice => ['em trânsito', 'Em trânsito', 'em_transito'].includes(invoice.status)).length}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Truck size={20} className="text-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('invoices.summary.outForDelivery')}</p>
              <p className="text-2xl font-semibold text-orange-500 mt-1">
                {invoices.filter(invoice => ['saiu p/ entrega', 'Saiu p/ Entrega', 'saiu_entrega'].includes(invoice.status)).length}
              </p>
            </div>
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Truck size={20} className="text-orange-500" />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('invoices.summary.delivered')}</p>
              <p className="text-2xl font-semibold text-green-600 mt-1">
                {invoices.filter(invoice => ['entregue', 'Entregue'].includes(invoice.status)).length}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle size={20} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('invoices.summary.canceled')}</p>
              <p className="text-2xl font-semibold text-red-600 mt-1">
                {invoices.filter(invoice => ['cancelada', 'Cancelada'].includes(invoice.status)).length}
              </p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle size={20} className="text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <InvoicesFilters 
        onFilterChange={handleFilterChange} 
        filters={filters}
      />

      {/* Bulk Actions */}
      <InvoicesActions 
        selectedCount={selectedInvoices.length}
        onAction={handleBulkAction}
        isLoading={isLoading}
      />

      {/* Invoices Table */}
      <InvoicesTable
        invoices={filteredInvoices}
        selectedInvoices={selectedInvoices}
        onSelectAll={handleSelectAll}
        onSelectInvoice={handleSelectInvoice}
        onAction={handleSingleAction}
        isLoading={isLoading}
      />

      {/* No Results */}
      {filteredInvoices.length === 0 && !isLoading && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <FileText size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('invoices.empty.title')}</h3>
          <p className="text-gray-600 dark:text-gray-400">{t('invoices.empty.description')}</p>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl flex items-center space-x-4">
            <RefreshCw size={24} className="text-blue-600 animate-spin" />
            <p className="text-gray-800 dark:text-gray-200 font-medium">{t('invoices.loading')}</p>
          </div>
        </div>
      )}

      {/* Invoice Details Modal */}
      {showDetailsModal && selectedInvoice && (
        <InvoiceDetailsModal 
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          invoice={selectedInvoice}
          onPrint={() => handleSingleAction(selectedInvoice.id, 'print')}
          onDownload={() => handleSingleAction(selectedInvoice.id, 'download')}
        />
      )}

      {/* Invoice CTes Modal */}
      {showCTesModal && selectedInvoice && (
        <InvoiceCTesModal
          isOpen={showCTesModal}
          onClose={() => setShowCTesModal(false)}
          invoiceId={selectedInvoice.id}
          invoiceNumber={selectedInvoice.numero}
        />
      )}

      {/* Schedule Pickup Modal */}
      {showSchedulePickupModal && (
        <SchedulePickupModal
          isOpen={showSchedulePickupModal}
          onClose={() => setShowSchedulePickupModal(false)}
          selectedInvoices={invoices.filter(inv => selectedInvoices.includes(inv.id))}
          establishmentId={currentEstablishment?.id}
          onSuccess={() => {
            setToast({ message: 'Agendamento de coleta criado com sucesso!', type: 'success' });
            setSelectedInvoices([]);
            refreshData();
          }}
        />
      )}

      {/* Create Pickup Modal */}
      {showCreatePickupModal && (
        <CreatePickupModal
          isOpen={showCreatePickupModal}
          onClose={() => setShowCreatePickupModal(false)}
          selectedInvoices={invoices.filter(inv => selectedInvoices.includes(inv.id))}
          establishmentId={currentEstablishment?.id}
          userId={Number(user?.id) || undefined}
          onSuccess={(count, desc) => {
            setToast({ message: `${count || 1} Coleta(s) criada(s) com sucesso!\n${desc || ''}`, type: 'success' });
            setSelectedInvoices([]);
            refreshData();
          }}
        />
      )}

      {/* Bulk XML Upload Modal */}
      {showBulkXmlUploadModal && currentEstablishment && (
        <BulkXmlUploadModal
          isOpen={showBulkXmlUploadModal}
          onClose={() => setShowBulkXmlUploadModal(false)}
          establishmentId={currentEstablishment.id}
          onSuccess={() => {
            setToast({ message: 'XMLs importados com sucesso!', type: 'success' });
            refreshData();
          }}
        />
      )}

      {/* Auto Import Debug Modal */}
      <AutoImportDebugModal
        isOpen={showDebugModal}
        onClose={() => setShowDebugModal(false)}
      />

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Confirm Dialog */}
      {confirmDialog.isOpen && confirmDialog.invoiceNumber && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.action === 'create-pickups' ? 'Confirmar Criação de Coletas' : 'Confirmar Exclusão'}
          message={
            confirmDialog.action === 'create-pickups'
              ? `Deseja confirmar a criação de ${confirmDialog.invoiceNumber}?`
              : `Tem certeza que deseja excluir a Nota Fiscal ${confirmDialog.invoiceNumber}? Esta ação não pode ser desfeita.`
          }
          onConfirm={confirmDelete}
          onCancel={() => setConfirmDialog({ isOpen: false })}
        />
      )}

      {/* Modal de Lançar Ocorrência */}
      {showOccurrenceModal && selectedInvoiceForOccurrence && (
        <OccurrenceInvoiceModal
          isOpen={showOccurrenceModal}
          onClose={() => {
            setShowOccurrenceModal(false);
            setSelectedInvoiceForOccurrence(null);
          }}
          onSave={async (occurrenceData) => {
            try {
              const res = await nfeService.addOccurrence(selectedInvoiceForOccurrence, occurrenceData);
              if (res.success) {
                setToast({ message: 'Ocorrência lançada com sucesso!', type: 'success' });
                refreshData();
              } else {
                setToast({ message: res.error || 'Erro ao lançar ocorrência.', type: 'error' });
              }
            } catch (err) {
              setToast({ message: 'Erro ao lançar ocorrência.', type: 'error' });
            }
          }}
          invoiceNumber={invoices.find(i => i.id === selectedInvoiceForOccurrence)?.numero || ''}
          invoiceId={selectedInvoiceForOccurrence}
          carrierName={invoices.find(i => i.id === selectedInvoiceForOccurrence)?.transportador || ''}
          userId={Number(user?.id) || undefined}
        />
      )}
    </div>
  );
};