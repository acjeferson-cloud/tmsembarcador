import React, { useState, useEffect } from 'react';
import { Search, Calendar, Truck, MapPin, User, Building, Package, AlertTriangle, DollarSign } from 'lucide-react';
import { brazilianStates } from '../../data/statesData';
import { establishments } from '../../data/establishmentsData';
import { occurrences } from '../../data/occurrencesData';
import { rejectionReasons } from '../../data/rejectionReasonsData';
import { Search as SearchIcon, Calendar as CalendarIcon, Filter, FileText } from 'lucide-react';
import { carriersService, Carrier } from '../../services/carriersService';
import { businessPartnersService, BusinessPartner } from '../../services/businessPartnersService';
import { AutocompleteSelect } from '../common/AutocompleteSelect';

interface ReportFiltersProps {
  reportId: string;
  filters: string[];
  onApplyFilters: (filters: Record<string, any>) => void;
}

export const ReportFilters: React.FC<ReportFiltersProps> = ({ reportId, filters, onApplyFilters }) => {
  const [formState, setFormState] = useState<Record<string, any>>({});
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [businessPartners, setBusinessPartners] = useState<BusinessPartner[]>([]);

  useEffect(() => {
    loadCarriers();
    loadBusinessPartners();
  }, []);

  const loadBusinessPartners = async () => {
    try {
      const data = await businessPartnersService.getAll();
      setBusinessPartners(data || []);
    } catch (error) {
      console.error('Error loading business partners:', error);
    }
  };

  const loadCarriers = async () => {
    try {
      const data = await carriersService.getAll();
      setCarriers(data);
    } catch (error) {

    }
  };
  
  // Initialize form state based on available filters
  useEffect(() => {
    const initialState: Record<string, any> = {};
    
    if (filters.includes('Período')) {
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      initialState.startDate = firstDayOfMonth.toISOString().split('T')[0];
      initialState.endDate = today.toISOString().split('T')[0];
    }
    
    if (filters.includes('Transportador')) {
      initialState.transportador = '';
    }
    
    if (filters.includes('UF')) {
      initialState.uf = '';
    }
    
    if (filters.includes('Status da auditoria')) {
      initialState.statusAuditoria = '';
    }
    
    if (filters.includes('Nº CT-e')) {
      initialState.numeroCte = '';
    }
    
    if (filters.includes('Status de conciliação')) {
      initialState.statusConciliacao = '';
    }
    
    if (filters.includes('Nº da fatura')) {
      initialState.numeroFatura = '';
    }
    
    if (filters.includes('Código da Ocorrência')) {
      initialState.codigoOcorrencia = '';
    }
    
    if (filters.includes('Estabelecimento')) {
      initialState.estabelecimento = '';
    }
    
    if (filters.includes('Cliente')) {
      initialState.cliente = '';
    }
    
    if (filters.includes('Motivo')) {
      initialState.motivo = '';
    }
    
    if (filters.includes('Tipo de documento')) {
      initialState.tipoDocumento = '';
    }
    
    if (filters.includes('Usuário')) {
      initialState.usuario = '';
    }
    
    if (filters.includes('Faixa de tolerância')) {
      initialState.toleranciaMin = '';
      initialState.toleranciaMax = '';
    }
    
    setFormState(initialState);
  }, [filters, reportId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    onApplyFilters(formState);
  };

  const handleClearFilters = () => {
    // Reset to initial state
    const initialState: Record<string, any> = {};
    
    if (filters.includes('Período')) {
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      initialState.startDate = firstDayOfMonth.toISOString().split('T')[0];
      initialState.endDate = today.toISOString().split('T')[0];
    }
    
    setFormState(initialState);
  };

  return (
    <form onSubmit={handleApplyFilters}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Period Filter */}
        {filters.includes('Período') && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-1">
              <Calendar size={16} />
              <span>Período</span>
            </label>
            <div className="flex space-x-2">
              <input
                type="date"
                name="startDate"
                value={formState.startDate || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <span className="flex items-center text-gray-500 dark:text-gray-400">a</span>
              <input
                type="date"
                name="endDate"
                value={formState.endDate || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
        )}

        {/* Carrier Filter */}
        {filters.includes('Transportador') && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-1">
              <Truck size={16} />
              <span>Transportador</span>
            </label>
            <select
              name="transportador"
              value={formState.transportador || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="">Todos os Transportadores</option>
              {carriers.map(carrier => (
                <option key={carrier.id} value={carrier.id}>
                  {carrier.codigo} - {carrier.razao_social}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* UF Filter */}
        {filters.includes('UF') && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-1">
              <MapPin size={16} />
              <span>UF</span>
            </label>
            <select
              name="uf"
              value={formState.uf || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="">Todas as UFs</option>
              {brazilianStates.map(state => (
                <option key={state.id} value={state.abbreviation}>
                  {state.abbreviation} - {state.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Audit Status Filter */}
        {filters.includes('Status da auditoria') && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-1">
              <AlertTriangle size={16} />
              <span>Status da Auditoria</span>
            </label>
            <select
              name="statusAuditoria"
              value={formState.statusAuditoria || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="">Todos os Status</option>
              <option value="Aprovado">Aprovado</option>
              <option value="Reprovado">Reprovado</option>
              <option value="Dentro da Tolerância">Dentro da Tolerância</option>
            </select>
          </div>
        )}

        {/* CT-e Number Filter */}
        {filters.includes('Nº CT-e') && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-1">
              <FileText size={16} />
              <span>Nº CT-e</span>
            </label>
            <input
              type="text"
              name="numeroCte"
              value={formState.numeroCte || ''}
              onChange={handleInputChange}
              placeholder="Digite o número do CT-e"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        )}

        {/* Reconciliation Status Filter */}
        {filters.includes('Status de conciliação') && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-1">
              <DollarSign size={16} />
              <span>Status de Conciliação</span>
            </label>
            <select
              name="statusConciliacao"
              value={formState.statusConciliacao || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="">Todos os Status</option>
              <option value="OK">OK</option>
              <option value="Divergente">Divergente</option>
            </select>
          </div>
        )}

        {/* Invoice Number Filter */}
        {filters.includes('Nº da fatura') && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-1">
              <FileText size={16} />
              <span>Nº da Fatura</span>
            </label>
            <input
              type="text"
              name="numeroFatura"
              value={formState.numeroFatura || ''}
              onChange={handleInputChange}
              placeholder="Digite o número da fatura"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        )}

        {/* Occurrence Code Filter */}
        {filters.includes('Código da Ocorrência') && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-1">
              <AlertTriangle size={16} />
              <span>Código da Ocorrência</span>
            </label>
            <select
              name="codigoOcorrencia"
              value={formState.codigoOcorrencia || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="">Todas as Ocorrências</option>
              {occurrences.map(occurrence => (
                <option key={occurrence.id} value={occurrence.codigo}>
                  {occurrence.codigo} - {occurrence.descricao.substring(0, 30)}{occurrence.descricao.length > 30 ? '...' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Establishment Filter */}
        {filters.includes('Estabelecimento') && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-1">
              <Building size={16} />
              <span>Estabelecimento</span>
            </label>
            <select
              name="estabelecimento"
              value={formState.estabelecimento || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="">Todos os Estabelecimentos</option>
              {establishments.map(establishment => (
                <option key={establishment.id} value={establishment.id}>
                  {establishment.codigo} - {establishment.fantasia || establishment.razaoSocial}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Client Filter */}
        {filters.includes('Cliente') && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-1">
              <User size={16} />
              <span>Cliente</span>
            </label>
            <AutocompleteSelect
              options={businessPartners.map(partner => ({
                value: partner.codigo || '',
                label: partner.document ? `${partner.document} - ${partner.name}` : `${partner.codigo} - ${partner.name}`
              }))}
              value={formState.cliente || ''}
              onChange={(value) => setFormState(prev => ({ ...prev, cliente: value }))}
              placeholder="Pesquisar cliente..."
            />
          </div>
        )}

        {/* Rejection Reason Filter */}
        {filters.includes('Motivo') && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-1">
              <AlertTriangle size={16} />
              <span>Motivo de Rejeição</span>
            </label>
            <select
              name="motivo"
              value={formState.motivo || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="">Todos os Motivos</option>
              {rejectionReasons.map(reason => (
                <option key={reason.id} value={reason.id}>
                  {reason.codigo} - {reason.descricao.substring(0, 30)}{reason.descricao.length > 30 ? '...' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Document Type Filter */}
        {filters.includes('Tipo de documento') && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-1">
              <FileText size={16} />
              <span>Tipo de Documento</span>
            </label>
            <select
              name="tipoDocumento"
              value={formState.tipoDocumento || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="">Todos os Tipos</option>
              <option value="CT-e">CT-e</option>
              <option value="Fatura">Fatura</option>
            </select>
          </div>
        )}

        {/* User Filter */}
        {filters.includes('Usuário') && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-1">
              <User size={16} />
              <span>Usuário</span>
            </label>
            <select
              name="usuario"
              value={formState.usuario || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="">Todos os Usuários</option>
              <option value="1">João Silva</option>
              <option value="2">Maria Santos</option>
              <option value="3">Carlos Oliveira</option>
              <option value="4">Ana Pereira</option>
            </select>
          </div>
        )}

        {/* Tolerance Range Filter */}
        {filters.includes('Faixa de tolerância') && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-1">
              <DollarSign size={16} />
              <span>Faixa de Tolerância (%)</span>
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                name="toleranciaMin"
                value={formState.toleranciaMin || ''}
                onChange={handleInputChange}
                placeholder="Mínimo"
                min="0"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <span className="flex items-center text-gray-500 dark:text-gray-400">a</span>
              <input
                type="number"
                name="toleranciaMax"
                value={formState.toleranciaMax || ''}
                onChange={handleInputChange}
                placeholder="Máximo"
                min="0"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end space-x-4">
        <button
          type="button"
          onClick={handleClearFilters}
          className="px-4 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors text-sm"
        >
          Limpar Filtros
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          Aplicar Filtros
        </button>
      </div>
    </form>
  );
};
