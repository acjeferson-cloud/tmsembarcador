import React, { useState, useEffect } from 'react';
import Breadcrumbs from '../Layout/Breadcrumbs';
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
import { useAuth } from '../../hooks/useAuth';
import { freightCostCalculator } from '../../services/freightCostCalculator';
import { freightRatesService, FreightRate } from '../../services/freightRatesService';
import { Toast, ToastType } from '../common/Toast';
import { ConfirmDialog } from '../common/ConfirmDialog';
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
  // A Base ICMS sempre contém o valor total COM ICMS
  // (independente de ser embutido ou não)
  const valorCustoCalculado = cte.carrier_costs && cte.carrier_costs.length > 0
    ? parseFloat(cte.carrier_costs.find(c => c.cost_type === 'icms_base')?.cost_value.toString() || '0')
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
    cliente: cte.recipient_name || cte.sender_name || '',
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
// console.error('Erro extraindo dados do XML para DACTE', e);
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
  const { user } = useAuth();
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
  const [currentEstablishment, setCurrentEstablishment] = useState<{id: string, name: string} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    cteId?: string;
    cteNumber?: string;
    action?: string;
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

  useEffect(() => {
    const loadData = async () => {
      try {
        const establishments = await establishmentsService.getAll();
        if (establishments.length > 0) {
          const first = establishments[0];
          setCurrentEstablishment({
            id: first.id,
            name: `${first.codigo} - ${first.razao_social}`
          });
        }
      } catch (error) {
// console.error('Erro ao carregar estabelecimento:', error);
      }
    };

    loadData();
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
// console.error('Erro ao carregar CT-es:', error);

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
// console.error('Erro ao carregar tarifa:', error);
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
// console.error('Erro ao salvar tarifa:', error);
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
              if (selectedCTes.length === 1) {
                const firstCTeId = selectedCTes[0];
                const fullCTe = await ctesCompleteService.getById(firstCTeId.toString());

                if (fullCTe) {
                  const electronicDoc = convertCTeToElectronicDocument(fullCTe);
                  setSelectedCTeForDacte(electronicDoc);
                  setShowDacteModal(true);
                } else {
                  setToast({ message: 'Erro ao carregar dados do CT-e para impressão.', type: 'error' });
                }
                setIsLoading(false);
              } else {
                const ctesData = [];
                for (const cid of selectedCTes) {
                   const fcte = await ctesCompleteService.getById(cid.toString());
                   if (fcte) ctesData.push(fcte);
                }
                
                if (ctesData.length > 0) {
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      const firstDocHtml = getDacteHtml(convertCTeToElectronicDocument(ctesData[0]));
                      let originalStyles = '';
                      const styleStart = firstDocHtml.indexOf('<style>');
                      const styleEnd = firstDocHtml.indexOf('</style>');
                      if (styleStart !== -1 && styleEnd !== -1) {
                        originalStyles = firstDocHtml.substring(styleStart + 7, styleEnd);
                      }

                      let fullHtml = `<html><head><style>${originalStyles}\\n@page{size: A4 portrait; margin: 10mm;}</style></head><body>`;
                      
                      ctesData.forEach((cte, index) => {
                        const doc = convertCTeToElectronicDocument(cte);
                        const html = getDacteHtml(doc);
                        let innerHtml = html;
                        const bodyStart = html.indexOf('<body>');
                        const bodyEnd = html.indexOf('</body>');
                        if (bodyStart !== -1 && bodyEnd !== -1) {
                          innerHtml = html.substring(bodyStart + 6, bodyEnd);
                        }
                        
                        const pageBreakStyle = index < ctesData.length - 1 ? 'break-after: page; page-break-after: always;' : '';
                        fullHtml += `<div style="${pageBreakStyle}">${innerHtml}</div>`;
                      });
                      fullHtml += '</body></html>';
                      
                      printWindow.document.write(fullHtml);
                      printWindow.document.close();
                      setTimeout(() => { printWindow.print(); }, 500);
                      setToast({ message: `DACTE gerado para ${selectedCTes.length} CT-e(s).`, type: 'success' });
                    }
                }
                setIsLoading(false);
              }
            } catch (error) {
// console.error('Erro ao preparar DACTE:', error);
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
// console.error(`Erro ao recalcular CT-e ${cteId}:`, error);
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
// console.error('Erro ao recalcular CT-es:', error);
              setToast({ message: 'Erro ao recalcular CT-es em lote.', type: 'error' });
            }
          })();
          break;
        case 'approve':
        case 'reject':
          setToast({ 
            message: `${selectedCTes.length} CT-e(s) ${action === 'approve' ? 'aprovado(s)' : 'reprovado(s)'} com sucesso!`, 
            type: 'success' 
          });
          
          let aprovadosCounter = 0;
          let reprovadosCounter = 0;

          // Update local state
          setCTes(prev => prev.map(cte => {
            if (selectedCTes.includes(cte.id)) {
              if (action === 'approve') {
                 aprovadosCounter++;
                 return { ...cte, status: 'Auditado e aprovado' };
              }
              if (action === 'reject') {
                 reprovadosCounter++;
                 return { ...cte, status: 'Auditado e reprovado' };
              }
            }
            return cte;
          }));
          
          if (aprovadosCounter > 0) {
            userActivitiesService.logActivity('CT-es', 'aprovacao', `Aprovação de ${aprovadosCounter} ${aprovadosCounter > 1 ? 'conhecimentos de transporte' : 'conhecimento de transporte'}`);
          }
          if (reprovadosCounter > 0) {
            userActivitiesService.logActivity('CT-es', 'reprovacao', `Reprovação de ${reprovadosCounter} ${reprovadosCounter > 1 ? 'conhecimentos de transporte' : 'conhecimento de transporte'}`);
          }

          setSelectedCTes([]);
          break;
        case 'revert':
          setToast({ message: `${selectedCTes.length} CT-e(s) estornado(s) com sucesso!`, type: 'success' });
          // Update CT-es status in the mock data
          setCTes(prev => prev.map(cte =>
            selectedCTes.includes(cte.id)
              ? { ...cte, status: 'somente_importado', dataAprovacao: null }
              : cte
          ));
          break;
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
// console.warn(`CT-e ${fullCTe.number} não possui XML armazenado`);
                  } else {
                    errorCount++;
                  }
                } catch (error) {
// console.error(`Erro ao baixar XML do CT-e ${cteId}:`, error);
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
// console.error(`Erro ao processar XML do CT-e ${cteId}:`, error);
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
// console.error('Erro ao baixar XMLs:', error);
              setToast({ message: 'Erro ao baixar XMLs.', type: 'error' });
              setIsLoading(false);
            }
          })();
          return; // Retorna aqui para não executar setIsLoading(false) prematuramente
        case 'reportDivergence':
          if (selectedCTes.length !== 1) {
            setToast({ message: 'Selecione apenas um CT-e para reportar divergência.', type: 'warning' });
            setIsLoading(false);
            return;
          }

          (async () => {
            try {
              const cteId = selectedCTes[0];
              const fullCTe = await ctesCompleteService.getById(cteId);

              if (!fullCTe) {
                setToast({ message: 'CT-e não encontrado.', type: 'error' });
                setIsLoading(false);
                return;
              }

              if (!fullCTe.carrier_id) {
                setToast({ message: 'CT-e sem transportador associado. Não é possível gerar o relatório.', type: 'error' });
                setIsLoading(false);
                return;
              }

              let calculation;
              try {
                calculation = await freightCostCalculator.calculateCTeCost(fullCTe);
              } catch (calcError: any) {
                const errorMsg = calcError?.message || 'Erro no cálculo de custos';
                setToast({
                  message: `Não foi possível calcular custos: ${errorMsg}`,
                  type: 'warning'
                });
                setIsLoading(false);
                return;
              }

              const costMapping = [
                { key: 'fretePeso', code: 'FRETE_PESO', name: 'Frete Peso' },
                { key: 'freteValor', code: 'FRETE_VALOR', name: 'Frete Valor' },
                { key: 'gris', code: 'GRIS', name: 'GRIS' },
                { key: 'pedagio', code: 'PEDAGIO', name: 'Pedágio' },
                { key: 'tas', code: 'TAS', name: 'TAS' },
                { key: 'seccat', code: 'SECCAT', name: 'SECCAT' },
                { key: 'despacho', code: 'DESPACHO', name: 'Despacho' },
                { key: 'itr', code: 'ITR', name: 'ITR' },
                { key: 'coletaEntrega', code: 'COLETA_ENTREGA', name: 'Coleta/Entrega' },
                { key: 'icmsValor', code: 'ICMS', name: 'ICMS' },
                { key: 'outrosValores', code: 'OUTROS', name: 'Outros Valores' }
              ];

              const comparisonData = costMapping.map(cost => {
                const tmsValue = calculation[cost.key as keyof typeof calculation] as number || 0;
                const cteCost = fullCTe.carrier_costs?.find(cc =>
                  cc.cost_type_code === cost.code
                );
                const cteValue = cteCost ? parseFloat(cteCost.cost_value.toString()) : 0;
                const difference = cteValue - tmsValue;
                const percentDifference = tmsValue !== 0 ? (difference / tmsValue) * 100 : 0;

                let formula = 'Cálculo padrão';
                let baseValue = 0;
                let rate = 0;

                if (cost.code === 'GRIS') {
                  const totalMercadoria = fullCTe.invoices?.reduce((sum, inv) =>
                    sum + parseFloat(inv.valor_nota?.toString() || '0'), 0
                  ) || 0;
                  formula = 'Valor da Mercadoria × % GRIS';
                  baseValue = totalMercadoria;
                  rate = calculation.tarifaUtilizada?.gris_percentage || 0;
                } else if (cost.code === 'ICMS') {
                  formula = 'Base ICMS × Alíquota';
                  baseValue = calculation.icmsBase || 0;
                  rate = calculation.icmsAliquota || 0;
                }

                return {
                  taxName: cost.name,
                  tmsValue,
                  cteValue,
                  difference,
                  percentDifference,
                  status: Math.abs(difference) < 0.01 ? 'correct' as const : 'divergent' as const,
                  calculation: {
                    formula,
                    baseValue,
                    rate,
                    result: tmsValue
                  }
                };
              }).filter(item => item.tmsValue > 0 || item.cteValue > 0);

              const reportData: DivergenceReportData = {
                cteId: fullCTe.id,
                cteNumber: fullCTe.number,
                serie: fullCTe.series || '',
                chave: fullCTe.access_key || '',
                carrierId: fullCTe.carrier_id || '',
                carrierName: fullCTe.carrier?.razao_social || '',
                carrierCnpj: fullCTe.carrier?.cnpj || '',
                carrierEmail: fullCTe.carrier?.email,
                carrierPhone: fullCTe.carrier?.telefone,
                emissionDate: fullCTe.issue_date || '',
                totalValue: parseFloat(fullCTe.total_value.toString()),
                status: fullCTe.status,
                comparisonData
              };

              setDivergenceReportData(reportData);
              setShowReportDivergenceModal(true);
              setIsLoading(false);
            } catch (error: any) {
// console.error('Erro ao preparar relatório de divergência:', error);
              const errorMessage = error?.message || 'Erro ao preparar relatório de divergência.';
              setToast({ message: errorMessage, type: 'error' });
              setIsLoading(false);
            }
          })();
          return;
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
// console.error('Erro ao carregar detalhes do CT-e:', error);
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
// console.error('Erro ao carregar CT-e para comparação:', error);
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
        case 'print':
          setToast({ message: `DACTE gerado para o CT-e ${cte.numero}.`, type: 'success' });
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
// console.error('Erro ao recalcular CT-e:', error);
              setToast({ message: `Erro ao recalcular CT-e: ${error instanceof Error ? error.message : 'Erro desconhecido'}.`, type: 'error' });
            }
          })();
          break;
        case 'approve':
          (async () => {
             try {
               const result = await ctesCompleteService.update(cteId.toString(), { 
                 status: 'Auditado e aprovado'
               });
               if (result.success) {
                 setToast({ message: `CT-e ${cte.numero} aprovado com sucesso!`, type: 'success' });
                 await refreshData();
               } else {
                 setToast({ message: `Erro ao aprovar CT-e: ${result.error}`, type: 'error' });
               }
             } catch (error) {
               setToast({ message: 'Erro ao aprovar CT-e.', type: 'error' });
             }
          })();
          break;
        case 'reject':
          setSelectedCTeForReject(cte);
          setShowRejectModal(true);
          break;
        case 'revert':
          (async () => {
             try {
               const result = await ctesCompleteService.update(cteId.toString(), { 
                 status: 'Importado'
               });
               if (result.success) {
                 setToast({ message: `CT-e ${cte.numero} estornado com sucesso!`, type: 'success' });
                 await refreshData();
               } else {
                 setToast({ message: `Erro ao estornar CT-e: ${result.error}`, type: 'error' });
               }
             } catch (error) {
               setToast({ message: 'Erro ao estornar CT-e.', type: 'error' });
             }
          })();
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
// console.error('Erro ao baixar XML:', error);
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
// console.error('Erro ao excluir CT-e:', error);
        setToast({ message: 'Erro ao excluir CT-e.', type: 'error' });
      }
    }
    setConfirmDialog({ isOpen: false });
  };

  const handleRejectConfirm = async (reasonId: number, observation: string) => {
    if (!selectedCTeForReject) return;
    
    setIsLoading(true);
    try {
      const result = await ctesCompleteService.update(selectedCTeForReject.id.toString(), {
        status: 'Auditado e reprovado'
      });
      
      if (result.success) {
        setToast({ message: `CT-e ${selectedCTeForReject.numero} reprovado com sucesso! Motivo ID: ${reasonId}`, type: 'success' });
        await refreshData();
      } else {
        setToast({ message: `Erro ao reprovar CT-e: ${result.error}`, type: 'error' });
      }
    } catch (error) {
// console.error('Erro ao reprovar CT-e:', error);
      setToast({ message: 'Erro ao reprovar CT-e.', type: 'error' });
    } finally {
      setIsLoading(false);
      setShowRejectModal(false);
      setSelectedCTeForReject(null);
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
        establishmentName={currentEstablishment.name}
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
          establishmentName={currentEstablishment.name}
          userId={user.id.toString()}
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
          title="Confirmar Exclusão"
          message={`Tem certeza que deseja excluir o CT-e ${confirmDialog.cteNumber}? Esta ação não pode ser desfeita.`}
          onConfirm={confirmDelete}
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