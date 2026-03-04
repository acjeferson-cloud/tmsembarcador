import React, { useEffect, useRef, useState } from 'react';
import { BusinessPartner } from '../../types';
import { MapPin, Loader } from 'lucide-react';
import { loadGoogleMapsAPI, isGoogleMapsLoaded } from '../../utils/googleMapsLoader';

interface BusinessPartnersMapProps {
  partners: BusinessPartner[];
  onSelectPartner?: (partner: BusinessPartner) => void;
}

const BusinessPartnersMap: React.FC<BusinessPartnersMapProps> = ({ partners, onSelectPartner }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAndInitializeMap = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Verifica se o Google Maps já está carregado
        if (isGoogleMapsLoaded()) {
          console.log('Google Maps já está carregado, inicializando mapa...');
          initializeMap();
          return;
        }

        // Carrega o Google Maps usando o loader centralizado
        console.log('Carregando Google Maps API...');
        await loadGoogleMapsAPI();

        console.log('Google Maps API carregada com sucesso, inicializando mapa...');
        initializeMap();
      } catch (err: any) {
        console.error('Erro ao carregar Google Maps:', err);
        setError(err.message || 'Erro ao carregar o Google Maps. Configure a chave de API nas configurações.');
        setIsLoading(false);
      }
    };

    const initializeMap = () => {
      if (!mapRef.current) {
        console.error('mapRef.current não está disponível');
        return;
      }

      if (!window.google || !window.google.maps) {
        console.error('Google Maps API não está disponível');
        setError('Google Maps API não está disponível');
        setIsLoading(false);
        return;
      }

      try {
        console.log('Criando instância do mapa...');
        // Mapa centralizado no Brasil
        const mapInstance = new google.maps.Map(mapRef.current, {
          center: { lat: -14.2350, lng: -51.9253 }, // Centro do Brasil
          zoom: 4,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
        });

        console.log('Mapa criado com sucesso!');
        setMap(mapInstance);
        setIsLoading(false);
      } catch (err) {
        console.error('Erro ao inicializar mapa:', err);
        setError('Erro ao inicializar o mapa');
        setIsLoading(false);
      }
    };

    loadAndInitializeMap();
  }, []);

  useEffect(() => {
    if (!map) return;

    // Limpa marcadores anteriores
    markers.forEach(marker => marker.setMap(null));

    const newMarkers: google.maps.Marker[] = [];
    const bounds = new google.maps.LatLngBounds();
    const geocoder = new google.maps.Geocoder();

    // Função para geocodificar e adicionar marcador
    const addMarkerForPartner = async (partner: BusinessPartner) => {
      try {
        // Pega o primeiro endereço do parceiro
        const address = partner.addresses && partner.addresses.length > 0 ? partner.addresses[0] : null;

        if (!address || !address.city || !address.state) {
          console.log(`Parceiro ${partner.name} sem endereço válido`);
          return;
        }

        // Monta o endereço completo
        const fullAddress = `${address.street || ''} ${address.number || ''}, ${address.city}, ${address.state}, Brasil`;

        // Geocodifica o endereço
        const result = await new Promise<google.maps.GeocoderResult>((resolve, reject) => {
          geocoder.geocode({ address: fullAddress }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
              resolve(results[0]);
            } else {
              // Tenta apenas com cidade/estado
              const simplifiedAddress = `${address.city}, ${address.state}, Brasil`;
              geocoder.geocode({ address: simplifiedAddress }, (results2, status2) => {
                if (status2 === 'OK' && results2 && results2[0]) {
                  resolve(results2[0]);
                } else {
                  reject(new Error(`Geocoding failed: ${status}`));
                }
              });
            }
          });
        });

        const location = result.geometry.location;

        // Cria marcador personalizado por tipo
        const icon = {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: partner.type === 'customer' ? '#3B82F6' :
                     partner.type === 'supplier' ? '#10B981' :
                     '#8B5CF6',
          fillOpacity: 0.9,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        };

        const marker = new google.maps.Marker({
          position: location,
          map: map,
          title: partner.name,
          icon: icon,
          animation: google.maps.Animation.DROP,
        });

        // Info window com detalhes do parceiro
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 12px; max-width: 250px;">
              <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #1F2937;">
                ${partner.name}
              </h3>
              <div style="margin-bottom: 4px; font-size: 13px; color: #6B7280;">
                <strong>Tipo:</strong> ${
                  partner.type === 'customer' ? 'Cliente' :
                  partner.type === 'supplier' ? 'Fornecedor' :
                  'Cliente/Fornecedor'
                }
              </div>
              ${partner.email ? `
                <div style="margin-bottom: 4px; font-size: 13px; color: #6B7280;">
                  <strong>Email:</strong> ${partner.email}
                </div>
              ` : ''}
              ${partner.phone ? `
                <div style="margin-bottom: 4px; font-size: 13px; color: #6B7280;">
                  <strong>Telefone:</strong> ${partner.phone}
                </div>
              ` : ''}
              ${address ? `
                <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #E5E7EB; font-size: 12px; color: #6B7280;">
                  ${address.city} - ${address.state}
                </div>
              ` : ''}
            </div>
          `,
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
          if (onSelectPartner) {
            onSelectPartner(partner);
          }
        });

        marker.addListener('mouseover', () => {
          infoWindow.open(map, marker);
        });

        marker.addListener('mouseout', () => {
          infoWindow.close();
        });

        newMarkers.push(marker);
        bounds.extend(location);
      } catch (error) {
        console.error(`Erro ao geocodificar parceiro ${partner.name}:`, error);
      }
    };

    // Processa todos os parceiros
    const processPartners = async () => {
      const promises = partners
        .filter(p => p.addresses && p.addresses.length > 0)
        .map(partner => addMarkerForPartner(partner));

      await Promise.all(promises);

      // Ajusta o zoom para mostrar todos os marcadores
      if (newMarkers.length > 0) {
        map.fitBounds(bounds);
        // Limita o zoom máximo
        const listener = google.maps.event.addListener(map, 'idle', () => {
          if (map.getZoom() && map.getZoom()! > 15) {
            map.setZoom(15);
          }
          google.maps.event.removeListener(listener);
        });
      }

      setMarkers(newMarkers);
    };

    processPartners();

    return () => {
      newMarkers.forEach(marker => marker.setMap(null));
    };
  }, [map, partners, onSelectPartner]);

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
        <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400 mb-2">{error}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Configure sua chave de API do Google Maps nas configurações do sistema.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-90 z-10 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-gray-600 dark:text-gray-400">Carregando mapa...</p>
          </div>
        </div>
      )}

      <div
        ref={mapRef}
        className="w-full h-[600px] rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
        style={{ minHeight: '600px' }}
      />

      {/* Legenda */}
      <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Legenda</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Cliente</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Fornecedor</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-purple-500 border-2 border-white"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Cliente/Fornecedor</span>
          </div>
        </div>
      </div>

      {/* Contador de parceiros no mapa */}
      <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg px-4 py-2 border border-gray-200 dark:border-gray-700">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {markers.length} parceiros no mapa
        </p>
      </div>
    </div>
  );
};

export default BusinessPartnersMap;
