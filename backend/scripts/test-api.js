const https = require('https');

const data = JSON.stringify({
  periodo: "2026-07-03",
  obrasActEn: "2026-07-03",
  seccionesActualizadas: ["obras"]
});

const options = {
  hostname: 'transformacion.vercel.app',
  port: 443,
  path: '/api/ficha-resultados',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    // Add auth token if needed, or maybe it fails with 401
  }
};

const req = https.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`);
  res.on('data', d => {
    process.stdout.write(d);
  });
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();
