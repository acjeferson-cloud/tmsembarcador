import fetch from 'node-fetch';

function decodePolyline(str, precision) {
    let index = 0, lat = 0, lng = 0, coordinates = [], shift = 0, result = 0, byte = null, latitude_change, longitude_change, factor = Math.pow(10, Number.isInteger(precision) ? precision : 6);
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

async function test() {
  try {
    const data={locations:[{lat:-23.5505,lon:-46.6333},{lat:-22.9068,lon:-43.1729}],costing:'auto'}; 
    const res = await fetch('https://valhalla1.openstreetmap.de/route?json='+JSON.stringify(data));
    const json = await res.json();
    const shape = json.trip.legs[0].shape;
    const decoded = decodePolyline(shape, 6);
    console.log('Decoded length:', decoded.length);
    console.log('First point:', decoded[0]);
    console.log('Last point:', decoded[decoded.length - 1]);
  } catch (e) {
    console.error(e);
  }
}
test();
