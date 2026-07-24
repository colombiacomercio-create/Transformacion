const fs = require('fs');
const file = 'D:/Transformacion/backend/src/routes/ficha-resultados.routes.ts';
let text = fs.readFileSync(file, 'utf8');
text = text.replace('motosEntregadas: data.motosEntregadas ?? null,', 'motosEntregadas: data.motosEntregadas ?? null,\\n        motosEntregadasPolicia: data.motosEntregadasPolicia ?? null,');
fs.writeFileSync(file, text);
console.log("Updated routes");
