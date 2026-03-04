import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Download, FileText, CheckCircle, XCircle, AlertCircle, Clock, Truck, MapPin, Package, Calendar, User, RefreshCw, Send } from 'lucide-react';
import { PickupsFilters } from './PickupsFilters';
import { PickupsTable } from './PickupsTable';
import { PickupsActions } from './PickupsActions';
import { PickupDetailsModal } from './PickupDetailsModal';
import { RelationshipMapModal } from '../RelationshipMap/RelationshipMapModal';
import Breadcrumbs from '../Layout/Breadcrumbs';
import { pickupsService } from '../../services/pickupsService';

export const Pickups: React.FC = () => {
  const [pickups, setPickups] = useState<any[]>([]);
  const [filteredPickups, setFilteredPickups] = useState<any[]>([]);
  const [selectedPickups, setSelectedPickups] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRelationshipMap, setShowRelationshipMap] = useState(false);
  const [selectedPickup, setSelectedPickup] = useState<any>(null);
  const [filters, setFilters] = useState({
    transportador: '',
    numeroColeta: '',
    dataCriacao: { start: '', end: '' },
    status: [] as string[],
    usuarioResponsavel: '',
    enderecoColeta: ''
  });

  const breadcrumbItems = [
    { label: 'Documentos Operacionais' },
    { label: 'Coletas', current: true }
  ];

  // Load pickups from Supabase
  useEffect(() => {
    refreshData();
  }, []);

  // Apply filters to pickups
  useEffect(() => {
    const applyFilters = () => {
      let result = [...pickups];

      // Filter by transportador
      if (filters.transportador) {
        result = result.filter(pickup =>
          pickup.transportador.toLowerCase().includes(filters.transportador.toLowerCase())
        );
      }

      // Filter by número da coleta
      if (filters.numeroColeta) {
        result = result.filter(pickup =>
          pickup.numeroColeta.includes(filters.numeroColeta)
        );
      }

      // Filter by data de criação
      if (filters.dataCriacao.start && filters.dataCriacao.end) {
        const startDate = new Date(filters.dataCriacao.start);
        const endDate = new Date(filters.dataCriacao.end);
        endDate.setHours(23, 59, 59, 999);

        result = result.filter(pickup => {
          const criacaoDate = new Date(pickup.dataCriacao);
          return criacaoDate >= startDate && criacaoDate <= endDate;
        });
      }

      // Filter by status
      if (filters.status.length > 0) {
        result = result.filter(pickup => filters.status.includes(pickup.status));
      }

      // Filter by usuário responsável
      if (filters.usuarioResponsavel) {
        result = result.filter(pickup =>
          pickup.usuarioResponsavel.toLowerCase().includes(filters.usuarioResponsavel.toLowerCase())
        );
      }

      // Filter by endereço de coleta
      if (filters.enderecoColeta) {
        result = result.filter(pickup =>
          pickup.enderecoColeta.toLowerCase().includes(filters.enderecoColeta.toLowerCase())
        );
      }

      setFilteredPickups(result);
    };

    applyFilters();
  }, [pickups, filters]);

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedPickups(filteredPickups.map(pickup => pickup.id));
    } else {
      setSelectedPickups([]);
    }
  };

  const handleSelectPickup = (pickupId: number, isSelected: boolean) => {
    if (isSelected) {
      setSelectedPickups(prev => [...prev, pickupId]);
    } else {
      setSelectedPickups(prev => prev.filter(id => id !== pickupId));
    }
  };

  const handleBulkAction = (action: string) => {
    if (selectedPickups.length === 0) {
      alert('Por favor, selecione pelo menos uma coleta para realizar esta ação.');
      return;
    }

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      switch (action) {
        case 'cancelar':
          if (confirm(`Deseja realmente cancelar ${selectedPickups.length} coleta(s)?`)) {
            alert(`${selectedPickups.length} coleta(s) cancelada(s).`);
            setPickups(prev => prev.map(pickup => {
              if (selectedPickups.includes(pickup.id)) {
                return { ...pickup, status: 'coleta_cancelada' };
              }
              return pickup;
            }));
          }
          break;
        case 'print':
          alert(`Gerando relatório para ${selectedPickups.length} coleta(s).`);
          break;
        case 'download':
          alert(`Exportando dados de ${selectedPickups.length} coleta(s).`);
          break;
        default:
          break;
      }

      setIsLoading(false);
      setSelectedPickups([]);
    }, 1000);
  };

  const handleSingleAction = (pickupId: string, action: string) => {
    setIsLoading(true);

    setTimeout(() => {
      const pickup = pickups.find(p => p.id === pickupId);

      if (!pickup) {
        setIsLoading(false);
        return;
      }

      switch (action) {
        case 'view-details':
          setSelectedPickup(pickup);
          setShowDetailsModal(true);
          break;
        case 'view-relationship-map':
          setSelectedPickup(pickup);
          setShowRelationshipMap(true);
          break;
        case 'cancelar':
          if (confirm(`Deseja realmente cancelar a coleta ${pickup.numeroColeta}?`)) {
            alert(`Coleta ${pickup.numeroColeta} cancelada.`);
            setPickups(prev => prev.map(p =>
              p.id === pickupId ? { ...p, status: 'coleta_cancelada' } : p
            ));
          }
          break;
        default:
          break;
      }

      setIsLoading(false);
    }, 500);
  };

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const data = await pickupsService.getAll();
      const formattedPickups = data.map((pickup: any) => ({
        id: pickup.id,
        numeroColeta: pickup.pickup_number || `COL-${pickup.id}`,
        status: pickup.status,
        transportador: pickup.carrier_name || 'N/A',
        quantidadeNotas: pickup.packages_quantity || 0,
        dataCriacao: pickup.created_at,
        usuarioResponsavel: pickup.contact_name || 'N/A',
        enderecoColeta: `${pickup.pickup_city} - ${pickup.pickup_state}`,
        valorTotal: 0,
        dataSolicitacao: pickup.requested_at || pickup.scheduled_date,
        dataRealizacao: pickup.actual_pickup_date || pickup.completed_at,
        observacoes: pickup.observations || ''
      }));
      setPickups(formattedPickups);
    } catch (error) {
      console.error('Erro ao carregar coletas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Breadcrumbs items={breadcrumbItems} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Coletas</h1>
          <p className="text-gray-600 dark:text-gray-400">Acompanhe e gerencie todas as coletas por transportador</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={refreshData}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
            <span>{isLoading ? 'Carregando...' : 'Atualizar'}</span>
          </button>
        </div>
      </div>

      {/* Status Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Coletas</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{pickups.length}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Package size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Emitidas</p>
              <p className="text-2xl font-semibold text-gray-600 dark:text-gray-400 mt-1">
                {pickups.filter(pickup => pickup.status === 'emitida').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <Package size={20} className="text-gray-600 dark:text-gray-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Solicitadas</p>
              <p className="text-2xl font-semibold text-blue-400 dark:text-blue-400 mt-1">
                {pickups.filter(pickup => pickup.status === 'solicitada').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Send size={20} className="text-blue-400 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Realizadas</p>
              <p className="text-2xl font-semibold text-green-600 dark:text-green-400 mt-1">
                {pickups.filter(pickup => pickup.status === 'realizada').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Canceladas</p>
              <p className="text-2xl font-semibold text-red-600 dark:text-red-400 mt-1">
                {pickups.filter(pickup => pickup.status === 'cancelada').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <XCircle size={20} className="text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>
      </div>

      <PickupsFilters onFilterChange={handleFilterChange} filters={filters} />

      {selectedPickups.length > 0 && (
        <PickupsActions
          selectedCount={selectedPickups.length}
          onAction={handleBulkAction}
          isLoading={isLoading}
        />
      )}

      <PickupsTable
        pickups={filteredPickups}
        selectedPickups={selectedPickups}
        onSelectAll={handleSelectAll}
        onSelectPickup={handleSelectPickup}
        onAction={handleSingleAction}
        isLoading={isLoading}
      />

      {showDetailsModal && selectedPickup && (
        <PickupDetailsModal
          pickup={selectedPickup}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedPickup(null);
          }}
        />
      )}

      {showRelationshipMap && selectedPickup && (
        <RelationshipMapModal
          isOpen={showRelationshipMap}
          onClose={() => {
            setShowRelationshipMap(false);
            setSelectedPickup(null);
          }}
          sourceDocument={{
            id: `pickup-${selectedPickup.id}`,
            type: 'pickup',
            number: selectedPickup.numeroColeta,
            date: selectedPickup.dataCriacao,
            status: selectedPickup.status,
            value: selectedPickup.valorTotal
          }}
        />
      )}
    </div>
  );
};
