import React, { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { loadGoogleMapsAPI, isGoogleMapsLoaded } from '../../utils/googleMapsLoader';
import { useTranslation } from 'react-i18next';

interface BrazilMapProps {
  states?: any[];
  onStateClick?: (state: any) => void;
}

export const BrazilMap: React.FC<BrazilMapProps> = ({ states, onStateClick }) => {
  const { t } = useTranslation();
  const mapRef = useRef<HTMLDivElement>(null);
  const [, setMapInstance] = useState<google.maps.Map | null>(null);

  const initializeMap = async () => {
    if (!mapRef.current) return;

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
  }, []);

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
        <div 
          ref={mapRef}
          className="w-full h-96 rounded-lg border border-gray-200 dark:border-gray-700"
          style={{ minHeight: '400px' }}
        />
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