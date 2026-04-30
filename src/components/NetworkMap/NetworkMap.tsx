import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './NetworkMap.css';
import { mapMockService, RouteData } from '../../services/mapMockService';

// Custom icons using CSS/DivIcon for minimal "Data Analytics" look
const hubIcon = new L.DivIcon({
  className: 'hub-marker-icon',
  html: '<div class="hub-pulse"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const clientIcon = new L.DivIcon({
  className: 'client-marker-icon',
  html: '<div class="client-dot"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

// Create custom cluster icon
const createClusterCustomIcon = function (cluster: any) {
  const count = cluster.getChildCount();
  
  // Dynamic sizing based on count
  let size = 'small';
  if (count > 20) size = 'medium';
  if (count > 50) size = 'large';

  return new L.DivIcon({
    html: `<div class="cluster-content"><span>${count}</span></div>`,
    className: `custom-marker-cluster cluster-${size}`,
    iconSize: L.point(36, 36, true),
  });
};

const MapBounds = ({ data }: { data: RouteData | null }) => {
  const map = useMap();

  useEffect(() => {
    if (!data) return;

    // Calculate bounds to fit all points
    const bounds = L.latLngBounds([data.hub.lat, data.hub.lng], [data.hub.lat, data.hub.lng]);
    data.clients.forEach(c => bounds.extend([c.coords.lat, c.coords.lng]));

    map.fitBounds(bounds, { padding: [50, 50] });
  }, [data, map]);

  return null;
};

export const NetworkMap: React.FC = () => {
  const [data, setData] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const routeData = await mapMockService.getNetworkData();
        setData(routeData);
      } catch (error) {
        console.error("Error loading map data", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading || !data) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center bg-gray-900 rounded-lg border border-gray-800">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <span className="text-gray-400 font-medium">Renderizando Malha Logística...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-gray-800 shadow-xl relative">
      
      {/* Overlay header */}
      <div className="absolute top-4 left-4 z-[400] bg-gray-900/80 backdrop-blur-md border border-gray-700 p-4 rounded-lg shadow-lg pointer-events-none">
        <h3 className="text-white font-semibold text-lg flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
          Malha de Distribuição
        </h3>
        <p className="text-gray-400 text-sm mt-1">
          {data.clients.length} pontos monitorados em tempo real
        </p>
      </div>

      <MapContainer 
        center={[data.hub.lat, data.hub.lng]} 
        zoom={10} 
        style={{ height: '600px', width: '100%', background: '#0a0a0a' }}
        zoomControl={false}
      >
        {/* Standard OpenStreetMap TileLayer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapBounds data={data} />

        {/* Hub / Matriz */}
        <Marker position={[data.hub.lat, data.hub.lng]} icon={hubIcon}>
          <Tooltip direction="top" offset={[0, -10]} className="dark-tooltip">
            <span className="font-bold text-blue-400">Hub Central</span>
          </Tooltip>
        </Marker>

        {/* Linhas Hub-and-Spoke (Fundo) */}
        {data.clients.map(client => (
          <Polyline 
            key={`line-${client.id}`}
            positions={[
              [data.hub.lat, data.hub.lng],
              [client.coords.lat, client.coords.lng]
            ]}
            color="#3b82f6"
            weight={1}
            opacity={0.15}
            dashArray="4, 4"
          />
        ))}

        {/* Clusters e Clientes */}
        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={createClusterCustomIcon}
          maxClusterRadius={60}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
          spiderLegPolylineOptions={{ weight: 1.5, color: '#60a5fa', opacity: 0.5 }}
          zoomToBoundsOnClick={true}
        >
          {data.clients.map(client => (
            <Marker 
              key={client.id} 
              position={[client.coords.lat, client.coords.lng]} 
              icon={clientIcon}
            >
              <Tooltip direction="top" offset={[0, -5]} className="dark-tooltip">
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-white">{client.name}</span>
                  <span className="text-gray-300 text-xs">Volume: {client.volume} kg</span>
                  <span className={`text-xs ${
                    client.status === 'delivered' ? 'text-emerald-400' :
                    client.status === 'in_transit' ? 'text-amber-400' : 'text-gray-400'
                  }`}>
                    {client.status === 'delivered' ? 'Entregue' :
                     client.status === 'in_transit' ? 'Em Trânsito' : 'Pendente'}
                  </span>
                </div>
              </Tooltip>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
};
