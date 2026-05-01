interface Coordinates {
  lat: number;
  lng: number;
}

// Decode Valhalla's 6-digit precision polyline
function decodePolyline(str: string, precision: number = 6): [number, number][] {
    let index = 0, lat = 0, lng = 0;
    const coordinates: [number, number][] = [];
    let shift = 0, result = 0, byte = null, latitude_change, longitude_change;
    const factor = Math.pow(10, precision);
    
    while (index < str.length) {
        byte = null; shift = 0; result = 0;
        do { byte = str.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
        latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
        shift = result = 0;
        do { byte = str.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
        longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lat += latitude_change; lng += longitude_change;
        coordinates.push([lat / factor, lng / factor]);
    }
    return coordinates;
}

export const getOsrmRoute = async (points: Coordinates[]): Promise<{ routeCoords: [number, number][], distanceKm: number, timeMin: number }> => {
  if (points.length < 2) return { routeCoords: [], distanceKm: 0, timeMin: 0 };

  try {
    // Switch to Valhalla public instance because OSRM public is heavily rate-limited/down for long routes
    const locations = points.map(p => ({ lat: p.lat, lon: p.lng }));
    const data = { locations, costing: 'auto' };
    const url = `https://valhalla1.openstreetmap.de/route?json=${JSON.stringify(data)}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Valhalla API Error: ${response.status}`);
    }
    
    const json = await response.json();

    if (json.trip && json.trip.legs && json.trip.legs.length > 0) {
      let routeCoords: [number, number][] = [];
      // Combine all legs (each segment between waypoints is a leg)
      json.trip.legs.forEach((leg: any) => {
        if (leg.shape) {
          const decoded = decodePolyline(leg.shape, 6);
          routeCoords = [...routeCoords, ...decoded];
        }
      });
      const distanceKm = json.trip.summary.length;
      const timeMin = json.trip.summary.time / 60;
      return { routeCoords, distanceKm, timeMin };
    }
    
    // Fallback: straight lines
    const straightLines = points.map(p => [p.lat, p.lng] as [number, number]);
    return { routeCoords: straightLines, distanceKm: 0, timeMin: 0 };
  } catch (error) {
    console.error('Error fetching Valhalla route:', error);
    // Fallback: straight lines if server is down
    const straightLines = points.map(p => [p.lat, p.lng] as [number, number]);
    return { routeCoords: straightLines, distanceKm: 0, timeMin: 0 };
  }
};
