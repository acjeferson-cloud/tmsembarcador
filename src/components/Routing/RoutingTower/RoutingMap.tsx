import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Order } from '../../../services/ordersService';
import { Establishment } from '../../../services/establishmentsService';
import { useInnovations } from '../../../hooks/useInnovations';
import { loadGoogleMapsAPI } from '../../../utils/googleMapsLoader';
import { getOsrmRoute } from '../../../utils/osrmRouter';
import { nominatimGeocoder } from '../../../utils/nominatimGeocoder';
import { Loader, Info, MapPin, Building2 } from 'lucide-react';

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icons
const createCustomIcon = (color: string, label?: string | number) => {
  const innerHtml = label 
    ? `<span style="transform: rotate(45deg); color: white; font-weight: 800; font-size: 13px; font-family: sans-serif; display: block;">${label}</span>`
    : `<div style="width: 8px; height: 8px; background-color: white; border-radius: 50%;"></div>`;

  return new L.DivIcon({
    className: 'custom-icon',
    html: `
      <div style="
        background-color: ${color};
        width: 28px;
        height: 28px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        ${innerHtml}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
};

const unselectedIcon = createCustomIcon('#6366f1'); // Indigo
const selectedIcon = createCustomIcon('#10b981');   // Emerald
const establishmentIcon = createCustomIcon('#1e293b'); // Slate/Dark Gray

interface MapUpdaterProps {
  markers: [number, number][];
}

const MapUpdater: React.FC<MapUpdaterProps> = ({ markers }) => {
  const map = useMap();
  
  // Usar a stringificação dos markers para evitar re-render/zoom a cada ciclo do React
  const markersStr = JSON.stringify(markers);

  useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [markersStr, map]);
  
  return null;
};

interface RoutingMapProps {
  pendingOrders: Order[];
  selectedOrders: Order[];
  establishment?: Establishment | null;
  onRouteCalculated?: (distanceKm: number, timeMin: number, outboundDistanceKm?: number, returnDistanceKm?: number) => void;
}

export const RoutingMap: React.FC<RoutingMapProps> = ({ pendingOrders, selectedOrders, establishment, onRouteCalculated }) => {
  const { isInnovationActive, isLoading: isContextLoading } = useInnovations();
  const isActive = isInnovationActive('google-maps');
  
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  
  const [coordsMap, setCoordsMap] = useState<Record<string, [number, number]>>({});
  const [osrmRoute, setOsrmRoute] = useState<[number, number][]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);

  const mappedOrders = [
    ...pendingOrders.map(o => ({ ...o, isSelected: false })),
    ...selectedOrders.map(o => ({ ...o, isSelected: true }))
  ];

  // Geocode all orders + establishment
  useEffect(() => {
    let mounted = true;
    
    const loadCoords = async () => {
      const newCoords = { ...coordsMap };
      let changed = false;

      // Geocode establishment
      if (establishment && !newCoords['ESTABLISHMENT']) {
         const estParts = [
           establishment.logradouro || establishment.endereco,
           establishment.numero,
           establishment.bairro,
           establishment.cidade,
           establishment.estado
         ].filter(Boolean);
         
         let estAddress = `${estParts.join(', ')}, Brasil`;
         let estCoords = await nominatimGeocoder.geocode(estAddress);
         
         // Fallback to city/state
         if (!estCoords && establishment.cidade) {
            estAddress = `${establishment.cidade}, ${establishment.estado}, Brasil`;
            estCoords = await nominatimGeocoder.geocode(estAddress);
         }

         if (estCoords && mounted) {
           newCoords['ESTABLISHMENT'] = [estCoords.lat, estCoords.lng];
           changed = true;
         } else if (mounted) {
           console.warn('Falha ao geocodificar o endereço do estabelecimento.');
         }
      }

      // Geocode orders
      for (const order of mappedOrders) {
        if (!mounted) break;
        if (!newCoords[(order.id || order.order_number)]) {
          // Try full address first
          const parts = [
            order.destination_street,
            order.destination_number,
            order.destination_neighborhood,
            order.destination_city,
            order.destination_state
          ].filter(Boolean);
          
          let addressString = `${parts.join(', ')}, Brasil`;
          let coords = await nominatimGeocoder.geocode(addressString);
          
          // Fallback to city/state if full address fails
          if (!coords && order.destination_street) {
             addressString = `${order.destination_city}, ${order.destination_state}, Brasil`;
             coords = await nominatimGeocoder.geocode(addressString);
          }

          if (coords && mounted) {
            // Check for exact duplicates to add jitter (prevent overlap)
            let finalLat = coords.lat;
            let finalLng = coords.lng;
            
            Object.values(newCoords).forEach(existing => {
               if (existing[0] === finalLat && existing[1] === finalLng) {
                  // Add ~10-20 meters of random offset (approx 0.0001 to 0.0002 degrees)
                  finalLat += (Math.random() - 0.5) * 0.0002;
                  finalLng += (Math.random() - 0.5) * 0.0002;
               }
            });

            newCoords[(order.id || order.order_number)] = [finalLat, finalLng];
            changed = true;
          }
        }
      }

      if (changed && mounted) {
         setCoordsMap(newCoords);
      }
    };
    
    loadCoords();
    return () => { mounted = false; };
  }, [pendingOrders, selectedOrders, establishment]); // Depend on orders and establishment

  // Load Google Maps API
  useEffect(() => {
    if (isActive) {
      loadGoogleMapsAPI()
        .then(() => setIsLoaded(true))
        .catch((err) => setLoadError(err));
    }
  }, [isActive]);

  // Google Maps init
  useEffect(() => {
    if (isActive && isLoaded && mapRef.current && !mapInstance && !isContextLoading) {
      const map = new google.maps.Map(mapRef.current, {
        center: { lat: -23.5505, lng: -46.6333 },
        zoom: 11,
        disableDefaultUI: false,
      });
      setMapInstance(map);
      directionsServiceRef.current = new google.maps.DirectionsService();
      directionsRendererRef.current = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true, // We draw our own custom markers
        polylineOptions: {
          strokeColor: '#10b981',
          strokeWeight: 4,
          strokeOpacity: 0.8
        }
      });
    }
  }, [isActive, isLoaded, mapInstance, isContextLoading]);

  // Route drawing logic (Google)
  useEffect(() => {
    if (!isActive || !mapInstance || !directionsServiceRef.current || !directionsRendererRef.current) return;

    // Clear old markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    const bounds = new google.maps.LatLngBounds();
    let hasPoints = false;

    // Draw markers
    mappedOrders.forEach(order => {
      const coords = coordsMap[(order.id || order.order_number)];
      if (coords) {
        hasPoints = true;
        const position = { lat: coords[0], lng: coords[1] };
        bounds.extend(position);

        const marker = new google.maps.Marker({
          position,
          map: mapInstance,
          title: order.order_number,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: order.isSelected ? '#10b981' : '#6366f1',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
            scale: 8
          }
        });
        
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 4px; font-family: sans-serif;">
              <p style="font-weight: bold; margin: 0 0 4px 0;">${order.order_number}</p>
              <p style="font-size: 12px; margin: 0;">${order.customer_name}</p>
              <p style="font-size: 11px; color: #666; margin: 2px 0 0 0;">${order.destination_city} - ${order.destination_state}</p>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(mapInstance, marker);
        });

        markersRef.current.push(marker);
      }
    });

    if (hasPoints) {
      mapInstance.fitBounds(bounds);
    }

    // Draw route
    const selectedWithCoords = selectedOrders.filter(o => coordsMap[o.id!]);
    const estCoords = coordsMap['ESTABLISHMENT'];
    
    // Draw establishment marker if exists
    if (estCoords) {
        hasPoints = true;
        const position = { lat: estCoords[0], lng: estCoords[1] };
        bounds.extend(position);

        const estMarker = new google.maps.Marker({
          position,
          map: mapInstance,
          title: establishment?.nome_fantasia || 'Estabelecimento',
          icon: {
            path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
            fillColor: '#1e293b',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
            scale: 6
          }
        });
        
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 4px; font-family: sans-serif;">
              <p style="font-weight: bold; margin: 0 0 4px 0;">📍 ${establishment?.nome_fantasia || 'Origem'}</p>
              <p style="font-size: 11px; color: #666; margin: 2px 0 0 0;">Estabelecimento Emissor</p>
            </div>
          `
        });

        estMarker.addListener('click', () => {
          infoWindow.open(mapInstance, estMarker);
        });

        markersRef.current.push(estMarker);
    }

    if (hasPoints) {
      mapInstance.fitBounds(bounds);
    }

    if (selectedWithCoords.length > 0 && estCoords) {
      // Origin and destination are the establishment
      const origin = estCoords;
      const destination = estCoords;
      
      const waypoints = selectedWithCoords.map(o => ({
        location: { lat: coordsMap[o.id!][0], lng: coordsMap[o.id!][1] },
        stopover: true
      }));

      directionsServiceRef.current.route(
        {
          origin: { lat: origin[0], lng: origin[1] },
          destination: { lat: destination[0], lng: destination[1] },
          waypoints,
          optimizeWaypoints: true,
          travelMode: google.maps.TravelMode.DRIVING
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            directionsRendererRef.current?.setDirections(result);
            
            // Calculate total distance and time
            let totalDistanceMeters = 0;
            let totalDurationSeconds = 0;
            let outboundDistanceMeters = 0;
            let returnDistanceMeters = 0;
            
            const legs = result.routes[0]?.legs || [];
            legs.forEach((leg, index) => {
              if (leg.distance) {
                 totalDistanceMeters += leg.distance.value;
                 // If it's the last leg, it's the return
                 if (index === legs.length - 1 && legs.length > 1) {
                    returnDistanceMeters += leg.distance.value;
                 } else {
                    outboundDistanceMeters += leg.distance.value;
                 }
              }
              if (leg.duration) totalDurationSeconds += leg.duration.value;
            });
            
            if (onRouteCalculated) {
              onRouteCalculated(totalDistanceMeters / 1000, totalDurationSeconds / 60, outboundDistanceMeters / 1000, returnDistanceMeters / 1000);
            }
          } else {
            console.error('Directions request failed due to ' + status);
            directionsRendererRef.current?.setDirections({ routes: [] } as any);
            if (onRouteCalculated) onRouteCalculated(0, 0, 0, 0);
          }
        }
      );
    } else {
       directionsRendererRef.current?.setDirections({ routes: [] } as any);
       if (onRouteCalculated) onRouteCalculated(0, 0, 0, 0);
    }

  }, [mappedOrders, coordsMap, isActive, mapInstance, selectedOrders, onRouteCalculated]);

  // Route drawing logic (OSM)
  useEffect(() => {
    if (isActive) return; // Don't run OSRM if using Google

    const fetchOsrm = async () => {
      const selectedWithCoords = selectedOrders.filter(o => coordsMap[o.id!]);
      const estCoords = coordsMap['ESTABLISHMENT'];

      if (selectedWithCoords.length > 0 && estCoords) {
        // Start at establishment, go through orders, end at establishment
        const points = [
          { lat: estCoords[0], lng: estCoords[1] },
          ...selectedWithCoords.map(o => ({
            lat: coordsMap[o.id!][0],
            lng: coordsMap[o.id!][1]
          })),
          { lat: estCoords[0], lng: estCoords[1] }
        ];
        const { routeCoords, distanceKm, timeMin, outboundDistanceKm, returnDistanceKm } = await getOsrmRoute(points);
        setOsrmRoute(routeCoords);
        if (onRouteCalculated) {
           onRouteCalculated(distanceKm, timeMin, outboundDistanceKm, returnDistanceKm);
        }
      } else {
        setOsrmRoute([]);
        if (onRouteCalculated) onRouteCalculated(0, 0, 0, 0);
      }
    };

    fetchOsrm();
  }, [selectedOrders, coordsMap, isActive, onRouteCalculated]);

  const markersData = mappedOrders.filter(o => coordsMap[o.id!]).map(order => ({
    order,
    coords: coordsMap[(order.id || order.order_number)],
    isSelected: order.isSelected
  }));

  if (isContextLoading) {
     return (
       <div className="h-full w-full flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg">
          <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
       </div>
     );
  }

  return (
    <div className="h-full w-full bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 relative z-0">
      
      {isActive ? (
        <>
          <div className="absolute top-4 right-4 z-[1000] bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 px-4 py-2 rounded-lg shadow-sm flex items-center gap-2">
            <Info className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            <span className="text-xs text-yellow-800 dark:text-yellow-400 font-medium">Modo Google Maps (Directions) Ativo</span>
          </div>
          <div ref={mapRef} className="w-full h-full" />
        </>
      ) : (
        <>
          <div className="absolute top-4 right-4 z-[1000] bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 px-4 py-2 rounded-lg shadow-sm flex items-center gap-2">
            <Info className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            <span className="text-xs text-yellow-800 dark:text-yellow-400 font-medium">Modo OSM (OSRM Router) Ativo</span>
          </div>
          <MapContainer 
            center={[-23.5505, -46.6333]} 
            zoom={11} 
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            
            {coordsMap['ESTABLISHMENT'] && (
              <Marker 
                position={coordsMap['ESTABLISHMENT']}
                icon={establishmentIcon}
                zIndexOffset={2000}
              >
                <Popup>
                  <div className="p-1 text-center">
                    <Building2 className="w-6 h-6 mx-auto text-slate-800 mb-1" />
                    <p className="font-bold text-gray-900">{establishment?.nome_fantasia || 'Origem'}</p>
                    <p className="text-xs text-gray-500 mt-1">Estabelecimento Emissor</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {markersData.map((marker, idx) => {
              const selectedIndex = marker.isSelected 
                ? selectedOrders.findIndex(o => (o.id === marker.order.id || o.order_number === marker.order.order_number))
                : -1;
              
              const icon = marker.isSelected 
                ? createCustomIcon('#10b981', selectedIndex >= 0 ? selectedIndex + 1 : undefined)
                : unselectedIcon;

              return (
                <Marker 
                  key={marker.order.id || idx} 
                  position={marker.coords}
                  icon={icon}
                  zIndexOffset={marker.isSelected ? 1000 : 0}
                >
                <Popup>
                  <div className="p-1">
                    <p className="font-bold text-gray-900">{marker.order.order_number}</p>
                    <p className="text-sm text-gray-600">{marker.order.customer_name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {marker.order.destination_city} - {marker.order.destination_state}
                    </p>
                    <p className="text-xs font-semibold mt-1">
                      Peso: {marker.order.weight?.toFixed(1)} kg
                    </p>
                  </div>
                </Popup>
              </Marker>
            );
          })}

            {osrmRoute.length > 0 && (
              <Polyline 
                positions={osrmRoute} 
                color="#10b981" 
                weight={4}
                opacity={0.8}
              />
            )}

            <MapUpdater markers={[
              ...markersData.map(m => m.coords),
              ...(coordsMap['ESTABLISHMENT'] ? [coordsMap['ESTABLISHMENT']] : [])
            ]} />
          </MapContainer>
        </>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-gray-900/90 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 backdrop-blur-sm z-[1000]">
        <h4 className="text-xs font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wider">Legenda</h4>
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-3 h-3 rounded-full bg-slate-800 border border-white shadow-sm flex items-center justify-center">
             <div className="w-1 h-1 bg-white rounded-full"></div>
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-300">Estabelecimento (Origem/Fim)</span>
        </div>
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-3 h-3 rounded-full bg-indigo-500 border border-white shadow-sm flex items-center justify-center">
             <div className="w-1 h-1 bg-white rounded-full"></div>
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-300">Carga Disponível</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500 border border-white shadow-sm flex items-center justify-center">
             <div className="w-1 h-1 bg-white rounded-full"></div>
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-300">Em Romaneio</span>
        </div>
      </div>
    </div>
  );
};
