import fetch from 'node-fetch';

async function test() {
  try {
    const url = 'https://router.project-osrm.org/route/v1/driving/-46.6333,-23.5505;-43.1729,-22.9068?overview=simplified&geometries=geojson';
    const res = await fetch(url);
    if (!res.ok) {
      console.log('Failed:', res.status, res.statusText);
      return;
    }
    const data = await res.json();
    console.log(data.code, data.routes?.[0]?.geometry?.coordinates?.length);
  } catch (e) {
    console.error(e);
  }
}
test();
