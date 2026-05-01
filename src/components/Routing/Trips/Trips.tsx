import React, { useState, useEffect } from 'react';
import { FileText, RefreshCw, Plus } from 'lucide-react';
import { TripList } from './TripList';
import { TripDetailsModal } from './TripDetailsModal';
import { Trip, tripsService } from '../../../services/tripsService';
import { Toast, ToastType } from '../../common/Toast';

export const Trips = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const navigateToTower = () => {
    window.dispatchEvent(new CustomEvent('app-navigate', { detail: 'routing-tower' }));
  };

  const loadTrips = async () => {
    setIsLoading(true);
    try {
      const data = await tripsService.getAll();
      setTrips(data);
      
      // Update selected trip if it's currently open
      if (selectedTrip) {
        const updatedTrip = data.find(t => t.id === selectedTrip.id);
        if (updatedTrip) setSelectedTrip(updatedTrip);
      }
    } catch (error) {
      console.error('Erro ao carregar viagens:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTrips();
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-gray-50 dark:bg-gray-900">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-sm z-10 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">Gestão de Romaneios</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Acompanhe as viagens geradas e mude seus status</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={loadTrips} 
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            Atualizar
          </button>
          
          <button
            onClick={navigateToTower}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus size={18} />
            Nova Viagem
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          <TripList 
            trips={trips} 
            isLoading={isLoading} 
            onViewDetails={setSelectedTrip} 
          />
        </div>
      </div>

      {selectedTrip && (
        <TripDetailsModal 
          trip={selectedTrip} 
          onClose={() => setSelectedTrip(null)} 
          onStatusChange={loadTrips} 
          onShowToast={setToast}
        />
      )}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
};
