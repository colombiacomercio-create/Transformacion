const https = require('https');

https.get('https://api-transformacion-sdg.azurewebsites.net/api/ficha-resultados/ultima', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data.slice(0, 500)));
}).on('error', err => console.error(err.message));
