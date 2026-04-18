import React, { useState, useEffect } from 'react';
import Breadcrumbs from '../Layout/Breadcrumbs';
import { supabase } from '../../lib/supabase';
import { Search, Filter, Download, FileText, CheckCircle, XCircle, AlertCircle, Clock, Truck, MapPin, DollarSign, FileCheck, Printer, RefreshCw, Eye, Clock as ArrowClockwise, ThumbsUp, ThumbsDown, Plus, Upload, Bug, User } from 'lucide-react';
import { CTesFilters } from './CTesFilters';
import { CTesTable } from './CTesTable';
import { CTesActions } from './CTesActions';
import { CTeForm } from './CTeForm';
import { CTeDetailsModal } from './CTeDetailsModal';
import { CTeValuesComparisonModal } from './CTeValuesComparisonModal';
import { ReportDivergenceModal } from './ReportDivergenceModal';
import { BulkCTeXmlUploadModal } from './BulkCTeXmlUploadModal';
import { CTesRejectModal } from './CTesRejectModal';
import { FreightRateValuesForm } from '../FreightRates/FreightRateValuesForm';
import { DactePreview } from '../ElectronicDocuments/DactePreview';
import { getDacteHtml } from '../../utils/dacteGenerator';
import { AutoDownloadStatus } from '../common/AutoDownloadStatus';
import { RelationshipMapModal } from '../RelationshipMap/RelationshipMapModal';
import { AutoImportDebugModal } from '../common/AutoImportDebugModal';
import { ctesCompleteService, CTeWithRelations } from '../../services/ctesCompleteService';
import { DivergenceReportData } from '../../services/cteDivergenceReportService';
import { establishmentsService } from '../../services/establishmentsService';
import { userActivitiesService } from '../../services/userActivitiesService';
import { useAuth } from '../../hooks/useAuth';
import { freightCostCalculator } from '../../services/freightCostCalculator';
import { freightRatesService, FreightRate } from '../../services/freightRatesService';
import { Toast, ToastType } from '../common/Toast';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { sapIntegrationService } from '../../services/sapService';
import { ElectronicDocument } from '../../data/electronicDocumentsData';
import { formatCurrency } from '../../utils/formatters';
import { useActivityLogger } from '../../hooks/useActivityLogger';

const normalizeCTeStatus = (status: string | undefined | null) => {
  if (!status) return 'Importado';
  const s = status.toLowerCase().trim();
  if (s === 'aprovado' || s.includes('auditado e aprovado') || s.includes('auditado_aprovado')) return 'Auditado e aprovado';
  if (s === 'reprovado' || s.includes('auditado e reprov') || s.includes('auditado_reprovado')) return 'Auditado e reprovado';
  if (s === 'cancelado') return 'Cancelado';
  if (s.includes('referenciada') || s.includes('com_nfe_referenciada')) return 'Com NF-e Referenciada';
  if (s === 'importado') return 'Importado';
  return 'Importado'; 
};

const convertCTeToDisplayFormat = (cte: CTeWithRelations) => {
  // O valor total calculado consolida ICMS (embutido ou não)
  const valorCustoCalculado = cte.carrier_costs && cte.carrier_costs.length > 0
    ? parseFloat(cte.carrier_costs.find(c => c.cost_type === 'total_value')?.cost_value.toString() || '0')
    : 0;

  return {
    id: cte.id,
    carrier_id: cte.carrier_id, // Adicionar carrier_id para filtros
    status: normalizeCTeStatus(cte.status),
    serie: cte.series || '',
    numero: cte.number,
    dataEmissao: cte.issue_date || '',
    dataEntrada: cte.entry_date || '',
    dataAprovacao: cte.created_at || '',
    tipoFrete: cte.freight_type,
    transportador: cte.carrier && cte.carrier.codigo ? `${String(cte.carrier.codigo).padStart(4, '0')} - ${cte.carrier.razao_social}` : (cte.carrier?.razao_social || ''),
    previsaoEntrega: (cte as any).estimated_delivery_date || (cte as any).previsao_entrega || '',
    cliente: cte.recipient_name 
      ? (cte.recipient_document ? `${cte.recipient_document} - ${cte.recipient_name}` : cte.recipient_name)
      : (cte.sender_name 
          ? (cte.sender_document ? `${cte.sender_document} - ${cte.sender_name}` : cte.sender_name)
          : ''),
    cidadeDestino: cte.recipient_city || '',
    ufDestino: cte.recipient_state || '',
    valorCTe: parseFloat(cte.total_value.toString()),
    valorCusto: valorCustoCalculado,
    tarifaCalculo: cte.calculated_freight_rate ? cte.calculated_freight_rate.codigo : '',
    tarifaCalculoId: cte.calculated_freight_rate_id || '',
    chaveAcesso: cte.access_key || '',
    nfesReferenciadas: cte.invoices?.length || 0,
    tpCTe: cte.xml_data?.tpCTe || '0',
    tolerancia_valor_cte: cte.carrier?.metadata?.tolerancia_valor_cte || 0,
    tolerancia_percentual_cte: cte.carrier?.metadata?.tolerancia_percentual_cte || 0
  };
};

const convertCTeToElectronicDocument = (cte: CTeWithRelations): ElectronicDocument => {
  let remetenteInfo: any = {};
  let destinatarioInfo: any = {};

  if (cte.xml_data && cte.xml_data.original) {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(cte.xml_data.original, 'text/xml');
      
      const rem = xmlDoc.querySelector('rem');
      if (rem) {
        const ender = rem.querySelector('enderReme');
        remetenteInfo = {
          nome: rem.querySelector('xNome')?.textContent || cte.sender_name,
          cnpj: rem.querySelector('CNPJ')?.textContent || rem.querySelector('CPF')?.textContent || cte.sender_document,
          ie: rem.querySelector('IE')?.textContent || undefined,
          endereco: ender ? `${ender.querySelector('xLgr')?.textContent || ''}, ${ender.querySelector('nro')?.textContent || 'S/N'} ${ender.querySelector('xBairro')?.textContent ? '- ' + ender.querySelector('xBairro')?.textContent : ''}` : '',
          cidade: ender?.querySelector('xMun')?.textContent || cte.sender_city,
          uf: ender?.querySelector('UF')?.textContent || cte.sender_state,
          cep: ender?.querySelector('CEP')?.textContent || ''
        };
      }

      const dest = xmlDoc.querySelector('dest');
      if (dest) {
        const ender = dest.querySelector('enderDest');
        destinatarioInfo = {
          nome: dest.querySelector('xNome')?.textContent || cte.recipient_name,
          cnpj: dest.querySelector('CNPJ')?.textContent || dest.querySelector('CPF')?.textContent || cte.recipient_document,
          ie: dest.querySelector('IE')?.textContent || undefined,
          endereco: ender ? `${ender.querySelector('xLgr')?.textContent || ''}, ${ender.querySelector('nro')?.textContent || 'S/N'} ${ender.querySelector('xBairro')?.textContent ? '- ' + ender.querySelector('xBairro')?.textContent : ''}` : (cte as any).recipient_address || '',
          cidade: ender?.querySelector('xMun')?.textContent || cte.recipient_city,
          uf: ender?.querySelector('UF')?.textContent || cte.recipient_state,
          cep: ender?.querySelector('CEP')?.textContent || (cte as any).recipient_zip_code || ''
        };
      }
    } catch (e) {
// null
    }
  }

  return {
    id: parseInt(cte.id),
    tipo: 'CTe',
    modelo: '57',
    numeroDocumento: cte.number,
    serie: cte.series || '001',
    chaveAcesso: cte.access_key || '',
    protocoloAutorizacao: (cte as any).authorization_protocol || 'N/A',
    dataAutorizacao: cte.issue_date || new Date().toISOString(),
    dataImportacao: cte.entry_date || new Date().toISOString(),
    status: 'autorizado',
    emitente: {
      razaoSocial: cte.carrier?.razao_social || 'Transportadora',
      cnpj: cte.carrier?.cnpj || '',
      inscricaoEstadual: cte.carrier?.metadata?.inscricao_estadual || (cte.carrier as any)?.inscricao_estadual,
      endereco: (cte.carrier as any)?.endereco || '',
      cidade: (cte.carrier as any)?.cidade || '',
      uf: (cte.carrier as any)?.uf || '',
      cep: (cte.carrier as any)?.cep || ''
    },
    remetente: (cte.sender_name || remetenteInfo.nome) ? {
      razaoSocial: remetenteInfo.nome || cte.sender_name || '',
      cnpj: remetenteInfo.cnpj || cte.sender_document || '',
      inscricaoEstadual: remetenteInfo.ie,
      endereco: remetenteInfo.endereco || '',
      cidade: remetenteInfo.cidade || cte.sender_city || '',
      uf: remetenteInfo.uf || cte.sender_state || '',
      cep: remetenteInfo.cep || ''
    } : undefined,
    destinatario: (cte.recipient_name || destinatarioInfo.nome) ? {
      razaoSocial: destinatarioInfo.nome || cte.recipient_name || '',
      cnpjCpf: destinatarioInfo.cnpj || cte.recipient_document || '',
      inscricaoEstadual: destinatarioInfo.ie,
      endereco: destinatarioInfo.endereco || (cte as any).recipient_address || '',
      cidade: destinatarioInfo.cidade || cte.recipient_city || '',
      uf: destinatarioInfo.uf || cte.recipient_state || '',
      cep: destinatarioInfo.cep || (cte as any).recipient_zip_code || ''
    } as Destinatario : undefined,
    valorTotal: parseFloat(cte.total_value.toString()),
    valorIcms: cte.carrier_costs?.find(c => c.cost_type === 'icms')?.cost_value
      ? parseFloat(cte.carrier_costs.find(c => c.cost_type === 'icms')!.cost_value.toString())
      : undefined,
    valorFrete: parseFloat(cte.total_value.toString()),
    pesoTotal: cte.total_weight ? parseFloat(cte.total_weight.toString()) : undefined,
    modalTransporte: 'RODOVIÁRIO'
  };
};

export const CTes: React.FC<{ initialId?: string }> = ({ initialId }) => {
  const { user, currentEstablishment: authEstablishment } = useAuth();
  const breadcrumbItems = [
    { label: 'Documentos Operacionais' },
    { label: 'CT-es', current: true }
  ];

  const [ctes, setCTes] = useState<any[]>([]);
  const [rawCTes, setRawCTes] = useState<CTeWithRelations[]>([]);
  const [filteredCTes, setFilteredCTes] = useState<any[]>([]);
  const [selectedCTes, setSelectedCTes] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showBulkXmlUploadModal, setShowBulkXmlUploadModal] = useState(false);
  const [showDebugModal, setShowDebugModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [showReportDivergenceModal, setShowReportDivergenceModal] = useState(false);
  const [showTariffModal, setShowTariffModal] = useState(false);
  const [showDacteModal, setShowDacteModal] = useState(false);
  const [showRelationshipMap, setShowRelationshipMap] = useState(false);
  const [selectedCTeForDetails, setSelectedCTeForDetails] = useState<CTeWithRelations | null>(null);
  const [selectedCteForMap, setSelectedCteForMap] = useState<any>(null);
  const [selectedCTeForComparison, setSelectedCTeForComparison] = useState<CTeWithRelations | null>(null);
  const [selectedCTeForDacte, setSelectedCTeForDacte] = useState<ElectronicDocument | null>(null);
  const [divergenceReportData, setDivergenceReportData] = useState<DivergenceReportData | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedCTeForReject, setSelectedCTeForReject] = useState<any>(null);

  useActivityLogger(
    'CT-es',
    'Acesso',
    'Acessou a listagem de Conhecimentos de Transporte'
  );

  const [selectedTariffId, setSelectedTariffId] = useState<string | null>(null);
  const [selectedTariff, setSelectedTariff] = useState<FreightRate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    cteId?: string;
    cteNumber?: string;
    action?: string;
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info' | 'error';
      rejectionReason?: string;
  }>({ isOpen: false });
  const [filters, setFilters] = useState({
    transportador: '',
    periodoInicio: '',
    periodoFim: '',
    ufDestino: '',
    status: [] as string[],
    tpCTe: [] as string[],
    numeroOuChave: ''
  });

  const currentEstablishment = React.useMemo(() => {
    if (!authEstablishment) return null;
    const authAny = authEstablishment as any;
    const validName = authAny.fantasia || authAny.nome_fantasia || authAny.razao_social || authAny.codigo;
    
    return {
      id: authAny.establishment_id || authEstablishment.id,
      name: `${authEstablishment.codigo} - ${validName}`,
      cnpj: authEstablishment.cnpj,
      email: authAny.email,
      telefone: authAny.telefone
    };
  }, [authEstablishment]);

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    const handleRefresh = () => {
      refreshData();
    };
    
    window.addEventListener('refresh-invoices-list', handleRefresh);
    return () => {
      window.removeEventListener('refresh-invoices-list', handleRefresh);
    };
  }, []);

  // Handle initial CTe from navigation
  const [lastOpenedInitialId, setLastOpenedInitialId] = useState<string | null>(null);
  useEffect(() => {
    if (initialId && ctes.length > 0 && initialId !== lastOpenedInitialId) {
      setLastOpenedInitialId(initialId);
      handleSingleAction(initialId, 'view-nfes');
    }
  }, [initialId, ctes, lastOpenedInitialId]);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const ctesData = await ctesCompleteService.getAll();
      setRawCTes(ctesData);
      const formattedCTes = ctesData.map(convertCTeToDisplayFormat);
      setCTes(formattedCTes);
    } catch (error) {
// null

      // Exibir erro para o usuário
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar CT-es';
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const loadTariffForEditing = async (tariffId: string) => {
    try {
      setIsLoading(true);
      const tariffData = await freightRatesService.getById(tariffId);
      if (tariffData) {
        setSelectedTariff(tariffData);
        setSelectedTariffId(tariffId);
        setShowTariffModal(true);
      } else {
        setToast({ message: 'Tarifa não encontrada.', type: 'error' });
      }
    } catch (error) {
// null
      setToast({ message: 'Erro ao carregar dados da tarifa.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTariff = async (tariff: FreightRate) => {
    try {
      setIsLoading(true);
      await freightRatesService.update(tariff.id, tariff);
      setToast({ message: 'Tarifa atualizada com sucesso!', type: 'success' });
      setShowTariffModal(false);
      setSelectedTariff(null);
      setSelectedTariffId(null);
    } catch (error) {
// null
      setToast({ message: 'Erro ao salvar tarifa.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCTe = async (cteData: any) => {
    await refreshData();
    setShowForm(false);
  };

  // Apply filters to CT-es
  useEffect(() => {
    const applyFilters = () => {
      let result = [...ctes];

      // Filter by transportador (comparar pelo carrier_id)
      if (filters.transportador) {
        result = result.filter(cte => cte.carrier_id === filters.transportador);
      }

      // Filter by período
      if (filters.periodoInicio && filters.periodoFim) {
        const startDate = new Date(filters.periodoInicio);
        const endDate = new Date(filters.periodoFim);
        endDate.setHours(23, 59, 59, 999); // End of day

        result = result.filter(cte => {
          const emissaoDate = new Date(cte.dataEmissao);
          return emissaoDate >= startDate && emissaoDate <= endDate;
        });
      }

      // Filter by UF destino
      if (filters.ufDestino) {
        result = result.filter(cte => cte.ufDestino === filters.ufDestino);
      }

      // Filter by status
      if (filters.status.length > 0) {
        result = result.filter(cte => filters.status.includes(cte.status));
      }

      // Filter by tpCTe
      if (filters.tpCTe && filters.tpCTe.length > 0) {
        result = result.filter(cte => filters.tpCTe.includes(cte.tpCTe));
      }

      // Filter by número ou chave
      if (filters.numeroOuChave) {
        result = result.filter(cte =>
          cte.numero.includes(filters.numeroOuChave) ||
          cte.chaveAcesso.includes(filters.numeroOuChave)
        );
      }

      setFilteredCTes(result);
    };

    applyFilters();
  }, [ctes, filters]);

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedCTes(filteredCTes.map(cte => cte.id));
    } else {
      setSelectedCTes([]);
    }
  };

  const handleSelectCTe = (cteId: string | number, isSelected: boolean) => {
    const id = typeof cteId === 'number' ? cteId.toString() : cteId;
    if (isSelected) {
      setSelectedCTes(prev => [...prev, id]);
    } else {
      setSelectedCTes(prev => prev.filter(existingId => existingId !== id));
    }
  };

  const handleBulkAction = (action: string) => {
    if (selectedCTes.length === 0) {
      setToast({ message: 'Por favor, selecione pelo menos um CT-e para realizar esta ação.', type: 'warning' });
      return;
    }
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      switch (action) {
        case 'print':
          (async () => {
            try {
              const ctesData = [];
              for (const cid of selectedCTes) {
                 const fcte = await ctesCompleteService.getById(cid.toString());
                 if (fcte) ctesData.push(fcte);
              }
              
              if (ctesData.length > 0) {
                  const printWindow = window.open('', '_blank');
                  if (printWindow) {
                    let fileName = 'DACTEs';
                    if (ctesData.length === 1 && ctesData[0].number) {
                        fileName = `DACTE - ${ctesData[0].number}`;
                    }
                    printWindow.document.title = fileName;

                    const firstDocHtml = getDacteHtml(convertCTeToElectronicDocument(ctesData[0]));
                    let originalStyles = '';
                    const styleStart = firstDocHtml.indexOf('<style>');
                    const styleEnd = firstDocHtml.indexOf('</style>');
                    if (styleStart !== -1 && styleEnd !== -1) {
                      originalStyles = firstDocHtml.substring(styleStart + 7, styleEnd);
                    }

                    let fullHtml = `<!DOCTYPE html><html><head><title>${fileName}</title><style>${originalStyles}\n@media print { body { margin: 0; padding: 0; background: white; -webkit-print-color-adjust: exact; } .page-break { page-break-before: always !important; break-before: page !important; display: block !important; height: 0 !important; margin: 0 !important; padding: 0 !important; clear: both !important; } .doc-wrapper { width: 100%; max-width: 210mm; margin: 0 auto; } }</style></head><body style="background: white;">`;
                    
                    ctesData.forEach((cte, index) => {
                      const doc = convertCTeToElectronicDocument(cte);
                      const html = getDacteHtml(doc);
                      let innerHtml = html;
                      const bodyStart = html.indexOf('<body>');
                      const bodyEnd = html.indexOf('</body>');
                      if (bodyStart !== -1 && bodyEnd !== -1) {
                        innerHtml = html.substring(bodyStart + 6, bodyEnd);
                      }
                      
                      if (index > 0) {
                        fullHtml += '<div class="page-break"></div>';
                      }
                      fullHtml += `<div class="doc-wrapper">${innerHtml}</div>`;
                    });
                    fullHtml += '</body></html>';
                    
                    printWindow.document.write(fullHtml);
                    printWindow.document.close();
                    
                    setTimeout(() => { if(printWindow.document) printWindow.document.title = fileName; }, 100);
                    setTimeout(() => { printWindow.print(); }, 500);
                    setToast({ message: `DACTE gerado para ${selectedCTes.length} CT-e(s).`, type: 'success' });
                  }
              }
              setIsLoading(false);
            } catch (error) {
              setToast({ message: 'Erro ao gerar DACTE.', type: 'error' });
              setIsLoading(false);
            }
          })();
          return; // Retorna aqui para não executar setIsLoading(false) prematuramente
        case 'recalculate':
          (async () => {
            try {
              let successCount = 0;
              let errorCount = 0;

              for (const cteId of selectedCTes) {
                try {
                  const fullCTe = await ctesCompleteService.getById(cteId.toString());
                  if (fullCTe) {
                    const calculation = await freightCostCalculator.calculateCTeCost(fullCTe);
                    await freightCostCalculator.saveCostsToCTe(cteId.toString(), calculation);
                    successCount++;
                  }
                } catch (error) {
// null
                  errorCount++;
                }
              }

              await refreshData();

              if (errorCount === 0) {
                setToast({ message: `${successCount} CT-e(s) recalculado(s) com sucesso!`, type: 'success' });
              } else {
                setToast({ message: `Recálculo concluído: ${successCount} sucesso(s) e ${errorCount} erro(s).`, type: 'warning' });
              }
            } catch (error) {
// null
              setToast({ message: 'Erro ao recalcular CT-es em lote.', type: 'error' });
            }
          })();
          break;
        case 'approve':
          (async () => {
            try {
              let successCount = 0;
              let sapCount = 0;
              let sapErrorCount = 0;
              let errorCount = 0;
              setToast({ message: 'Iniciando processamento em lote...', type: 'info' });
              
              let sapConfig = null;
              try {
                  sapConfig = await sapIntegrationService.getConfig();
              } catch(e) {}

              for (const cteId of selectedCTes) {
                try {
                  const fullCTe = await ctesCompleteService.getById(cteId.toString());
                  if (!fullCTe) throw new Error('CT-e não encontrado');

                  const { error: updateError } = await (supabase as any)
                    .from('ctes')
                    .update({ 
                      status: 'auditado_aprovado',
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', cteId);

                  if (updateError) throw updateError;
                  successCount++;

                  if (sapConfig && (sapConfig.endpointSystem || sapConfig.service_layer_address)) {
                      try {
                        const integrationPayload = {
                          ...sapConfig,
                          cte_data: {
                            number: fullCTe.number,
                            series: fullCTe.series,
                            access_key: fullCTe.access_key,
                            issue_date: fullCTe.issue_date,
                            valor: fullCTe.total_value,
                            carrier_cnpj: fullCTe.carrier?.cnpj,
                            carrier_cardcode: fullCTe.carrier?.sap_cardcode,
                            carrier_sap_due_days: fullCTe.carrier?.sap_due_days,
                            item_service_code: sapConfig.billing_nfe_item,
                            xml: fullCTe.xml_data?.original
                          },
                          sap_bpl_id: (fullCTe.carrier as any)?.sap_bpl_id || sapConfig.sap_bpl_id,
                          organization_id: user?.organization_id,
                          cte_tax_code: sapConfig.cte_tax_code,
                          cte_usage: sapConfig.cte_usage,
                          cte_model: sapConfig.cte_model,
                          cte_integration_type: sapConfig.cte_integration_type,
                          fiscal_module: sapConfig.fiscal_module
                        };

                        // Enviar para integração SAP
                        
                        const integrationResult = await sapIntegrationService.integrateCTe(integrationPayload);

                        if (integrationResult.success) {
                          // Atualizar o registro com os IDs do SAP usando o serviço completo
                          await ctesCompleteService.update(cteId.toString(), { 
                            sap_doc_entry: integrationResult.sap_doc_entry || (integrationResult as any).docEntry,
                            sap_doc_num: integrationResult.sap_doc_num || (integrationResult as any).docNum,
                            sap_integration_type: sapConfig.cte_integration_type,
                            status: 'auditado_aprovado'
                          });

                          sapCount++;
                          await userActivitiesService.logActivity(
                            'CT-es',
                            'Integração SAP',
                            `CT-e ${fullCTe.number} aprovado e integrado ao SAP (DocEntry: ${integrationResult.sap_doc_entry})`
                          );
                        } else {
                          sapErrorCount++;
                        }
                      } catch (sapErr) {
                        sapErrorCount++;
                      }
                  }

                } catch (error) {
                  errorCount++;
                }
              }

              await refreshData();
              setSelectedCTes([]);
              
              if (errorCount === 0 && sapErrorCount === 0) {
                setToast({ message: `${successCount} CT-e(s) aprovado(s) e integrado(s) com sucesso!`, type: 'success' });
              } else {
                setToast({ 
                  message: `Aprovação: ${successCount} sucesso(s), ${errorCount} erro(s). SAP: ${sapCount} integrado(s), ${sapErrorCount} falha(s).`, 
                  type: 'warning' 
                });
              }
            } catch (error) {
              setToast({ message: `Erro geral ao aprovar: ${error}`, type: 'error' });
            } finally {
              setIsLoading(false);
            }
          })();
          return;
          
        case 'reject':
          (async () => {
            try {
               let successCount = 0;
               let errorCount = 0;
               for (const cteId of selectedCTes) {
                 try {
                   const { error: updateError } = await (supabase as any)
                    .from('ctes')
                    .update({ 
                      status: 'auditado_reprovado',
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', cteId);
                   if (updateError) throw updateError;
                   successCount++;
                 } catch (e) {
                   errorCount++;
                 }
               }
               await refreshData();
               setSelectedCTes([]);
               
               if (errorCount === 0) {
                 setToast({ message: `${successCount} CT-e(s) reprovado(s) com sucesso!`, type: 'success' });
               } else {
                 setToast({ message: `Reprovação: ${successCount} sucesso(s), ${errorCount} erro(s).`, type: 'warning' });
               }
            } catch (error) {
                 setToast({ message: `Erro ao reprovar: ${error}`, type: 'error' });
            } finally {
                 setIsLoading(false);
            }
          })();
          break;
        case 'revert':
          (async () => {
            setIsLoading(true);
            setToast({ message: 'Processando estorno em lote...', type: 'info' });
            try {
              let successCount = 0;
              let errorCount = 0;
              
              const sapConfig = await sapIntegrationService.getConfig();

              for (const cteId of selectedCTes) {
                try {
                  
                  // Validação de segurança suprema em Lote via Desmembramento
                  const { data: billCtes, error: checkError1 } = await (supabase as any)
                    .from('bill_ctes')
                    .select('bill_id')
                    .eq('cte_id', cteId.toString());
                    
                  if (checkError1) throw new Error(`Erro ao verificar vínculos do CT-e: ${checkError1.message}`);
                  
                  if (billCtes && billCtes.length > 0) {
                     const billIds = billCtes.map((bc: any) => bc.bill_id);
                     
                     const { data: linkedBills, error: checkError2 } = await (supabase as any)
                       .from('bills')
                       .select('status, bill_number')
                       .in('id', billIds);
                       
                     if (checkError2) throw new Error(`Erro ao verificar status das faturas: ${checkError2.message}`);
                     
                     
                     
                     const isApprovedBill = linkedBills?.find((b: any) => {
                       const billStatus = b.status?.toLowerCase();
                       return billStatus === 'auditada_aprovada' || billStatus === 'aprovada' || billStatus === 'auditada_reprovada' || billStatus === 'integrada';
                     });
                     
                     if (isApprovedBill) {
                       throw new Error(`CT-e ${fullCTe?.number || cteId} travado: Pertence à Fatura ${isApprovedBill.bill_number || ''} já integrada.`);
                     }
                  }

                  const fullCTe = await ctesCompleteService.getById(cteId.toString());
                  if (!fullCTe) throw new Error('CT-e não encontrado');


                  // Se houver integração SAP, tentar estornar no SAP primeiro
                  if (fullCTe.sap_doc_entry) {
                    const cancelPayload = {
                      ...sapConfig,
                      docEntry: fullCTe.sap_doc_entry,
                      isDraft: fullCTe.sap_integration_type?.toLowerCase().includes('esboço') || 
                               fullCTe.sap_integration_type?.toLowerCase().includes('draft')
                    };

                    const cancelResult = await sapIntegrationService.cancelCTe(cancelPayload);

                    if (!cancelResult.success) {
                      setToast({ 
                        message: `Atenção (CT-e ${fullCTe.number}): Estorno local concluído, mas o SAP retornou erro: ${cancelResult.error}`, 
                        type: 'warning' 
                      });
                    }
                  } else {
                  }

                  // Resetar status no banco local e limpar campos SAP usando o serviço completo
                  const { success: updateSuccess } = await ctesCompleteService.update(cteId.toString(), { 
                    status: 'importado',
                    sap_doc_entry: null,
                    sap_doc_num: null,
                    sap_integration_type: null
                  });

                  if (!updateSuccess) throw new Error('Erro ao atualizar status do CT-e');
                  successCount++;

                } catch (error: any) {
                  console.error(`[Storno Lote] Erro ao processar CT-e ${cteId}:`, error);
                  errorCount++;
                }
              }

              await refreshData();
              setSelectedCTes([]);

              if (errorCount === 0) {
                setToast({ 
                  message: `${successCount} CT-e(s) estornado(s) com sucesso!`, 
                  type: 'success' 
                });
              } else {
                setToast({ 
                  message: `Estorno concluído: ${successCount} sucesso(s), ${errorCount} erro(s). Verifique o console para detalhes.`, 
                  type: 'warning' 
                });
              }
            } catch (error) {
              console.error("[Storno Lote] Erro geral no estorno:", error);
              setToast({ message: 'Erro ao estornar CT-es em lote.', type: 'error' });
            } finally {
              setIsLoading(false);
            }
          })();
          return;
        case 'download':
          (async () => {
            try {
              let successCount = 0;
              let errorCount = 0;
              let notFoundCount = 0;

              if (selectedCTes.length === 1) {
                const cteId = selectedCTes[0];
                try {
                  const fullCTe = await ctesCompleteService.getById(cteId.toString());
                  if (fullCTe && fullCTe.xml_data && fullCTe.xml_data.original) {
                    const xmlContent = fullCTe.xml_data.original;
                    const fileName = `CTE_${fullCTe.access_key || fullCTe.number}_${fullCTe.series || '001'}.xml`;
                    const blob = new Blob([xmlContent], { type: 'application/xml' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    successCount++;
                  } else if (fullCTe) {
                    notFoundCount++;
// null
                  } else {
                    errorCount++;
                  }
                } catch (error) {
// null
                  errorCount++;
                }

                if (successCount > 0) {
                  setToast({ message: 'XML baixado com sucesso!', type: 'success' });
                } else if (notFoundCount > 0) {
                  setToast({ message: 'O CT-e selecionado não possui XML armazenado.', type: 'warning' });
                } else {
                  setToast({ message: 'Erro ao baixar XML. Tente novamente.', type: 'error' });
                }

              } else {
                const JSZip = (await import('jszip')).default;
                const zip = new JSZip();

                for (const cteId of selectedCTes) {
                  try {
                    const fullCTe = await ctesCompleteService.getById(cteId.toString());
                    if (fullCTe && fullCTe.xml_data && fullCTe.xml_data.original) {
                      const xmlContent = fullCTe.xml_data.original;
                      const fileName = `CTE_${fullCTe.access_key || fullCTe.number}_${fullCTe.series || '001'}.xml`;
                      zip.file(fileName, xmlContent);
                      successCount++;
                    } else if (fullCTe) {
                      notFoundCount++;
                    } else {
                      errorCount++;
                    }
                  } catch (error) {
// null
                    errorCount++;
                  }
                }

                if (successCount > 0) {
                  const content = await zip.generateAsync({ type: 'blob' });
                  const url = URL.createObjectURL(content);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `XMLs_CTes_${new Date().getTime()}.zip`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);

                  if (errorCount === 0 && notFoundCount === 0) {
                    setToast({ message: `Arquivo ZIP com ${successCount} XML(s) baixado com sucesso!`, type: 'success' });
                  } else {
                    const messages = [`${successCount} sucesso(s)`];
                    if (notFoundCount > 0) messages.push(`${notFoundCount} sem XML`);
                    if (errorCount > 0) messages.push(`${errorCount} erro(s)`);
                    setToast({ message: `Download concluído: ${messages.join(', ')} no arquivo ZIP.`, type: 'warning' });
                  }
                } else if (notFoundCount > 0) {
                  setToast({ message: 'Nenhum CT-e selecionado possui XML armazenado.', type: 'warning' });
                } else {
                  setToast({ message: 'Erro ao processar XMLs. Tente novamente.', type: 'error' });
                }
              }

              setIsLoading(false);
            } catch (error) {
// null
              setToast({ message: 'Erro ao baixar XMLs.', type: 'error' });
              setIsLoading(false);
            }
          })();
          return; // Retorna aqui para não executar setIsLoading(false) prematuramente

        default:
          break;
      }
      
      setIsLoading(false);
      // Clear selection after action
      setSelectedCTes([]);
    }, 1000);
  };

  const handleSingleAction = async (cteId: string, action: string) => {
    const cte = ctes.find(c => c.id.toString() === cteId.toString());

    if (!cte) {
      return;
    }

    if (action === 'view-tariff') {
      const tarifaId = cte.tarifaCalculoId;
      if (tarifaId) {
        loadTariffForEditing(tarifaId);
      } else {
        setToast({ message: 'Tarifa não encontrada para este CT-e.', type: 'warning' });
      }
      return;
    }

    if (action === 'view-nfes') {
      setIsLoading(true);
      try {
        const fullCTe = await ctesCompleteService.getById(cteId.toString());
        if (fullCTe) {
          setSelectedCTeForDetails(fullCTe);
          setShowDetailsModal(true);
        }
      } catch (error) {
// null
        setToast({ message: 'Erro ao carregar detalhes do CT-e.', type: 'error' });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (action === 'compare-values') {
      setIsLoading(true);
      try {
        const fullCTe = await ctesCompleteService.getById(cteId.toString());
        if (fullCTe) {
          setSelectedCTeForComparison(fullCTe);
          setShowComparisonModal(true);
        }
      } catch (error) {
// null
        setToast({ message: 'Erro ao carregar dados para comparação.', type: 'error' });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (action === 'relationship-map') {
      setSelectedCteForMap({
        id: `cte-${cte.id}`,
        type: 'cte',
        number: cte.numero,
        date: cte.dataEmissao,
        status: cte.status,
        value: cte.valorCTe
      });
      setShowRelationshipMap(true);
      return;
    }

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      switch (action) {
        case 'approve':
          (async () => {
            setIsLoading(true);
            setToast({ message: `Processando integração do CT-e...`, type: 'info' });
            try {
              const fullCTe = await ctesCompleteService.getById(cteId.toString());
              if (!fullCTe) throw new Error('CT-e não encontrado');

              const { error: updateError } = await (supabase as any)
                .from('ctes')
                .update({ 
                  status: 'auditado_aprovado',
                  updated_at: new Date().toISOString()
                })
                .eq('id', cteId);

              if (updateError) throw updateError;

              try {
                const sapConfig = await sapIntegrationService.getConfig();
                
                const integrationPayload = {
                  ...sapConfig,
                  cte_data: {
                    number: fullCTe.number,
                    series: fullCTe.series,
                    access_key: fullCTe.access_key,
                    issue_date: fullCTe.issue_date,
                    valor: fullCTe.total_value,
                    carrier_cnpj: fullCTe.carrier?.cnpj,
                    carrier_cardcode: fullCTe.carrier?.sap_cardcode,
                    carrier_sap_due_days: fullCTe.carrier?.sap_due_days,
                    item_service_code: sapConfig.billing_nfe_item,
                    xml: fullCTe.xml_data?.original
                  },
                  sap_bpl_id: fullCTe.carrier?.sap_bpl_id || sapConfig.sap_bpl_id,
                  organization_id: user?.organization_id,
                  cte_tax_code: sapConfig.cte_tax_code,
                  cte_usage: sapConfig.cte_usage,
                  cte_model: sapConfig.cte_model,
                  cte_integration_type: sapConfig.cte_integration_type,
                  fiscal_module: sapConfig.fiscal_module
                };

                const integrationResult = await sapIntegrationService.integrateCTe(integrationPayload);

                if (integrationResult.success) {
                  // Atualizar o registro com os IDs do SAP usando o serviço completo
                  await ctesCompleteService.update(cteId.toString(), { 
                    sap_doc_entry: integrationResult.sap_doc_entry || integrationResult.docEntry,
                    sap_doc_num: integrationResult.sap_doc_num || integrationResult.docNum,
                    sap_integration_type: sapConfig.cte_integration_type,
                    status: 'auditado_aprovado'
                  });

                  // Logar atividade e mostrar Toast
                  await userActivitiesService.logActivity(
                    'CT-es',
                    'Integração SAP',
                    `CT-e ${fullCTe.number} aprovado e integrado ao SAP (DocEntry: ${integrationResult.sap_doc_entry || integrationResult.docEntry})`
                  );

                  setToast({
                    message: `CT-e integrado ao SAP com sucesso! (DocEntry: ${integrationResult.sap_doc_entry || integrationResult.docEntry})`,
                    type: 'success'
                  });
                } else {
                  setToast({
                    message: `Aprovado no TMS, mas falhou no SAP: ${integrationResult.error}`,
                    type: 'warning'
                  });
                }
              } catch (sapErr: any) {
                setToast({
                  message: `Aprovado no TMS. Note: ${sapErr.message}`,
                  type: 'info'
                });
              }

              refreshData();
              setIsLoading(false);
            } catch (error: any) {
              setToast({ message: `Erro ao aprovar CT-e: ${error.message}`, type: 'error' });
              setIsLoading(false);
            }
          })();
          break;
        case 'revert':
          (async () => {
            setIsLoading(true);
            setToast({ message: `Processando estorno do CT-e...`, type: 'info' });
            try {
              
              // Validação de segurança suprema: Consulta DESMEMBRADA para evadir RLS em JOINS
              const { data: billCtes, error: checkError1 } = await (supabase as any)
                .from('bill_ctes')
                .select('bill_id')
                .eq('cte_id', cteId.toString());
                
              if (checkError1) throw new Error(`Erro ao verificar vínculos do CT-e: ${checkError1.message}`);
              
              if (billCtes && billCtes.length > 0) {
                 const billIds = billCtes.map((bc: any) => bc.bill_id);
                 
                 const { data: linkedBills, error: checkError2 } = await (supabase as any)
                   .from('bills')
                   .select('status, bill_number')
                   .in('id', billIds);
                   
                 if (checkError2) throw new Error(`Erro ao verificar status das faturas: ${checkError2.message}`);
                 
                 
                   
                 const isApprovedBill = linkedBills?.find((b: any) => {
                   const billStatus = b.status?.toLowerCase();
                   return billStatus === 'auditada_aprovada' || billStatus === 'aprovada' || billStatus === 'auditada_reprovada' || billStatus === 'integrada';
                 });
                 
                 if (isApprovedBill) {
                   throw new Error(`O CT-e pertence à Fatura ${isApprovedBill.bill_number || ''} que já está Integrada/Aprovada. Não é permitido estornar a origem se o C/P já existe no SAP.`);
                 }
              }

              const fullCTe = await ctesCompleteService.getById(cteId.toString());
              if (!fullCTe) throw new Error('CT-e não encontrado');


              const sapConfig = await sapIntegrationService.getConfig();

              // Se houver integração SAP, tentar estornar no SAP primeiro
              if (fullCTe.sap_doc_entry) {
                const cancelPayload = {
                  ...sapConfig,
                  docEntry: fullCTe.sap_doc_entry,
                  isDraft: fullCTe.sap_integration_type?.toLowerCase().includes('esboço') || 
                           fullCTe.sap_integration_type?.toLowerCase().includes('draft')
                };

                const cancelResult = await sapIntegrationService.cancelCTe(cancelPayload);

                if (!cancelResult.success) {
                  setToast({ 
                    message: `Atenção: Estorno local concluído, mas o SAP retornou erro: ${cancelResult.error}`, 
                    type: 'warning' 
                  });
                }
              } else {
              }

              // Resetar status no banco local e limpar campos SAP usando o serviço completo
              const { success: updateSuccess } = await ctesCompleteService.update(cteId.toString(), { 
                status: 'importado',
                sap_doc_entry: null,
                sap_doc_num: null,
                sap_integration_type: null
              });

              if (!updateSuccess) throw new Error('Erro ao atualizar status local');

              setToast({ message: 'CT-e estornado com sucesso!', type: 'success' });
              refreshData();
            } catch (error: any) {
              setToast({ message: `Erro ao estornar CT-e: ${error.message}`, type: 'error' });
            } finally {
              setIsLoading(false);
            }
          })();
          break;
        case 'print':
          (async () => {
             // Handle single-action print essentially like a bulk of 1
             const prevSelected = [...selectedCTes];
             setSelectedCTes([cteId.toString()]);
             setTimeout(() => handleBulkAction('print'), 50);
             setTimeout(() => setSelectedCTes(prevSelected), 1000);
          })();
          break;

        case 'recalculate':
          (async () => {
            try {
              const fullCTe = await ctesCompleteService.getById(cteId.toString());
              if (fullCTe) {
                const calculation = await freightCostCalculator.calculateCTeCost(fullCTe);
                await freightCostCalculator.saveCostsToCTe(cteId.toString(), calculation);

                // Recarregar dados
                await refreshData();
                setToast({ message: `CT-e ${cte.numero} recalculado com sucesso! Valor Total: R$ ${calculation.valorTotal.toFixed(2)}`, type: 'success' });
              }
            } catch (error) {
// null
              setToast({ message: `Erro ao recalcular CT-e: ${error instanceof Error ? error.message : 'Erro desconhecido'}.`, type: 'error' });
            }
          })();
          break;
        case 'reject':
          // Se houver divergência de valor (Vermelho), redirecionar para o relatório detalhado
          const diffAmount = cte.valorCTe - cte.valorCusto;
          const maxVal = Number(cte.tolerancia_valor_cte || 0);
          const maxPct = Number(cte.tolerancia_percentual_cte || 0);
          
          setSelectedCTeForReject(cte);
          setShowRejectModal(true);
          break;
        case 'download':
          (async () => {
            try {
              const fullCTe = await ctesCompleteService.getById(cteId.toString());

              if (fullCTe) {
                // Verificar se existe XML
                if (fullCTe.xml_data && fullCTe.xml_data.original) {
                  const xmlContent = fullCTe.xml_data.original;
                  const fileName = `CTE_${fullCTe.access_key || fullCTe.number}_${fullCTe.series || '001'}.xml`;

                  // Criar blob e fazer download
                  const blob = new Blob([xmlContent], { type: 'application/xml' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = fileName;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);

                  setToast({
                    message: `XML do CT-e ${cte.numero} baixado com sucesso!`,
                    type: 'success'
                  });
                } else {
                  setToast({
                    message: `CT-e ${cte.numero} não possui XML armazenado.`,
                    type: 'warning'
                  });
                }
              } else {
                setToast({
                  message: `CT-e ${cte.numero} não encontrado.`,
                  type: 'error'
                });
              }
              setIsLoading(false);
            } catch (error) {
// null
              setToast({ message: 'Erro ao baixar XML.', type: 'error' });
              setIsLoading(false);
            }
          })();
          return; // Retorna aqui para não executar setIsLoading(false) prematuramente
        case 'delete':
          setConfirmDialog({
            isOpen: true,
            cteId: cteId.toString(),
            cteNumber: cte.numero,
            action: 'delete'
          });
          setIsLoading(false);
          return;
        default:
          break;
      }

      setIsLoading(false);
    }, 500);
  };

  const confirmDelete = async () => {
    if (confirmDialog.cteId && confirmDialog.cteNumber) {
      try {
        const result = await ctesCompleteService.delete(confirmDialog.cteId);
        if (result.success) {
          setToast({ message: `CT-e ${confirmDialog.cteNumber} excluído com sucesso!`, type: 'success' });
          refreshData();
        } else {
          setToast({ message: `Erro ao excluir CT-e: ${result.error}`, type: 'error' });
        }
      } catch (error) {
// null
        setToast({ message: 'Erro ao excluir CT-e.', type: 'error' });
      }
    }
    setConfirmDialog({ isOpen: false });
  };

  const openDivergenceReport = async (cteId: string, passedRejectionReason?: string) => {    setIsLoading(true);    try {      const fullCTe = await ctesCompleteService.getById(cteId);      if (!fullCTe) {        setToast({ message: 'CT-e não encontrado.', type: 'error' });        setIsLoading(false);        return;      }      if (!fullCTe.carrier_id) {        setToast({ message: 'CT-e sem transportador associado. Não é possível gerar o relatório.', type: 'error' });        setIsLoading(false);        return;      }      const getPersistCost = (key: string) => {
          return parseFloat(fullCTe.carrier_costs?.find((c: any) => c.cost_type === key)?.cost_value?.toString() || '0');
      };
      
      const calculation: any = {
          fretePeso: getPersistCost('freight_weight'),
          freteValor: getPersistCost('freight_value'),
          gris: getPersistCost('gris'),
          pedagio: getPersistCost('toll'),
          tas: getPersistCost('tas'),
          seccat: getPersistCost('seccat'),
          despacho: getPersistCost('dispatch'),
          itr: getPersistCost('itr'),
          coletaEntrega: getPersistCost('collection_delivery'),
          icmsValor: getPersistCost('icms_value'),
          outrosValores: getPersistCost('other_value')
      };      const costMapping = [
        { key: 'fretePeso', xmlField: 'freight_weight_value', name: 'Frete Peso' },
        { key: 'freteValor', xmlField: 'freight_value_value', name: 'Frete Valor' },
        { key: 'gris', xmlField: 'ademe_gris_value', name: 'GRIS' },
        { key: 'pedagio', xmlField: 'toll_value', name: 'Pedágio' },
        { key: 'tas', xmlField: 'tas_value', name: 'TAS' },
        { key: 'seccat', xmlField: 'seccat_value', name: 'SECCAT' },
        { key: 'despacho', xmlField: 'dispatch_value', name: 'Despacho' },
        { key: 'itr', xmlField: 'itr_value', name: 'ITR' },
        { key: 'coletaEntrega', xmlField: 'collection_delivery_value', name: 'Coleta/Entrega' },
        { key: 'icmsValor', xmlField: 'icms_value', name: 'ICMS' },
        { key: 'outrosValores', xmlField: 'other_value', name: 'Outros Valores' }
      ];
      
      const comparisonData = costMapping.map(cost => {
        const tmsValue = calculation[cost.key] || 0;
        const cteValueRaw = fullCTe[cost.xmlField];
        const cteValue = cteValueRaw ? parseFloat(cteValueRaw.toString()) : 0;
        
        const difference = cteValue - tmsValue;
        const percentDifference = tmsValue !== 0 ? (difference / tmsValue) * 100 : 0;
        
        let formula = 'Cálculo padrão';
        let baseValue = 0;
        let rate = 0;
        
        if (cost.key === 'gris') {
          const totalMercadoria = fullCTe.invoices?.reduce((sum, inv) => 
            sum + parseFloat(inv.valor_nota?.toString() || '0'), 0
          ) || 0;
          formula = 'Valor da Mercadoria x % GRIS';
          baseValue = totalMercadoria;
          rate = fullCTe.carrier_costs?.find((c: any) => c.cost_type === "gris_percentage")?.cost_value || 0;
        } else if (cost.key === 'icmsValor') {
          formula = 'Base ICMS x Alíquota';
          baseValue = parseFloat(fullCTe.carrier_costs?.find((c: any) => c.cost_type === "icms_base")?.cost_value?.toString() || "0");
          rate = parseFloat(fullCTe.carrier_costs?.find((c: any) => c.cost_type === "icms_rate")?.cost_value?.toString() || "0");
        }

        return {
          taxName: cost.name,
          tmsValue,
          cteValue,
          difference,
          percentDifference,
          status: Math.abs(difference) < 0.01 ? 'correct' : 'divergent',
          calculation: {
            formula,
            baseValue,
            rate,
            result: tmsValue
          }
        };
      }).filter(item => item.tmsValue > 0 || item.cteValue > 0);      const reportData: DivergenceReportData = {        cteId: fullCTe.id,        cteNumber: fullCTe.number,        serie: fullCTe.series || '',        chave: fullCTe.access_key || '',        carrierId: fullCTe.carrier_id || '',        carrierName: fullCTe.carrier?.razao_social || '',        carrierCnpj: fullCTe.carrier?.cnpj || '',        carrierEmail: fullCTe.carrier?.email,        carrierPhone: fullCTe.carrier?.telefone,        emissionDate: fullCTe.issue_date || '',        totalValue: parseFloat(fullCTe.total_value.toString()),
        tmsTotalValue: parseFloat(fullCTe.carrier_costs?.find((c: any) => c.cost_type === 'total_value')?.cost_value?.toString() || '0'),
        status: fullCTe.status,        comparisonData, rejectionReason: passedRejectionReason     };      setDivergenceReportData(reportData);      setShowReportDivergenceModal(true);    } catch (error: any) {      const errorMessage = error?.message || 'Erro ao preparar relatório de divergência.';      setToast({ message: errorMessage, type: 'error' });    } finally {      setIsLoading(false);    }  };
    const handleRejectConfirm = async (reasonId: number, observation: string, reasonDescription?: string) => {
    if (!selectedCTeForReject) return;
    
    setIsLoading(true);
    let promptReport = false;
    let rejectedId = selectedCTeForReject.id.toString();
    let rejectedNumber = selectedCTeForReject.numero;

    try {
      const result = await ctesCompleteService.update(rejectedId, {
        status: 'Auditado e reprovado'
      });
      
      if (result.success) {
        setToast({ message: `CT-e ${rejectedNumber} reprovado com sucesso!`, type: 'success' });
        await refreshData();
        promptReport = true;
      } else {
        setToast({ message: `Erro ao reprovar CT-e: ${result.error}`, type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Erro ao reprovar CT-e.', type: 'error' });
    } finally {
      setIsLoading(false);
      setShowRejectModal(false);
      setSelectedCTeForReject(null);
    }

    if (promptReport) {
      setTimeout(() => {
        setConfirmDialog({
           isOpen: true,
           cteId: rejectedId,
           cteNumber: rejectedNumber,
           action: 'report_divergence_prompt',
             rejectionReason: reasonDescription,
           title: 'CT-e Reprovado',
           message: `Motivo: ${reasonDescription || 'Divergência identificada'}.\n\nDeseja reportar essa divergência ao transportador agora?`,
           confirmText: 'Sim, Reportar',
           cancelText: 'Não, Apenas Reprovar',
           type: 'info'
        });
      }, 50);
    }
  };

  if (showForm) {
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
      <CTeForm
        onBack={() => setShowForm(false)}
        onSave={handleSaveCTe}
        establishmentId={currentEstablishment.id}
          establishmentCnpj={currentEstablishment.cnpj}
          establishmentName={currentEstablishment.name}
          logoBase64={(authEstablishment as any)?.metadata?.logo_light_base64 || (authEstablishment as any)?.logo_light_base64 || (authEstablishment as any)?.logo_url || (authEstablishment as any)?.metadata?.logo_url}
      />
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
          <span className="font-medium">Debug Auto-Import</span>
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">CT-es</h1>
          <p className="text-gray-600 dark:text-gray-400">Visualize, audite e gerencie todos os CT-es importados no sistema</p>
        </div>
        <div className="flex items-center space-x-3">

          <button
            onClick={() => setShowForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus size={20} />
            <span>Inserir CT-e</span>
          </button>
          <button
            onClick={() => setShowBulkXmlUploadModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Upload size={20} />
            <span>Inserir XML em Lote</span>
          </button>
          <button
            onClick={refreshData}
            disabled={isLoading}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
            <span>{isLoading ? 'Carregando...' : 'Atualizar'}</span>
          </button>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total CT-es */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de CT-es</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{ctes.length}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
              <FileCheck size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        {/* Importados */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Importados</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
                {ctes.filter(cte => cte.status === 'Importado').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
              <Clock size={20} className="text-gray-500 dark:text-gray-400" />
            </div>
          </div>
        </div>

        {/* Auditados e Aprovados */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Auditados e Aprovados</p>
              <p className="text-2xl font-semibold text-green-600 dark:text-green-500 mt-1">
                {ctes.filter(cte => cte.status === 'Auditado e aprovado').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
              <CheckCircle size={20} className="text-green-600 dark:text-green-500" />
            </div>
          </div>
        </div>

        {/* Auditados e Reprovados */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Auditados e Reprovados</p>
              <p className="text-2xl font-semibold text-orange-600 dark:text-orange-500 mt-1">
                {ctes.filter(cte => cte.status === 'Auditado e reprovado').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-orange-600 dark:bg-orange-700 rounded-lg flex items-center justify-center">
              <XCircle size={20} className="text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Com NF-e Referenciada</p>
              <p className="text-2xl font-semibold text-indigo-600 dark:text-indigo-500 mt-1">
                {ctes.filter(cte => cte.status === 'Com NF-e Referenciada').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-indigo-600 dark:bg-indigo-700 rounded-lg flex items-center justify-center">
              <FileText size={20} className="text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Cancelados</p>
              <p className="text-2xl font-semibold text-red-600 dark:text-red-500 mt-1">
                {ctes.filter(cte => cte.status === 'Cancelado').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-red-600 dark:bg-red-700 rounded-lg flex items-center justify-center">
              <AlertCircle size={20} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <CTesFilters 
        onFilterChange={handleFilterChange} 
        filters={filters}
      />

      {/* Bulk Actions */}
      <CTesActions 
        selectedCount={selectedCTes.length}
        onAction={handleBulkAction}
        isLoading={isLoading}
        hasApproved={filteredCTes.some(c => selectedCTes.includes(c.id) && (c.status?.toLowerCase() === 'aprovado' || c.status?.toLowerCase() === 'auditado e aprovado'))}
        allApproved={selectedCTes.length > 0 && filteredCTes.filter(c => selectedCTes.includes(c.id)).every(c => c.status?.toLowerCase() === 'aprovado' || c.status?.toLowerCase() === 'auditado e aprovado')}
      />

      {/* CT-es Table */}
      <CTesTable
        ctes={filteredCTes}
        selectedCTes={selectedCTes}
        onSelectAll={handleSelectAll}
        onSelectCTe={handleSelectCTe}
        onAction={handleSingleAction}
        isLoading={isLoading}
      />

      {/* No Results */}
      {filteredCTes.length === 0 && !isLoading && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <FileText size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhum CT-e encontrado</h3>
          <p className="text-gray-600 dark:text-gray-400">Tente ajustar os filtros ou importar novos CT-es.</p>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl flex items-center space-x-4">
            <RefreshCw size={24} className="text-blue-600 animate-spin" />
            <p className="text-gray-800 dark:text-gray-200 font-medium">Processando...</p>
          </div>
        </div>
      )}

      {/* CT-e Details Modal */}
      <CTeDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedCTeForDetails(null);
        }}
        cte={selectedCTeForDetails}
      />

      {showRelationshipMap && selectedCteForMap && (
        <RelationshipMapModal
          isOpen={showRelationshipMap}
          onClose={() => setShowRelationshipMap(false)}
          sourceDocument={selectedCteForMap}
        />
      )}

      {/* CT-e Values Comparison Modal */}
      {showComparisonModal && selectedCTeForComparison && (
        <CTeValuesComparisonModal
          cte={selectedCTeForComparison}
          onClose={() => {
            setShowComparisonModal(false);
            setSelectedCTeForComparison(null);
          }}
          onApproveDivergence={(cteId) => {
            setShowComparisonModal(false);
            setSelectedCTeForComparison(null);
            handleSingleAction(cteId, 'approve');
          }}
          onBlockDivergence={(cteId) => {
            setShowComparisonModal(false);
            setSelectedCTeForComparison(null);
            // Select the CT-e and fire the bulk action that triggers the report UI
            setSelectedCTes([cteId] as any);
            handleBulkAction('reportDivergence');
          }}
        />
      )}

      {/* Report Divergence Modal */}
      {showReportDivergenceModal && divergenceReportData && currentEstablishment && user && (
        <ReportDivergenceModal
          isOpen={showReportDivergenceModal}
          onClose={() => {
            setShowReportDivergenceModal(false);
            setDivergenceReportData(null);
          }}
          cteData={divergenceReportData}
          establishmentId={currentEstablishment.id}
          establishmentCnpj={currentEstablishment.cnpj}
          establishmentName={currentEstablishment.name}
          logoBase64={(currentEstablishment as any).metadata?.logo_light_base64 || (currentEstablishment as any).logo_light_base64 || (currentEstablishment as any).logo_url || (currentEstablishment as any).metadata?.logo_light_url || (currentEstablishment as any).metadata?.logo_url}
          userId={user.id.toString()}
          onStatusUpdated={refreshData}
        />
      )}

      {/* Freight Rate Values Form */}
      {showTariffModal && selectedTariff && (
        <FreightRateValuesForm
          rate={selectedTariff}
          onSave={handleSaveTariff}
          onCancel={() => {
            setShowTariffModal(false);
            setSelectedTariff(null);
            setSelectedTariffId(null);
          }}
        />
      )}

      {/* DACTE Preview Modal */}
      {showDacteModal && selectedCTeForDacte && (
        <DactePreview
          document={selectedCTeForDacte}
          onClose={() => {
            setShowDacteModal(false);
            setSelectedCTeForDacte(null);
          }}
        />
      )}

      {/* Bulk XML Upload Modal */}
      {showBulkXmlUploadModal && currentEstablishment && (
        <BulkCTeXmlUploadModal
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
      {confirmDialog.isOpen && confirmDialog.cteNumber && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title || "Confirmar Exclusão"}
          message={confirmDialog.message || `Tem certeza que deseja excluir o CT-e ${confirmDialog.cteNumber}? Esta ação não pode ser desfeita.`}
          onConfirm={confirmDialog.action === 'report_divergence_prompt' ? 
            () => {
              setConfirmDialog({ isOpen: false });
              if (confirmDialog.cteId) {
                openDivergenceReport(confirmDialog.cteId, confirmDialog.rejectionReason);
              }
            } : confirmDelete}
          confirmText={confirmDialog.confirmText}
          cancelText={confirmDialog.cancelText}
          type={confirmDialog.type}
          onCancel={() => setConfirmDialog({ isOpen: false })}
        />
      )}

      <CTesRejectModal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setSelectedCTeForReject(null);
        }}
        onConfirm={handleRejectConfirm}
        cteNumber={selectedCTeForReject?.numero || ''}
      />
    </div>
  );
};
