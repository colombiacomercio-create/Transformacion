const fs = require('fs');
let content = fs.readFileSync('src/routes/actividades.routes.ts', 'utf8');
content = content.replace(/throw new Error\(Programa.*no encontrado\);/g, 'throw new Error(`Programa con código ${codigoProducto} no encontrado`);');
content = content.replace(/throw new Error\(Programa.*no tiene hitos asociados\);/g, 'throw new Error(`Programa con código ${codigoProducto} no tiene hitos asociados`);');
fs.writeFileSync('src/routes/actividades.routes.ts', content, 'utf8');
