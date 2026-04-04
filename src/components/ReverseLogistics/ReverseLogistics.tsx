import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Filter, Download, RefreshCw, ArrowLeft, ArrowRight, Clock, CheckCircle } from 'lucide-react';
import { ReverseLogistics as ReverseLogisticsType } from '../../types';
import { reverseLogisticsService } from '../../services/reverseLogisticsService';
import { ReverseLogisticsCard } from './ReverseLogisticsCard';
import ReverseLogisticsFilters from './ReverseLogisticsFilters';
import ReverseLogisticsActions from './ReverseLogisticsActions';
import ReverseLogisticsForm from './ReverseLogisticsForm';
import ReverseLogisticsView from './ReverseLogisticsView';

const ReverseLogistics: React.FC = () => {
  const [reverseOrders, setReverseOrders] = useState<ReverseLogisticsType[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<ReverseLogisticsType[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showView, setShowView] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ReverseLogisticsType | null>(null);
  const [viewingOrder, setViewingOrder] = useState<ReverseLogisticsType | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const itemsPerPage = 12;

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await reverseLogisticsService.getAll();
      setReverseOrders(data);
      setFilteredOrders(data);
    } catch (error) {
// /*log_removed*/
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    const filtered = reverseOrders.filter(order =>
      order.reverseOrderNumber.toLowerCase().includes(term.toLowerCase()) ||
      order.originalOrderNumber.toLowerCase().includes(term.toLowerCase()) ||
      order.customerName.toLowerCase().includes(term.toLowerCase()) ||
      order.reason.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredOrders(filtered);
    setCurrentPage(1);
  };

  const handleFilter = (filters: any) => {
    let filtered = reverseOrders;

    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(order => order.status === filters.status);
    }

    if (filters.type && filters.type !== 'all') {
      filtered = filtered.filter(order => order.type === filters.type);
    }

    if (filters.priority && filters.priority !== 'all') {
      filtered = filtered.filter(order => order.priority === filters.priority);
    }

    if (filters.dateRange?.start) {
      filtered = filtered.filter(order => 
        new Date(order.requestDate) >= new Date(filters.dateRange.start)
      );
    }

    if (filters.dateRange?.end) {
      filtered = filtered.filter(order => 
        new Date(order.requestDate) <= new Date(filters.dateRange.end)
      );
    }

    setFilteredOrders(filtered);
    setCurrentPage(1);
  };

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    const currentPageOrders = getCurrentPageOrders();
    const allSelected = currentPageOrders.every(order => selectedOrders.includes(order.id));
    
    if (allSelected) {
      setSelectedOrders(prev => prev.filter(id => !currentPageOrders.map(o => o.id).includes(id)));
    } else {
      setSelectedOrders(prev => [...new Set([...prev, ...currentPageOrders.map(o => o.id)])]);
    }
  };

  const handleEdit = (order: ReverseLogisticsType) => {
    setEditingOrder(order);
    setShowForm(true);
  };

  const handleView = (order: ReverseLogisticsType) => {
    setViewingOrder(order);
    setShowView(true);
  };

  const handleSave = (orderData: Partial<ReverseLogisticsType>) => {
    if (editingOrder) {
      const updatedOrders = reverseOrders.map(order =>
        order.id === editingOrder.id
          ? { ...order, ...orderData, updatedAt: new Date().toISOString() }
          : order
      );
      setReverseOrders(updatedOrders);
      setFilteredOrders(updatedOrders);
    } else {
      const newOrder: ReverseLogisticsType = {
        id: Date.now().toString(),
        ...orderData as ReverseLogisticsType,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const updatedOrders = [...reverseOrders, newOrder];
      setReverseOrders(updatedOrders);
      setFilteredOrders(updatedOrders);
    }
    setShowForm(false);
    setEditingOrder(null);
  };

  const handleDelete = (orderId: string) => {
    const updatedOrders = reverseOrders.filter(order => order.id !== orderId);
    setReverseOrders(updatedOrders);
    setFilteredOrders(updatedOrders);
    setSelectedOrders(prev => prev.filter(id => id !== orderId));
  };

  const getCurrentPageOrders = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredOrders.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const getStatusStats = () => {
    const stats = {
      total: reverseOrders.length,
      pending: reverseOrders.filter(o => o.status === 'pending').length,
      approved: reverseOrders.filter(o => o.status === 'approved').length,
      inTransit: reverseOrders.filter(o => o.status === 'in_transit').length,
      completed: reverseOrders.filter(o => o.status === 'completed').length
    };
    return stats;
  };

  const stats = getStatusStats();

  if (showForm) {
    return (
      <ReverseLogisticsForm
        order={editingOrder}
        onSave={handleSave}
        onCancel={() => {
          setShowForm(false);
          setEditingOrder(null);
        }}
      />
    );
  }

  if (showView && viewingOrder) {
    return (
      <ReverseLogisticsView
        order={viewingOrder}
        onEdit={() => {
          setShowView(false);
          handleEdit(viewingOrder);
        }}
        onClose={() => {
          setShowView(false);
          setViewingOrder(null);
        }}
      />
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Logística Reversa</h1>
              <p className="text-gray-600 dark:text-gray-400">Gerencie devoluções, trocas e garantias</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors mr-8 font-medium flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Solicitação</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pendentes</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Aprovados</p>
              <p className="text-2xl font-bold text-blue-600">{stats.approved}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Em Trânsito</p>
              <p className="text-2xl font-bold text-purple-600">{stats.inTransit}</p>
            </div>
            <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Concluídos</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por número, cliente, motivo..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span>Filtros</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors">
              <Download className="w-4 h-4" />
              <span>Exportar</span>
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t">
            <ReverseLogisticsFilters onFilter={handleFilter} />
          </div>
        )}
      </div>

      {/* Actions */}
      {selectedOrders.length > 0 && (
        <div className="mb-8">
          <ReverseLogisticsActions
            selectedCount={selectedOrders.length}
            onBulkAction={(action) => {
              setSelectedOrders([]);
            }}
          />
        </div>
      )}

      {/* Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <Package size={48} />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhuma solicitação encontrada</h3>
          <p className="text-gray-600 dark:text-gray-400">Tente ajustar os filtros ou criar uma nova solicitação.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {getCurrentPageOrders().map((order) => (
              <ReverseLogisticsCard
                key={order.id}
                order={order}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isSelected={selectedOrders.includes(order.id)}
                onSelect={handleSelectOrder}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredOrders.length)} de {filteredOrders.length} solicitações
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 dark:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                    if (page > totalPages) return null;

                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 text-sm rounded transition-colors ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 dark:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Próximo
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReverseLogistics;