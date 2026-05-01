import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw } from 'lucide-react';
import { PendingOrdersList } from './PendingOrdersList';
import { TripBuilderPanel } from './TripBuilderPanel';
import { RoutingMap } from './RoutingMap';
import { ordersService, Order } from '../../../services/ordersService';
import { vehiclesService, Vehicle } from '../../../services/vehiclesService';
import { driversService, Driver } from '../../../services/driversService';
import { tripsService } from '../../../services/tripsService';
import { Toast, ToastType } from '../../common/Toast';

export const RoutingTower = () => {
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<Order[]>([]);
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [draggedOrder, setDraggedOrder] = useState<Order | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [ordersRes, vehiclesRes, driversRes] = await Promise.all([
        ordersService.getPendingRoutingOrders(),
        vehiclesService.getAll(),
        driversService.getAll()
      ]);
      
      setPendingOrders(ordersRes);
      // Filter only active and available resources
      setAvailableVehicles(vehiclesRes.filter(v => v.status === 'ativo' || v.status === 'livre'));
      setAvailableDrivers(driversRes.filter(d => d.status === 'livre'));
    } catch (error) {
      console.error("Erro ao carregar dados da torre:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, order: Order) => {
    setDraggedOrder(order);
    e.dataTransfer.effectAllowed = 'move';
    // Firefox requires some data to be set
    e.dataTransfer.setData('text/plain', order.id || '');
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Necessário para permitir o drop
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (draggedOrder) {
      // Move from pending to selected
      if (!selectedOrders.find(o => o.id === draggedOrder.id)) {
        setSelectedOrders(prev => [...prev, draggedOrder]);
        setPendingOrders(prev => prev.filter(o => o.id !== draggedOrder.id));
      }
      setDraggedOrder(null);
    }
  };

  // --- Hybrid Handlers (Checkbox / Click) ---
  const handleToggleOrder = (orderId: string) => {
    const isSelected = selectedOrders.some(o => o.id === orderId);
    
    if (isSelected) {
      // Remove from selected, put back to pending
      const orderToMove = selectedOrders.find(o => o.id === orderId);
      if (orderToMove) {
        setSelectedOrders(prev => prev.filter(o => o.id !== orderId));
        setPendingOrders(prev => [orderToMove, ...prev]);
      }
    } else {
      // Move from pending to selected
      const orderToMove = pendingOrders.find(o => o.id === orderId);
      if (orderToMove) {
        setPendingOrders(prev => prev.filter(o => o.id !== orderId));
        setSelectedOrders(prev => [...prev, orderToMove]);
      }
    }
  };

  const handleRemoveOrderFromTrip = (orderId: string) => {
    const orderToMove = selectedOrders.find(o => o.id === orderId);
    if (orderToMove) {
      setSelectedOrders(prev => prev.filter(o => o.id !== orderId));
      setPendingOrders(prev => [orderToMove, ...prev]);
    }
  };

  const handleClearTrip = () => {
    setPendingOrders(prev => [...selectedOrders, ...prev]);
    setSelectedOrders([]);
  };

  const handleSaveTrip = async (vehicleId: string, driverId: string) => {
    if (selectedOrders.length === 0 || !vehicleId || !driverId) return;
    
    setIsSaving(true);
    
    // Preparar as paradas (trip_stops)
    const stops = selectedOrders.map((order, index) => ({
      sequence: index + 1,
      tipo_parada: 'entrega' as const,
      order_id: order.id,
      // Usar coordenadas mockadas para a API. O ideal é pegar do banco.
      lat: 0,
      lng: 0 
    }));

    // Preparar a viagem
    const tripData = {
      status: 'agendada' as const,
      vehicle_id: vehicleId,
      driver_id: driverId,
      distancia_total_km: 0,
      tempo_estimado_min: 0,
    };

    const result = await tripsService.createTrip(tripData, stops);
    
    setIsSaving(false);
    
    if (result.success) {
      // Reset the trip builder
      setSelectedOrders([]);
      // Reload pending orders
      loadData();
      setToast({ message: 'Romaneio gerado com sucesso!', type: 'success' });
    } else {
      setToast({ message: `Erro ao gerar romaneio: ${result.error}`, type: 'error' });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-gray-50 dark:bg-gray-900">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-sm z-10 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">Central de Roteirização</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Arraste as cargas para o veículo ou use a seleção para formar romaneios</p>
          </div>
        </div>
        
        <button 
          onClick={loadData} 
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          Atualizar Cargas
        </button>
      </div>

      <div className="flex-1 p-6 overflow-hidden">
        <div className="grid grid-cols-12 gap-6 h-full">
          
          {/* Esquerda: Backlog de Cargas */}
          <div className="col-span-3 h-full flex flex-col">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center justify-between">
              Cargas Disponíveis
              <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 text-xs py-0.5 px-2 rounded-full font-bold">
                {pendingOrders.length}
              </span>
            </h3>
            <PendingOrdersList 
              orders={pendingOrders} 
              isLoading={isLoading} 
              onDragStart={handleDragStart}
              selectedOrders={selectedOrders.map(o => o.id!)}
              onToggleOrder={handleToggleOrder}
            />
          </div>

          {/* Centro: Mapa */}
          <div className="col-span-6 h-full">
            <RoutingMap 
              pendingOrders={pendingOrders}
              selectedOrders={selectedOrders}
            />
          </div>

          {/* Direita: Trip Builder */}
          <div className="col-span-3 h-full">
            <TripBuilderPanel 
              selectedOrders={selectedOrders}
              availableVehicles={availableVehicles}
              availableDrivers={availableDrivers}
              onRemoveOrder={handleRemoveOrderFromTrip}
              onClearTrip={handleClearTrip}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onSaveTrip={handleSaveTrip}
              isSaving={isSaving}
            />
          </div>
          
        </div>
      </div>
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
};
