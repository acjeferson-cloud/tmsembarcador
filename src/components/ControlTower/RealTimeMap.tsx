import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Package, AlertTriangle, CheckCircle, Navigation, Clock } from 'lucide-react';
import { loadGoogleMapsAPI, isGoogleMapsLoaded } from '../../utils/googleMapsLoader';
import { CargoMarker, controlTowerService } from '../../services/controlTowerService';
import { MarkerClusterer } from '@googlemaps/markerclusterer';

export const RealTimeMap: React.FC = () => {
  const { t } = useTranslation();
  
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [clusterer, setClusterer] = useState<any>(null);
  
  const [cargoMarkers, setCargoMarkers] = useState<CargoMarker[]>([]);
  const [selectedCargo, setSelectedCargo] = useState<CargoMarker | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Default Center (São Paulo)
  const defaultCenter = { lat: -23.5505, lng: -46.6333 };

  // Sync Markers Array
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const data = await controlTowerService.getMapMarkers();
      setCargoMarkers(data);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  // Initialize Map
  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current) return;
      try {
        await loadGoogleMapsAPI();
        if (!isGoogleMapsLoaded() || mapInstance) return;

        const map = new window.google.maps.Map(mapRef.current, {
          center: defaultCenter,
          zoom: 7,
          mapTypeControl: false,
          streetViewControl: false,
        });

        setMapInstance(map);
        
        // Inicializar Cluster vazio
        const markerClusterer = new MarkerClusterer({ map, markers: [] });
        setClusterer(markerClusterer);
        
      } catch (e) {
        console.error('Erro ao instanciar mapa', e);
      }
    };
    initMap();
  }, []);

  // Update Markers inside Map Clusterer
  useEffect(() => {
    if (!mapInstance || !clusterer || !cargoMarkers.length) return;

    // Limpar markers anteriores do clusterer
    clusterer.clearMarkers();

    const gMarkers = cargoMarkers.map(cargo => {
      // Logic for Colors/SLA
      let pinColor = '#FBBF24'; // Yellow (Em trânsito)
      let isBouncing = false;
      
      if (cargo.situacao === 'entregue') {
        pinColor = '#10B981'; // Green (Entregue)
      } else if (cargo.is_delayed) {
        pinColor = '#EF4444'; // Red (Atrasado)
        isBouncing = true;
      }

      // Create SVG Icon for Marker natively
      const svgMarker = {
        path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
        fillColor: pinColor,
        fillOpacity: 1,
        strokeWeight: 1,
        strokeColor: '#FFFFFF',
        rotation: 0,
        scale: 1.5,
        anchor: new window.google.maps.Point(12, 24),
      };

      const gMarker = new window.google.maps.Marker({
        position: { lat: cargo.lat, lng: cargo.lng },
        icon: svgMarker,
        title: `NF: ${cargo.numero}`,
        animation: isBouncing ? window.google.maps.Animation.BOUNCE : null,
      });

      gMarker.addListener('click', () => {
        setSelectedCargo(cargo);
        mapInstance.setZoom(12);
        mapInstance.panTo({ lat: cargo.lat, lng: cargo.lng });
      });

      return gMarker;
    });

    clusterer.addMarkers(gMarkers);
    
    // Fit Bounds if we have markers
    if (gMarkers.length > 0 && !selectedCargo) {
      const bounds = new window.google.maps.LatLngBounds();
      gMarkers.forEach((m: any) => bounds.extend(m.getPosition()!));
      mapInstance.fitBounds(bounds);
    }
  }, [mapInstance, clusterer, cargoMarkers]);

  const getSlaBadge = (cargo: CargoMarker) => {
    if (cargo.situacao === 'entregue') {
      return { class: 'bg-green-100 text-green-700', text: 'Entregue', icon: <CheckCircle size={14} /> };
    }
    if (cargo.is_delayed) {
      return { class: 'bg-red-100 text-red-700 animate-pulse', text: 'Atrasado SLA', icon: <AlertTriangle size={14} /> };
    }
    return { class: 'bg-yellow-100 text-yellow-700', text: 'Em Trânsito', icon: <Navigation size={14} /> };
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            Central GeoVision
            {isLoading && <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse ml-2" />}
          </h3>
          <p className="text-sm text-gray-500">Monitoramento baseado em inteligência de SLA da Carga e Ocorrências.</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">{t('controlTower.map.live')}</span>
        </div>
      </div>

      {/* Google Maps Container */}
      <div className="w-full relative rounded-lg border border-gray-300 dark:border-gray-600 mb-4 overflow-hidden" style={{ minHeight: '400px', flex: '1 1 auto' }}>
        <div ref={mapRef} className="w-full h-full absolute inset-0" />
      </div>

      {selectedCargo && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-gray-700/50 border border-blue-200 dark:border-gray-600 rounded-lg shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">Destaque: NF-e {selectedCargo.numero}</p>
              <p className="text-sm text-blue-700 dark:text-blue-300">Destinatário: {selectedCargo.destinatario_nome}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">Previsão: {new Date(selectedCargo.expected_delivery_date).toLocaleDateString()}</p>
            </div>
            <button
              onClick={() => {
                setSelectedCargo(null);
                if (mapInstance && cargoMarkers.length > 0) {
                     const bounds = new window.google.maps.LatLngBounds();
                     cargoMarkers.forEach(m => bounds.extend(new window.google.maps.LatLng(m.lat, m.lng)));
                     mapInstance.fitBounds(bounds);
                }
              }}
              className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              Exibir Todas
            </button>
          </div>
        </div>
      )}

      {/* Cargo List View */}
      <div className="space-y-3 shrink-0 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-2">Documentos Monitorados ({cargoMarkers.length})</h4>
        
        {cargoMarkers.map((cargo) => {
          const badge = getSlaBadge(cargo);
          return (
            <div
              key={cargo.id}
              onClick={() => {
                setSelectedCargo(cargo);
                if(mapInstance) {
                   mapInstance.setZoom(12);
                   mapInstance.panTo({ lat: cargo.lat, lng: cargo.lng });
                }
              }}
              className={`flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer border ${
                selectedCargo?.id === cargo.id
                  ? 'bg-blue-50 border-blue-300 dark:bg-gray-700 dark:border-blue-500'
                  : 'bg-gray-50 border-transparent hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-700'
              }`}
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                   <Package size={16} className="text-blue-600" />
                   <p className="font-semibold text-gray-900 dark:text-white text-sm">NF-e {cargo.numero}</p>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">{cargo.destinatario_nome}</p>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-500 border border-gray-200 dark:border-gray-600 rounded px-1 w-max">{cargo.carrier_id}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.class}`}>
                  {badge.icon}
                  {badge.text}
                </span>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 uppercase">Previsão</p>
                <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{new Date(cargo.expected_delivery_date).toLocaleDateString()}</p>
              </div>
            </div>
          );
        })}
        {cargoMarkers.length === 0 && !isLoading && (
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded text-gray-500">
            Nenhuma carga geolocalizada no momento. Rodar o script SQL de marcações.
          </div>
        )}
      </div>
      
    </div>
  );
};
