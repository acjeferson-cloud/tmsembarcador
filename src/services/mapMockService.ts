export interface Coordinate {
  lat: number;
  lng: number;
}

export interface ClientNode {
  id: string;
  name: string;
  coords: Coordinate;
  volume: number;
  status: 'pending' | 'in_transit' | 'delivered';
}

export interface RouteData {
  hub: Coordinate;
  clients: ClientNode[];
}

export const mapMockService = {
  getNetworkData: async (): Promise<RouteData> => {
    // Simulando delay de rede
    await new Promise(resolve => setTimeout(resolve, 800));

    // Hub Central (ex: Centro de Distribuição em São Paulo)
    const hub: Coordinate = { lat: -23.5505, lng: -46.6333 };

    // Gerando Spokes (Clientes) ao redor do Hub
    const clients: ClientNode[] = [];
    const numClients = 150; // Quantidade alta para forçar o clustering

    for (let i = 0; i < numClients; i++) {
      // Distribuição concentrada em algumas áreas para forçar clusters densos
      const clusterOffsetLat = (Math.random() - 0.5) * 0.1 * (i % 3 === 0 ? 1 : 0.2);
      const clusterOffsetLng = (Math.random() - 0.5) * 0.1 * (i % 3 === 0 ? 1 : 0.2);

      // Deslocamento base para criar 3 ou 4 polos
      const poloLat = (i % 4) === 0 ? 0.05 : (i % 4) === 1 ? -0.05 : 0;
      const poloLng = (i % 4) === 2 ? 0.05 : (i % 4) === 3 ? -0.05 : 0;

      clients.push({
        id: `cli-${i}`,
        name: `Cliente ${i + 1}`,
        coords: {
          lat: hub.lat + poloLat + clusterOffsetLat,
          lng: hub.lng + poloLng + clusterOffsetLng
        },
        volume: Math.floor(Math.random() * 100) + 10,
        status: i % 5 === 0 ? 'delivered' : i % 3 === 0 ? 'in_transit' : 'pending'
      });
    }

    return { hub, clients };
  }
};
