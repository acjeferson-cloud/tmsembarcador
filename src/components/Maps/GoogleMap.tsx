import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Search, Info } from 'lucide-react';
import { loadGoogleMapsAPI, isGoogleMapsLoaded } from '../../utils/googleMapsLoader';
import { useInnovations } from '../../contexts/InnovationsContext';
import { useAuth } from '../../hooks/useAuth';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

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

      }
    );
  };

  const initializeMap = async () => {
    if (!mapRef.current || !isActive || isLoading) return;

    try {
      await loadGoogleMapsAPI();

      if (!isGoogleMapsLoaded()) {

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
    // Fix leaflet icons
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });

    const defaultCenter = { lat: -23.5505, lng: -46.6333 };
    const center = latitude && longitude ? { lat: latitude, lng: longitude } : defaultCenter;

    const LocationMarker = () => {
      const [position, setPosition] = useState<any>(latitude && longitude ? { lat: latitude, lng: longitude } : null);
      
      const mapEvent = useMapEvents({
        click(e: any) {
          if (!interactive) return;
          setPosition(e.latlng);
          if (onLocationSelect) {
            onLocationSelect({
              lat: e.latlng.lat,
              lng: e.latlng.lng,
              address: `${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)} (OpenStreetMap)`
            });
          }
        },
      });

      return position === null ? null : (
        <Marker 
          position={position}
          draggable={interactive}
          eventHandlers={{
            dragend(e: any) {
              const marker = e.target;
              const pos = marker.getLatLng();
              setPosition(pos);
              if (onLocationSelect) {
                onLocationSelect({
                  lat: pos.lat,
                  lng: pos.lng,
                  address: `${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)} (OpenStreetMap)`
                });
              }
            }
          }}
        />
      );
    };

    return (
      <div className="w-full flex flex-col gap-2 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800">
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border-b border-yellow-200 dark:border-yellow-800 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-400 text-sm">
            <Info size={16} />
            <span>Usando modo de compatibilidade (OpenStreetMap). Google Maps não ativado.</span>
          </div>
        </div>

        {interactive && (
          <div className="flex gap-2">
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                placeholder="Busca de endereço indisponível no modo de compatibilidade"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none bg-gray-100 cursor-not-allowed"
                disabled
              />
              <button
                disabled
                className="px-4 py-2 bg-gray-400 text-white rounded-md cursor-not-allowed flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                Buscar
              </button>
            </div>
            <button
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition((position) => {
                    if (onLocationSelect) {
                      onLocationSelect({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        address: `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)} (Localização Atual)`
                      });
                    }
                  });
                }
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
              title="Usar minha localização atual"
            >
              <Navigation className="h-4 w-4" />
              Minha Localização
            </button>
          </div>
        )}
        
        <div className="w-full rounded-lg border border-gray-300 overflow-hidden" style={{ height }}>
          <MapContainer 
            center={[center.lat, center.lng]} 
            zoom={zoom} 
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={interactive}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            <LocationMarker />
          </MapContainer>
        </div>
        
        {interactive && (
          <div className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 p-3 rounded-lg">
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              <strong>Dica:</strong> Clique no mapa ou arraste o marcador para selecionar uma localização aproximada.
            </p>
          </div>
        )}
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
