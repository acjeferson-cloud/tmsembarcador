const https = require('https');
const options = {
  hostname: 'wthpdsbvfrnrzupvhquo.supabase.co',
  path: '/rest/v1/cities?select=id&limit=1',
  method: 'GET',
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0aHBkc2J2ZnJucnp1cHZocXVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1OTExOTQsImV4cCI6MjA4NzE2NzE5NH0.RQUTEmVwDPG-tooKDhFk_D6chG4AYq7OgKCB7_iu820',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0aHBkc2J2ZnJucnp1cHZocXVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1OTExOTQsImV4cCI6MjA4NzE2NzE5NH0.RQUTEmVwDPG-tooKDhFk_D6chG4AYq7OgKCB7_iu820',
    'Prefer': 'count=exact'
  }
};
const req = https.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Content-Range:', res.headers['content-range']));
});
req.end();
