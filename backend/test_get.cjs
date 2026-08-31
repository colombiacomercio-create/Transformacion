const https = require('https');

https.get('https://transformacion-backend.vercel.app/api/ficha-resultados/ultima', {
  headers: {
    'x-bypass-auth': 'true',
    'Authorization': 'Bearer bypass-token'
  }
}, (res) => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => {
    const data = JSON.parse(body);
    console.log("obrasProgramadasAlCorte:", data.obrasProgramadasAlCorte);
    console.log("avancesEjecucion:", data.avancesEjecucion);
  });
});
