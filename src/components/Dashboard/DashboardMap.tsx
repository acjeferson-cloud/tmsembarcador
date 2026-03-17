import React, { useState, useEffect, useRef } from 'react';
import { useJsApiLoader, GoogleMap, Circle, InfoWindow } from '@react-google-maps/api';
import { dashboardService, DashboardFilters, DashboardMapaCusto } from '../../services/dashboardService';
import { AlertCircle, Map } from 'lucide-react';

interface Props {
  filters: DashboardFilters;
}

const containerStyle = {
  width: '100%',
  height: '600px',
  borderRadius: '0.75rem'
};

const defaultCenter = { lat: -14.235, lng: -51.925 };
const defaultZoom = 4;

export const DashboardMap: React.FC<Props> = ({ filters }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapData, setMapData] = useState<DashboardMapaCusto[]>([]);
  
  // Geocoded data cache
  const [geocodedLocations, setGeocodedLocations] = useState<Record<string, {lat: number, lng: number}>>({});
  const [selectedCity, setSelectedCity] = useState<DashboardMapaCusto | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey || '',
    language: 'pt-BR',
    region: 'BR',
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  useEffect(() => {
    if (isLoaded && !geocoderRef.current) {
      geocoderRef.current = new google.maps.Geocoder();
    }
  }, [isLoaded]);

  useEffect(() => {
    // Only geocode if we have data and the geocoder is ready
    if (mapData.length > 0 && geocoderRef.current) {
      geocodeCities(mapData.slice(0, 50)); // Limit to Top 50 to avoid API limits
    }
  }, [mapData, isLoaded]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardService.getMapaCustos(filters);
      setMapData(data || []);
    } catch (e) {
      setError('Falha ao carregar dados geográficos do Dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const geocodeCities = async (citiesToGeocode: DashboardMapaCusto[]) => {
    const newGeocoded: Record<string, {lat: number, lng: number}> = { ...geocodedLocations };
    
    for (const item of citiesToGeocode) {
      const addressKey = `${item.cidade}, ${item.uf}, Brasil`;
      
      if (!newGeocoded[addressKey]) {
        try {
          const response = await new Promise<google.maps.GeocoderResponse>((resolve, reject) => {
            geocoderRef.current?.geocode({ address: addressKey }, (results, status) => {
              if (status === google.maps.GeocoderStatus.OK && results) {
                resolve({ results });
              } else {
                reject(status);
              }
            });
          });
          
          if (response.results && response.results.length > 0) {
            const loc = response.results[0].geometry.location;
            newGeocoded[addressKey] = { lat: loc.lat(), lng: loc.lng() };
          }
          
          // Small delay to respect rate limits
          await new Promise(r => setTimeout(r, 200));
        } catch (err) {
          console.warn('Falha ao geocodificar:', addressKey, err);
        }
      }
    }
    
    setGeocodedLocations(newGeocoded);
  };

  if (!apiKey) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-6 rounded-lg flex flex-col items-center justify-center gap-3 text-center h-64">
        <Map size={32} />
        <h3 className="font-semibold text-lg">Chave de API do Google Maps Não Configurada</h3>
        <p>A variável VITE_GOOGLE_MAPS_API_KEY não foi encontrada no arquivo .env.</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-3">
        <AlertCircle size={20} />
        <p>Erro ao inicializar o Google Maps. Verifique a chave de API ou conexão.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-3">
        <AlertCircle size={20} />
        <p>{error}</p>
      </div>
    );
  }

  // Calculate dynamic radius based on cost
  const maxCost = mapData.length > 0 ? Math.max(...mapData.map(d => d.custoTotal)) : 1;
  const getRadius = (cost: number) => {
    const minRadius = 15000; // 15km
    const maxRadius = 100000; // 100km
    return minRadius + (cost / maxCost) * (maxRadius - minRadius);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Mapa de Densidade Financeira</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Distribuição de Custo de Frete por Destino (Top 50 cidades)
            </p>
          </div>
        </div>

        {loading || !isLoaded ? (
          <div className="w-full h-[600px] bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center animate-pulse">
            <p className="text-gray-400">Carregando mapa...</p>
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={defaultCenter}
            zoom={defaultZoom}
            options={{
              disableDefaultUI: false,
              styles: [
                {
                  featureType: 'administrative.country',
                  elementType: 'geometry.stroke',
                  stylers: [{ color: '#4b6878' }]
                }
              ] // Can add a dark/light mode JSON style here
            }}
          >
            {mapData.slice(0, 50).map((city, idx) => {
              const addressKey = `${city.cidade}, ${city.uf}, Brasil`;
              const coords = geocodedLocations[addressKey];
              
              if (!coords) return null;
              
              const isHighCost = city.custoTotal > (maxCost * 0.5);

              return (
                <Circle
                  key={idx}
                  center={coords}
                  radius={getRadius(city.custoTotal)}
                  options={{
                    fillColor: isHighCost ? '#EF4444' : '#3B82F6', // Red for top 50%, Blue for lower
                    fillOpacity: 0.6,
                    strokeColor: isHighCost ? '#DC2626' : '#2563EB',
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    clickable: true
                  }}
                  onClick={() => setSelectedCity(city)}
                />
              );
            })}

            {selectedCity && geocodedLocations[`${selectedCity.cidade}, ${selectedCity.uf}, Brasil`] && (
              <InfoWindow
                position={geocodedLocations[`${selectedCity.cidade}, ${selectedCity.uf}, Brasil`]}
                onCloseClick={() => setSelectedCity(null)}
              >
                <div className="p-1 min-w-[200px] text-gray-800">
                  <h4 className="font-bold text-sm border-b pb-1 mb-2">
                    {selectedCity.cidade} - {selectedCity.uf}
                  </h4>
                  <div className="text-sm space-y-1">
                    <p className="flex justify-between">
                      <span className="text-gray-500">Custo Total:</span>
                      <span className="font-semibold text-red-600">R$ {selectedCity.custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-500">Volume:</span>
                      <span className="font-medium">{selectedCity.volumeKg.toLocaleString('pt-BR')} Kg</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-500">Entregas:</span>
                      <span className="font-medium">{selectedCity.totalEntregas}</span>
                    </p>
                  </div>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        )}
      </div>
      
      {/* Top 10 List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
         <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top 10 Cidades Destino Mais Onerosas</h3>
         <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cidade / UF</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Custo de Frete</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total de Cargas</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {mapData.slice(0, 10).map((city, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {city.cidade} - {city.uf}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-red-600 dark:text-red-400">
                       R$ {city.custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                       {city.totalEntregas}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};
