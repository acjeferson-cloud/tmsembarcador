import React, { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { loadGoogleMapsAPI, isGoogleMapsLoaded } from '../../utils/googleMapsLoader';
import { useTranslation } from 'react-i18next';
import { useInnovations } from '../../hooks/useInnovations';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface BrazilMapProps {
  states?: any[];
  onStateClick?: (state: any) => void;
}

export const BrazilMap: React.FC<BrazilMapProps> = ({ states, onStateClick }) => {
  const { t } = useTranslation();
  const { isInnovationActive, isLoading: isContextLoading } = useInnovations();
  const isActive = isInnovationActive('google-maps');
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

  const initializeMap = async () => {
    if (!mapRef.current || !isActive || isContextLoading || mapInstance) return;

    try {
      await loadGoogleMapsAPI();

      if (!isGoogleMapsLoaded()) {
        return;
      }

      const map = new google.maps.Map(mapRef.current, {
        center: { lat: -14.235, lng: -51.9253 },
        zoom: 4,
        mapTypeId: google.maps.MapTypeId.TERRAIN,
        styles: [
          {
            featureType: 'administrative.country',
            elementType: 'geometry.stroke',
            stylers: [{ color: '#4285f4' }, { weight: 2 }]
          },
          {
            featureType: 'administrative.province',
            elementType: 'geometry.stroke',
            stylers: [{ color: '#4285f4' }, { weight: 1 }]
          }
        ]
      });

      setMapInstance(map);

      // Adicionar listeners para cliques nos estados
      map.addListener('click', (event: google.maps.MapMouseEvent) => {
        if (event.latLng && onStateClick) {
          // Aqui você pode implementar a lógica para detectar qual estado foi clicado
          // baseado nas coordenadas do clique
          const clickedLocation = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng()
          };
          
          // Por enquanto, vamos apenas passar as coordenadas
          onStateClick(clickedLocation);
        }
      });

    } catch (error) {
    }
  };

  useEffect(() => {
    initializeMap();
  }, [isActive, isContextLoading, mapInstance]);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('states.map.title')}</h3>
            <p className="text-gray-600 dark:text-gray-400">{t('states.map.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        {isContextLoading ? (
          <div className="w-full flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg p-6" style={{ minHeight: '400px' }}>
            <p className="text-gray-500 animate-pulse">Carregando inovações...</p>
          </div>
        ) : !isActive ? (
          <div className="w-full relative rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden" style={{ minHeight: '400px' }}>
            <div className="absolute top-4 right-4 z-[1000] bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 px-4 py-2 rounded-lg shadow-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              <span className="text-xs text-yellow-800 dark:text-yellow-400 font-medium">Modo Compatibilidade (OSM)</span>
            </div>
            <MapContainer center={[-14.235, -51.9253]} zoom={4} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              />
              {/* States can be highlighted with GeoJSON if needed, but for fallback just showing the map is enough */}
            </MapContainer>
          </div>
        ) : (
          <div 
            ref={mapRef}
            className="w-full h-96 rounded-lg border border-gray-200 dark:border-gray-700"
            style={{ minHeight: '400px' }}
          />
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start space-x-2">
          <MapPin size={16} className="text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800 font-medium">{t('states.map.interactive_map')}</p>
            <ul className="text-xs text-blue-700 mt-1 space-y-1">
              <li>{t('states.map.tip_1')}</li>
              <li>{t('states.map.tip_2')}</li>
              <li>{t('states.map.tip_3')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
