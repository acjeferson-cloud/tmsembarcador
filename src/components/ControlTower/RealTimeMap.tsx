import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Truck, AlertTriangle, Clock, Navigation } from 'lucide-react';
import GoogleMap from '../Maps/GoogleMap';

interface Vehicle {
  id: string;
  name: string;
  status: 'moving' | 'stopped' | 'delayed' | 'delivered';
  location: string;
  latitude: number;
  longitude: number;
  lastUpdate: string;
  stoppedTime?: number;
  route: string;
}

export const RealTimeMap: React.FC = () => {
  const { t } = useTranslation();
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    {
      id: 'V001',
      name: 'Caminhão ABC-1234',
      status: 'moving',
      location: 'Rod. Presidente Dutra, KM 180',
      latitude: -23.2237,
      longitude: -45.9009,
      lastUpdate: '2 min atrás',
      route: 'São Paulo → Rio de Janeiro'
    },
    {
      id: 'V002',
      name: 'Van XYZ-5678',
      status: 'stopped',
      location: 'Posto Shell - Guarulhos',
      latitude: -23.4538,
      longitude: -46.5333,
      lastUpdate: '15 min atrás',
      stoppedTime: 120,
      route: 'São Paulo → Campinas'
    },
    {
      id: 'V003',
      name: 'Caminhão DEF-9012',
      status: 'delayed',
      location: 'BR-116, KM 45',
      latitude: -23.6821,
      longitude: -46.5953,
      lastUpdate: '5 min atrás',
      stoppedTime: 180,
      route: 'Belo Horizonte → São Paulo'
    },
    {
      id: 'V004',
      name: 'Truck GHI-3456',
      status: 'delivered',
      location: 'Centro de Distribuição RJ',
      latitude: -22.9068,
      longitude: -43.1729,
      lastUpdate: '30 min atrás',
      route: 'São Paulo → Rio de Janeiro'
    }
  ]);

  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [mapCenter] = useState({ lat: -23.5505, lng: -46.6333 }); // São Paulo como padrão

  const [alerts] = useState([
    {
      id: 1,
      vehicleId: 'V002',
      type: 'stopped',
      message: 'Veículo parado há mais de 2 horas',
      severity: 'high'
    },
    {
      id: 2,
      vehicleId: 'V003',
      type: 'delay',
      message: 'Atraso de 3 horas na rota',
      severity: 'medium'
    }
  ]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setVehicles(prev => prev.map(vehicle => ({
        ...vehicle,
        lastUpdate: Math.random() > 0.7 ? 'Agora' : vehicle.lastUpdate,
        stoppedTime: vehicle.status === 'stopped' ? (vehicle.stoppedTime || 0) + 1 : vehicle.stoppedTime
      })));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'moving': return 'text-green-600 bg-green-100';
      case 'stopped': return 'text-yellow-600 bg-yellow-100';
      case 'delayed': return 'text-red-600 bg-red-100';
      case 'delivered': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'moving': return <Navigation size={16} />;
      case 'stopped': return <Clock size={16} />;
      case 'delayed': return <AlertTriangle size={16} />;
      case 'delivered': return <MapPin size={16} />;
      default: return <Truck size={16} />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'moving': return t('controlTower.map.moving');
      case 'stopped': return t('controlTower.map.stopped');
      case 'delayed': return t('controlTower.map.delayed');
      case 'delivered': return t('controlTower.map.delivered');
      default: return t('controlTower.map.unknown');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('controlTower.map.realTimeMap')}</h3>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">{t('controlTower.map.live')}</span>
        </div>
      </div>

      {/* Google Maps */}
      <div className="rounded-lg mb-6 overflow-hidden">
        <GoogleMap
          latitude={selectedVehicle?.latitude || mapCenter.lat}
          longitude={selectedVehicle?.longitude || mapCenter.lng}
          height="400px"
          zoom={selectedVehicle ? 14 : 9}
          interactive={true}
        />
      </div>

      {selectedVehicle && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-blue-900">{selectedVehicle.name}</p>
              <p className="text-sm text-blue-700">{selectedVehicle.location}</p>
              <p className="text-xs text-blue-600">{selectedVehicle.route}</p>
            </div>
            <button
              onClick={() => setSelectedVehicle(null)}
              className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              {t('controlTower.map.viewAll')}
            </button>
          </div>
        </div>
      )}

      {/* Vehicle List */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('controlTower.map.activeVehicles')} ({vehicles.length})</h4>
        {vehicles.map((vehicle) => (
          <div
            key={vehicle.id}
            onClick={() => setSelectedVehicle(vehicle)}
            className={`flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer ${
              selectedVehicle?.id === vehicle.id
                ? 'bg-blue-100 border-2 border-blue-500'
                : 'bg-gray-50 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${getStatusColor(vehicle.status)}`}>
                {getStatusIcon(vehicle.status)}
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">{vehicle.name}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{vehicle.route}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{vehicle.location}</p>
              </div>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                {getStatusLabel(vehicle.status)}
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{vehicle.lastUpdate}</p>
              {vehicle.stoppedTime && (
                <p className="text-xs text-red-600">{t('controlTower.map.stoppedFor', { hours: Math.floor(vehicle.stoppedTime / 60), minutes: vehicle.stoppedTime % 60 })}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <p className="text-2xl font-bold text-green-600">{vehicles.filter(v => v.status === 'moving').length}</p>
          <p className="text-sm text-green-700">{t('controlTower.map.moving')}</p>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <p className="text-2xl font-bold text-red-600">{alerts.length}</p>
          <p className="text-sm text-red-700">{t('controlTower.map.activeAlerts')}</p>
        </div>
      </div>
    </div>
  );
};
