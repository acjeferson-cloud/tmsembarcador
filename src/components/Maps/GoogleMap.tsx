import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Search, Info } from 'lucide-react';
import { loadGoogleMapsAPI, isGoogleMapsLoaded } from '../../utils/googleMapsLoader';
import { useInnovations } from '../../contexts/InnovationsContext';
import { useAuth } from '../../hooks/useAuth';

interface GoogleMapProps {
  address?: string;
  latitude?: number;
  longitude?: number;
  onLocationSelect?: (location: { lat: number; lng: number; address: string }) => void;
  height?: string;
  zoom?: number;
  interactive?: boolean;
}

declare global {
  interface Window {
    google: any;
  }
}

export default function GoogleMap({
  address,
  latitude,
  longitude,
  onLocationSelect,
  height = '400px',
  zoom = 15,
  interactive = true
}: GoogleMapProps) {
  const { user } = useAuth();
  const { isInnovationActive, isLoading } = useInnovations();
  const isActive = isInnovationActive('google-maps');

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [searchAddress, setSearchAddress] = useState(address || '');

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      console.error('Geolocalização não é suportada pelo seu navegador');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        if (map) {
          map.setCenter({ lat, lng });
          map.setZoom(16);

          if (marker) {
            marker.setMap(null);
          }

          const newMarker = new window.google.maps.Marker({
            position: { lat, lng },
            map: map,
            draggable: interactive,
          });

          setMarker(newMarker);

          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
            if (status === 'OK' && results[0] && onLocationSelect) {
              onLocationSelect({
                lat,
                lng,
                address: results[0].formatted_address
              });
            }
          });
        }
      },
      (error) => {
        console.error('Não foi possível obter sua localização', error);
      }
    );
  };

  const initializeMap = async () => {
    if (!mapRef.current || !isActive || isLoading) return;

    try {
      await loadGoogleMapsAPI();

      if (!isGoogleMapsLoaded()) {
        console.error('Google Maps API não foi carregada');
        return;
      }

      const defaultCenter = { lat: -23.5505, lng: -46.6333 };
      const center = latitude && longitude ? { lat: latitude, lng: longitude } : defaultCenter;

      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center,
        zoom,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: interactive,
        scrollwheel: interactive,
        disableDoubleClickZoom: !interactive,
        draggable: interactive,
      });

      mapInstanceRef.current = mapInstance;
      setMap(mapInstance);

      if (latitude && longitude) {
        const markerInstance = new window.google.maps.Marker({
          position: { lat: latitude, lng: longitude },
          map: mapInstance,
          title: address || 'Localização',
          draggable: interactive,
        });

        setMarker(markerInstance);

        if (interactive && onLocationSelect) {
          markerInstance.addListener('dragend', (event: any) => {
            const newLat = event.latLng.lat();
            const newLng = event.latLng.lng();

            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ location: { lat: newLat, lng: newLng } }, (results: any, status: any) => {
              if (status === 'OK' && results[0]) {
                onLocationSelect({
                  lat: newLat,
                  lng: newLng,
                  address: results[0].formatted_address
                });
              }
            });
          });
        }
      }

      if (interactive && onLocationSelect) {
        mapInstance.addListener('click', (event: any) => {
          const lat = event.latLng.lat();
          const lng = event.latLng.lng();

          if (marker) {
            marker.setMap(null);
          }

          const newMarker = new window.google.maps.Marker({
            position: { lat, lng },
            map: mapInstance,
            draggable: true,
          });

          setMarker(newMarker);

          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
            if (status === 'OK' && results[0]) {
              onLocationSelect({
                lat,
                lng,
                address: results[0].formatted_address
              });
            }
          });

          newMarker.addListener('dragend', (dragEvent: any) => {
            const newLat = dragEvent.latLng.lat();
            const newLng = dragEvent.latLng.lng();

            geocoder.geocode({ location: { lat: newLat, lng: newLng } }, (results: any, status: any) => {
              if (status === 'OK' && results[0]) {
                onLocationSelect({
                  lat: newLat,
                  lng: newLng,
                  address: results[0].formatted_address
                });
              }
            });
          });
        });
      }

      if (address && !latitude && !longitude) {
        setTimeout(() => searchLocation(), 1000);
      }
    } catch (err) {
      console.error('Erro ao inicializar mapa:', err);
    }
  };

  useEffect(() => {
    initializeMap();
  }, [latitude, longitude, isActive, isLoading]);

  useEffect(() => {
    if (map && address && !latitude && !longitude) {
      const timer = setTimeout(() => {
        searchLocation();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [map, address]);

  const searchLocation = () => {
    if (!map || !searchAddress.trim()) return;

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: searchAddress }, (results: any, status: any) => {
      if (status === 'OK' && results[0]) {
        const location = results[0].geometry.location;
        const lat = location.lat();
        const lng = location.lng();

        map.setCenter({ lat, lng });
        map.setZoom(16);

        // Remover marcador anterior
        if (marker) {
          marker.setMap(null);
        }

        // Criar novo marcador
        const newMarker = new window.google.maps.Marker({
          position: { lat, lng },
          map: map,
          draggable: interactive,
        });

        setMarker(newMarker);

        if (onLocationSelect) {
          onLocationSelect({
            lat,
            lng,
            address: results[0].formatted_address
          });
        }

        // Listener para arrastar o marcador
        if (interactive && onLocationSelect) {
          newMarker.addListener('dragend', (event: any) => {
            const newLat = event.latLng.lat();
            const newLng = event.latLng.lng();
            
            geocoder.geocode({ location: { lat: newLat, lng: newLng } }, (results: any, status: any) => {
              if (status === 'OK' && results[0]) {
                onLocationSelect({
                  lat: newLat,
                  lng: newLng,
                  address: results[0].formatted_address
                });
              }
            });
          });
        }
      } else {
        console.error('Endereço não encontrado');
      }
    });
  };

  if (isLoading) {
    return (
      <div 
        className="w-full flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg p-6 text-center"
        style={{ minHeight: height }}
      >
        <p className="text-gray-500 animate-pulse">Carregando permissões...</p>
      </div>
    );
  }

  if (!isActive) {
    return (
      <div 
        className="w-full flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg p-6 text-center"
        style={{ minHeight: height }}
      >
        <div className="max-w-md bg-yellow-50 border border-yellow-200 rounded-lg p-6 flex flex-col items-center gap-3">
          <Info className="w-10 h-10 text-yellow-500 mb-2" />
          <h3 className="text-yellow-800 font-semibold text-lg">Integração Google Maps Premium não está habilitada</h3>
          <p className="text-yellow-700 text-sm">
            Para utilizar o rastreamento em tempo real, cálculo de rotas e visualização de mapas, solicite a ativação ao administrador em:
          </p>
          <span className="text-yellow-800 font-medium bg-yellow-100 px-3 py-1 rounded-md text-xs mt-1">
            Menu {'>'} Inovações & Sugestões {'>'} Ativar Recurso
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-2 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800">
      {interactive && (
        <div className="flex gap-2">
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              placeholder="Digite um endereço para buscar..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
            />
            <button
              onClick={searchLocation}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              Buscar
            </button>
          </div>
          <button
            onClick={getCurrentLocation}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
            title="Usar minha localização atual"
          >
            <Navigation className="h-4 w-4" />
            Minha Localização
          </button>
        </div>
      )}
      
      <div 
        ref={mapRef} 
        className="w-full rounded-lg border border-gray-300"
        style={{ height }}
      />
      
      {interactive && (
        <div className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 p-3 rounded-lg">
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-600" />
            <strong>Dica:</strong> Clique no mapa ou arraste o marcador para selecionar uma localização
          </p>
        </div>
      )}
    </div>
  );
}