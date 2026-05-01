import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Order } from '../../../services/ordersService';
import { useInnovations } from '../../../contexts/InnovationsContext';
import { loadGoogleMapsAPI } from '../../../utils/googleMapsLoader';
import { getOsrmRoute } from '../../../utils/osrmRouter';
import { nominatimGeocoder } from '../../../utils/nominatimGeocoder';
import { Loader, Info, MapPin } from 'lucide-react';

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icons
const createCustomIcon = (color: string) => {
  return new L.DivIcon({
    className: 'custom-icon',
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 8px;
          height: 8px;
          background-color: white;
          border-radius: 50%;
        "></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  });
};

const unselectedIcon = createCustomIcon('#6366f1'); // Indigo
const selectedIcon = createCustomIcon('#10b981');   // Emerald

interface MapUpdaterProps {
  markers: [number, number][];
}

const MapUpdater: React.FC<MapUpdaterProps> = ({ markers }) => {
  const map = useMap();
  
  useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [markers, map]);
  
  return null;
};

interface RoutingMapProps {
  pendingOrders: Order[];
  selectedOrders: Order[];
  onRouteCalculated?: (distanceKm: number, timeMin: number) => void;
}

export const RoutingMap: React.FC<RoutingMapProps> = ({ pendingOrders, selectedOrders, onRouteCalculated }) => {
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

  // Geocode all orders
  useEffect(() => {
    let mounted = true;
    
    const loadCoords = async () => {
      // Limit to max 50 points to avoid huge queues, but ideally handle all in view
      for (const order of mappedOrders) {
        if (!mounted) break;
        if (!coordsMap[order.id!]) {
          const addressString = `${order.destination_city}, ${order.destination_state}, Brasil`;
          const coords = await nominatimGeocoder.geocode(addressString);
          if (coords && mounted) {
            setCoordsMap(prev => ({ ...prev, [order.id!]: [coords.lat, coords.lng] }));
          }
        }
      }
    };
    
    loadCoords();
    return () => { mounted = false; };
  }, [pendingOrders, selectedOrders]); // Depend on orders so if new arrive, we geocode

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
      const coords = coordsMap[order.id!];
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
    if (selectedWithCoords.length > 1) {
      const origin = coordsMap[selectedWithCoords[0].id!];
      const destination = coordsMap[selectedWithCoords[selectedWithCoords.length - 1].id!];
      const waypoints = selectedWithCoords.slice(1, -1).map(o => ({
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
            const legs = result.routes[0]?.legs || [];
            legs.forEach(leg => {
              if (leg.distance) totalDistanceMeters += leg.distance.value;
              if (leg.duration) totalDurationSeconds += leg.duration.value;
            });
            
            if (onRouteCalculated) {
              onRouteCalculated(totalDistanceMeters / 1000, totalDurationSeconds / 60);
            }
          } else {
            console.error('Directions request failed due to ' + status);
            directionsRendererRef.current?.setDirections({ routes: [] } as any);
            if (onRouteCalculated) onRouteCalculated(0, 0);
          }
        }
      );
    } else {
       directionsRendererRef.current?.setDirections({ routes: [] } as any);
       if (onRouteCalculated) onRouteCalculated(0, 0);
    }

  }, [mappedOrders, coordsMap, isActive, mapInstance, selectedOrders, onRouteCalculated]);

  // Route drawing logic (OSM)
  useEffect(() => {
    if (isActive) return; // Don't run OSRM if using Google

    const fetchOsrm = async () => {
      const selectedWithCoords = selectedOrders.filter(o => coordsMap[o.id!]);
      if (selectedWithCoords.length > 1) {
        const points = selectedWithCoords.map(o => ({
          lat: coordsMap[o.id!][0],
          lng: coordsMap[o.id!][1]
        }));
        const { routeCoords, distanceKm, timeMin } = await getOsrmRoute(points);
        setOsrmRoute(routeCoords);
        if (onRouteCalculated) {
           onRouteCalculated(distanceKm, timeMin);
        }
      } else {
        setOsrmRoute([]);
        if (onRouteCalculated) onRouteCalculated(0, 0);
      }
    };

    fetchOsrm();
  }, [selectedOrders, coordsMap, isActive, onRouteCalculated]);

  const markersData = mappedOrders.filter(o => coordsMap[o.id!]).map(order => ({
    order,
    coords: coordsMap[order.id!],
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
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            
            {markersData.map((marker, idx) => (
              <Marker 
                key={marker.order.id || idx} 
                position={marker.coords}
                icon={marker.isSelected ? selectedIcon : unselectedIcon}
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
            ))}

            {osrmRoute.length > 0 && (
              <Polyline 
                positions={osrmRoute} 
                color="#10b981" 
                weight={4}
                opacity={0.8}
              />
            )}

            <MapUpdater markers={markersData.map(m => m.coords)} />
          </MapContainer>
        </>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-gray-900/90 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 backdrop-blur-sm z-[1000]">
        <h4 className="text-xs font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wider">Legenda</h4>
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-3 h-3 rounded-full bg-indigo-500 border border-white shadow-sm"></div>
          <span className="text-xs text-gray-600 dark:text-gray-300">Carga Disponível</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500 border border-white shadow-sm"></div>
          <span className="text-xs text-gray-600 dark:text-gray-300">Em Romaneio</span>
        </div>
      </div>
    </div>
  );
};
