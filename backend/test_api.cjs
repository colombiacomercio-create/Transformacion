const https = require('https');

const data = JSON.stringify({
  periodo: "2026-08-28",
  obrasProgramadasAlCorte: 1234,
  avancesEjecucion: "Test avance",
  alertaEjecucion: "Test alerta"
});

const req = https.request({
  hostname: 'transformacion-backend.vercel.app',
  port: 443,
  path: '/api/ficha-resultados',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
    'Authorization': 'Bearer bypass-token'
  }
}, (res) => {
  let body = '';
  res.on('data', (c) => body += c);
  res.on('end', () => console.log('Response:', res.statusCode, body));
});

req.on('error', (e) => console.error(e));
req.write(data);
req.end();
