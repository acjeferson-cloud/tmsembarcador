import React, { useState, useEffect, useRef } from 'react';
import { dashboardService, DashboardFilters, DashboardMapaCusto } from '../../services/dashboardService';
import { AlertCircle } from 'lucide-react';
import { loadGoogleMapsAPI } from '../../utils/googleMapsLoader';
import { useInnovations } from '../../contexts/InnovationsContext';

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
  const { isInnovationActive } = useInnovations();
  const isActive = isInnovationActive('google-maps');
  const isLoadingInnovation = false; // Como usa o context global, não precisamos de loading local que causava flicker

  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const circlesRef = useRef<google.maps.Circle[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapData, setMapData] = useState<DashboardMapaCusto[]>([]);
  
  // Geocoded data cache
  const [geocodedLocations, setGeocodedLocations] = useState<Record<string, {lat: number, lng: number}>>({});
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);

  useEffect(() => {
    loadGoogleMapsAPI()
      .then(() => setIsLoaded(true))
      .catch((err) => setLoadError(err));
  }, []);

  useEffect(() => {
    loadData();
  }, [filters]);

  useEffect(() => {
    if (isLoaded && !geocoderRef.current) {
      geocoderRef.current = new google.maps.Geocoder();
    }
    
    if (isLoaded && mapRef.current && !mapInstance) {
      const map = new google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: defaultZoom,
        disableDefaultUI: false,
        styles: [
          {
            featureType: 'administrative.country',
            elementType: 'geometry.stroke',
            stylers: [{ color: '#4b6878' }]
          }
        ]
      });
      setMapInstance(map);
      infoWindowRef.current = new google.maps.InfoWindow();
    }
  }, [isLoaded, mapInstance]);

  useEffect(() => {
    // Only geocode if we have data and the geocoder is ready
    if (mapData.length > 0 && geocoderRef.current) {
      geocodeCities(mapData.slice(0, 50)); // Limit to Top 50 to avoid API limits
    }
  }, [mapData, isLoaded]);

  useEffect(() => {
    if (!mapInstance || mapData.length === 0) return;

    // Clear previous circles
    circlesRef.current.forEach(c => c.setMap(null));
    circlesRef.current = [];

    const maxCost = Math.max(...mapData.map(d => d.custoTotal), 1);
    const getRadius = (cost: number) => {
      const minRadius = 15000; // 15km
      const maxRadius = 100000; // 100km
      return minRadius + (cost / maxCost) * (maxRadius - minRadius);
    };

    mapData.slice(0, 50).forEach((city) => {
      const addressKey = `${city.cidade}, ${city.uf}, Brasil`;
      const coords = geocodedLocations[addressKey];
      
      if (!coords) return;
      
      const isHighCost = city.custoTotal > (maxCost * 0.5);

      const circle = new google.maps.Circle({
        map: mapInstance,
        center: coords,
        radius: getRadius(city.custoTotal),
        fillColor: isHighCost ? '#EF4444' : '#3B82F6',
        fillOpacity: 0.6,
        strokeColor: isHighCost ? '#DC2626' : '#2563EB',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        clickable: true
      });

      circle.addListener('click', () => {
        if (infoWindowRef.current) {
          infoWindowRef.current.setContent(buildInfoWindowContent(city));
          infoWindowRef.current.setPosition(coords);
          infoWindowRef.current.open(mapInstance);
        }
      });

      circlesRef.current.push(circle);
    });

  }, [mapInstance, mapData, geocodedLocations]);

  const buildInfoWindowContent = (city: DashboardMapaCusto) => {
    let cteHtml = '';
    if (city.ctes && city.ctes.length > 0) {
      cteHtml = `
        <div style="margin-top: 8px; max-height: 192px; overflow-y: auto; padding-right: 4px;">
          <p style="font-size: 10px; font-weight: 600; color: #374151; text-transform: uppercase; position: sticky; top: 0; background: white; margin: 0 0 4px 0;">Documentos Vinculados</p>
          ${city.ctes.map(cte => `
            <div style="background: #F9FAFB; border-radius: 4px; padding: 8px; margin-bottom: 8px; font-size: 10px; border: 1px solid #F3F4F6;">
              <div style="display: flex; justify-content: space-between; font-weight: bold; color: #374151; margin-bottom: 4px;">
                <span>CT-e: ${cte.serie}/${cte.numero}</span>
              </div>
              <p style="color: #4B5563; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin: 0 0 2px 0;">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; margin-right: 2px;"><path d="M10 17h4V5H2v12h3"></path><path d="M20 17h2v-9h-5V5H10"></path><path d="M15 13H5"></path><circle cx="6.5" cy="17.5" r="2.5"></circle><circle cx="17.5" cy="17.5" r="2.5"></circle></svg>
                ${cte.transportador}
              </p>
              <p style="color: #6B7280; margin: 0;">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; margin-right: 2px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                Data: ${new Date(cte.emissao).toLocaleDateString('pt-BR')}
              </p>
            </div>
          `).join('')}
        </div>
      `;
    }

    return `
      <div style="padding: 4px; min-width: 200px; color: #1F2937; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <h4 style="font-weight: bold; font-size: 14px; border-bottom: 1px solid #E5E7EB; padding-bottom: 4px; margin: 0 0 8px 0;">
          ${city.cidade} - ${city.uf}
        </h4>
        <div style="font-size: 12px;">
          <p style="display: flex; justify-content: space-between; margin: 0 0 4px 0;">
            <span style="color: #6B7280;">Custo Total:</span>
            <span style="font-weight: 600; color: #DC2626;">R$ ${city.custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </p>
          <p style="display: flex; justify-content: space-between; margin: 0 0 4px 0;">
            <span style="color: #6B7280;">Volume:</span>
            <span style="font-weight: 500;">${city.volumeKg.toLocaleString('pt-BR')} Kg</span>
          </p>
          <p style="display: flex; justify-content: space-between; border-bottom: 1px solid #E5E7EB; padding-bottom: 8px; margin: 0;">
            <span style="color: #6B7280;">Entregas Totais:</span>
            <span style="font-weight: 500;">${city.totalEntregas}</span>
          </p>
          ${cteHtml}
        </div>
      </div>
    `;
  };

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
    // Mapeamento local para não tentar repetidas vezes o mesmo endereço
    const inProgressOrDone = new Set(Object.keys(geocodedLocations));
    
    for (const item of citiesToGeocode) {
      const addressKey = `${item.cidade}, ${item.uf}, Brasil`;
      
      if (!inProgressOrDone.has(addressKey)) {
        inProgressOrDone.add(addressKey);
        
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
            const newCoords = { lat: loc.lat(), lng: loc.lng() };
            // Atualiza o state local para desenhar o pin imediatamente
            setGeocodedLocations(prev => ({ ...prev, [addressKey]: newCoords }));
          }
          
          // Delay ligeiramente maior para evitar OVER_QUERY_LIMIT do Google Maps
          await new Promise(r => setTimeout(r, 400));
        } catch (err) {
          console.warn('Falha ao geocodificar:', addressKey, err);
          // Continua o loop mesmo se der erro num específico (ex: endereço não encontrado)
        }
      }
    }
  };

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

        <div className="relative w-full" style={containerStyle}>
          {!isActive && !isLoadingInnovation ? (
            <div className="absolute inset-0 z-10 w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center">
              <div className="max-w-md bg-yellow-50 border border-yellow-200 rounded-lg p-6 flex flex-col items-center gap-3">
                <AlertCircle className="w-10 h-10 text-yellow-500 mb-2" />
                <h3 className="text-yellow-800 font-semibold text-lg">Integração Google Maps Premium não habilitada</h3>
                <p className="text-yellow-700 text-sm">
                  Para visualizar a densidade financeira geolocalizada entre as 50 principais cidades, solicite a ativação ao administrador em:
                </p>
                <span className="text-yellow-800 font-medium bg-yellow-100 px-3 py-1 rounded-md text-xs mt-1">
                  Menu {'>'} Inovações & Sugestões {'>'} Ativar Recurso
                </span>
              </div>
            </div>
          ) : (
            <>
              {(loading || !isLoaded) && (
                <div className="absolute inset-0 z-10 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center animate-pulse">
                   <p className="text-gray-400">Carregando mapa...</p>
                </div>
              )}
              <div
                ref={mapRef}
                className="w-full h-full rounded-xl border border-gray-300 dark:border-gray-600"
              />
            </>
          )}
        </div>
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
