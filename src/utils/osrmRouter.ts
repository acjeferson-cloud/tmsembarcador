interface Coordinates {
  lat: number;
  lng: number;
}

export const getOsrmRoute = async (points: Coordinates[]): Promise<{ 
  routeCoords: [number, number][], 
  distanceKm: number, 
  timeMin: number,
  outboundDistanceKm: number,
  returnDistanceKm: number
}> => {
  if (points.length < 2) return { routeCoords: [], distanceKm: 0, timeMin: 0, outboundDistanceKm: 0, returnDistanceKm: 0 };

  try {
    // Format coordinates as lng,lat;lng,lat...
    const coordsString = points.map(p => `${p.lng},${p.lat}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`OSRM API Error: ${response.status}`);
    }
    
    const json = await response.json();

    if (json.routes && json.routes.length > 0) {
      const route = json.routes[0];
      
      // OSRM geojson returns [lng, lat], but Leaflet needs [lat, lng]
      const routeCoords: [number, number][] = route.geometry.coordinates.map(
        (coord: [number, number]) => [coord[1], coord[0]]
      );
      
      const distanceKm = route.distance / 1000;
      const timeMin = route.duration / 60;
      
      let outboundDistanceKm = distanceKm;
      let returnDistanceKm = 0;
      
      if (route.legs && route.legs.length > 1) {
        // A última 'leg' (perna) é o retorno do último cliente para o estabelecimento
        const lastLeg = route.legs[route.legs.length - 1];
        returnDistanceKm = lastLeg.distance / 1000;
        outboundDistanceKm = distanceKm - returnDistanceKm;
      }
      
      return { routeCoords, distanceKm, timeMin, outboundDistanceKm, returnDistanceKm };
    }
    
    // Fallback: straight lines
    const straightLines = points.map(p => [p.lat, p.lng] as [number, number]);
    return { routeCoords: straightLines, distanceKm: 0, timeMin: 0, outboundDistanceKm: 0, returnDistanceKm: 0 };
  } catch (error) {
    console.error('Error fetching OSRM route:', error);
    // Fallback: straight lines if server is down
    const straightLines = points.map(p => [p.lat, p.lng] as [number, number]);
    return { routeCoords: straightLines, distanceKm: 0, timeMin: 0, outboundDistanceKm: 0, returnDistanceKm: 0 };
  }
};

