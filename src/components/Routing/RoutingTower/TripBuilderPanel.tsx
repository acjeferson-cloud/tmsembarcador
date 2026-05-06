import React, { useState, useEffect } from 'react';
import { Truck, User, Plus, Trash2, Save, Map, AlertCircle, RefreshCw, Sparkles, Loader2 } from 'lucide-react';
import { Order } from '../../../services/ordersService';
import { Vehicle } from '../../../services/vehiclesService';
import { Driver } from '../../../services/driversService';
import { nominatimGeocoder } from '../../../utils/nominatimGeocoder';

interface TripBuilderPanelProps {
  selectedOrders: Order[];
  availableVehicles: Vehicle[];
  availableDrivers: Driver[];
  onRemoveOrder: (orderId: string) => void;
  onClearTrip: () => void;
  onSaveTrip: (vehicleId: string, driverId: string) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  isSaving: boolean;
  routeStats?: { distanceKm: number, timeMin: number, outboundKm?: number, returnKm?: number };
  onReorderOrders?: (orders: Order[]) => void;
}

export const TripBuilderPanel: React.FC<TripBuilderPanelProps> = ({
  selectedOrders,
  availableVehicles,
  availableDrivers,
  onRemoveOrder,
  onClearTrip,
  onSaveTrip,
  onDragOver,
  onDrop,
  isSaving,
  routeStats,
  onReorderOrders
}) => {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  
  const selectedVehicle = availableVehicles.find(v => v.id === selectedVehicleId);
  
  // Calculations
  const totalWeight = selectedOrders.reduce((acc, order) => acc + (order.weight || 0), 0);
  const totalVolume = selectedOrders.reduce((acc, order) => acc + (order.cubic_meters || 0), 0);
  
  const weightCapacity = selectedVehicle?.capacidade_kg || 0;
  const volumeCapacity = selectedVehicle?.cubagem_m3 || 0;
  
  const weightPercentage = weightCapacity > 0 ? (totalWeight / weightCapacity) * 100 : 0;
  const volumePercentage = volumeCapacity > 0 ? (totalVolume / volumeCapacity) * 100 : 0;
  
  const isOverweight = weightPercentage > 100;
  const isOvervolume = volumePercentage > 100;
  
  const isSaveDisabled = selectedOrders.length === 0 || !selectedVehicleId || !selectedDriverId || isOverweight || isSaving;

  const handleOptimizeRoute = async () => {
    if (selectedOrders.length < 2 || !onReorderOrders) return;
    setIsOptimizing(true);
    
    try {
      const validPoints: { id: string, lat: number, lng: number }[] = [];
      
      for (const order of selectedOrders) {
        const parts = [
          order.destination_street,
          order.destination_number,
          order.destination_neighborhood,
          order.destination_city,
          order.destination_state
        ].filter(Boolean);
        
        let address = `${parts.join(', ')}, Brasil`;
        let coords = await nominatimGeocoder.geocode(address);
        
        if (!coords && order.destination_city) {
           address = `${order.destination_city}, ${order.destination_state}, Brasil`;
           coords = await nominatimGeocoder.geocode(address);
        }
        
        if (coords) {
          validPoints.push({
            id: order.id || order.order_number,
            lat: coords.lat,
            lng: coords.lng
          });
        }
      }

      // Origin point (CD)
      const points = [
        { id: 'cd-origin', lat: -26.9038, lng: -48.6536 },
        ...validPoints
      ];

      if (points.length < 3) {
        setIsOptimizing(false);
        return;
      }

      const response = await fetch('http://localhost:8081/api/optimize-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points })
      });
      
      const data = await response.json();
      
      if (data.optimizedSequence) {
        const reorderedLoads = [...selectedOrders].sort((a, b) => {
          const idA = a.id || a.order_number;
          const idB = b.id || b.order_number;
          return data.optimizedSequence.indexOf(idA) - data.optimizedSequence.indexOf(idB);
        });
        
        onReorderOrders(reorderedLoads);
      }
    } catch (error) {
      console.error("Erro ao otimizar", error);
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex-1">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-t-xl flex justify-between items-center">
        <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Map size={20} className="text-indigo-600 dark:text-indigo-400" />
          Montagem de Romaneio
        </h2>
        
        <div className="flex items-center gap-3">
          {selectedOrders.length > 0 && (
            <button 
              onClick={onClearTrip}
              className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 font-medium bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-md transition-all"
            >
              <RefreshCw size={13} />
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Recurses Selection */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-4">
        {/* Vehicle Select */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Veículo
          </label>
          <div className="relative">
            <Truck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Selecione um veículo...</option>
              {availableVehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.placa} - {v.tipo} ({v.capacidade_kg}kg)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Driver Select */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Motorista
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Selecione um motorista...</option>
              {availableDrivers.map(d => (
                <option key={d.id} value={d.id}>
                  {d.nome} - {d.cnh}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Drop Zone / Orders List */}
      <div 
        className={`flex-1 p-4 overflow-y-auto ${selectedOrders.length === 0 ? 'flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 m-4 rounded-xl bg-gray-50 dark:bg-gray-800/50' : ''}`}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        {selectedOrders.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400">
            <Plus className="w-10 h-10 mx-auto mb-2 text-gray-400" />
            <p className="text-sm font-medium">Arraste as cargas para cá</p>
            <p className="text-xs mt-1">ou selecione-as na lista ao lado</p>
          </div>
        ) : (
          <div className="space-y-2">
            {selectedOrders.map((order, index) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{order.order_number}{order.customer_name ? ` - ${order.customer_name}` : ''}</p>
                    <p className="text-xs text-gray-500">{order.destination_city}{order.destination_state ? `-${order.destination_state}` : ''} - {order.weight?.toFixed(1)} kg</p>
                  </div>
                </div>
                <button 
                  onClick={() => order.id && onRemoveOrder(order.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer / Summary */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
        <div className="space-y-3 mb-4">
          
          {/* Route Stats (KM and Time) */}
          {routeStats && routeStats.distanceKm > 0 && (
            <div className="flex gap-4 mb-2 pb-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">Distância Prevista</p>
                <div className="flex flex-col">
                  <span className="font-bold text-gray-900 dark:text-white">{routeStats.distanceKm.toFixed(1)} km</span>
                  {routeStats.outboundKm !== undefined && routeStats.returnKm !== undefined && (
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
                      (Ida {routeStats.outboundKm.toFixed(1)} km / Volta {routeStats.returnKm.toFixed(1)} km)
                    </span>
                  )}
                </div>
              </div>
              <div className="flex-1 border-l border-gray-200 dark:border-gray-700 pl-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">Tempo Estimado</p>
                <p className="font-bold text-gray-900 dark:text-white">
                  {Math.floor(routeStats.timeMin / 60)}h {Math.round(routeStats.timeMin % 60)}m
                </p>
              </div>
            </div>
          )}

          {/* Weight Progress */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-gray-700 dark:text-gray-300">Peso Total</span>
              <span className={`font-bold ${isOverweight ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                {totalWeight.toFixed(1)} / {weightCapacity} kg ({weightPercentage.toFixed(1)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  isOverweight ? 'bg-red-500' : 
                  weightPercentage > 85 ? 'bg-yellow-500' : 
                  'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(weightPercentage, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Volume Progress */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-gray-700 dark:text-gray-300">Cubagem Total</span>
              <span className={`font-bold ${isOvervolume ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                {totalVolume.toFixed(2)} / {volumeCapacity} m³ ({volumePercentage.toFixed(1)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  isOvervolume ? 'bg-red-500' : 
                  volumePercentage > 85 ? 'bg-yellow-500' : 
                  'bg-indigo-500'
                }`}
                style={{ width: `${Math.min(volumePercentage, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {isOverweight && (
          <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs rounded-lg flex items-start gap-2 border border-red-200 dark:border-red-800">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <p>O peso total das cargas excede a capacidade do veículo selecionado.</p>
          </div>
        )}

        <button
          onClick={handleOptimizeRoute}
          disabled={isOptimizing || isSaving || selectedOrders.length < 2}
          className="w-full mb-3 flex items-center justify-center gap-2 py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isOptimizing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Sparkles className="w-5 h-5" />
          )}
          {isOptimizing ? 'Calculando melhor rota...' : 'Roteirização Inteligente'}
        </button>

        <button
          onClick={() => onSaveTrip(selectedVehicleId, selectedDriverId)}
          disabled={isSaveDisabled}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <Save size={18} />
              Gerar Viagem
            </>
          )}
        </button>
      </div>
    </div>
  );
};
