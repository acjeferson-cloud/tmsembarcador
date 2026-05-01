import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Order } from '../../../services/ordersService';

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

// Helper to mock coordinates based on string hash (so same city gets roughly same area)
const getMockCoordinates = (address: string): [number, number] => {
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = address.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Base coordinates (São Paulo center)
  const baseLat = -23.5505;
  const baseLng = -46.6333;
  
  // Add some deterministc variation based on hash (approx 10-20km radius)
  const latOffset = ((hash % 100) / 100) * 0.2 - 0.1;
  const lngOffset = (((hash >> 8) % 100) / 100) * 0.2 - 0.1;
  
  return [baseLat + latOffset, baseLng + lngOffset];
};

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
}

export const RoutingMap: React.FC<RoutingMapProps> = ({ pendingOrders, selectedOrders }) => {
  
  // Combine orders, marking them as selected or not
  const mappedOrders = [
    ...pendingOrders.map(o => ({ ...o, isSelected: false })),
    ...selectedOrders.map(o => ({ ...o, isSelected: true }))
  ];

  const markersData = mappedOrders.map(order => {
    const addressString = `${order.destination_city} ${order.destination_state} ${order.destination_neighborhood}`;
    const coords = getMockCoordinates(addressString);
    return {
      order,
      coords,
      isSelected: order.isSelected
    };
  });

  const selectedCoords = markersData.filter(m => m.isSelected).map(m => m.coords);

  return (
    <div className="h-full w-full bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 relative z-0">
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

        {selectedCoords.length > 1 && (
          <Polyline 
            positions={selectedCoords} 
            color="#10b981" 
            weight={3}
            dashArray="10, 10"
            opacity={0.7}
          />
        )}

        <MapUpdater markers={markersData.map(m => m.coords)} />
      </MapContainer>
      
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
