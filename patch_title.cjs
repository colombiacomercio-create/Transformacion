const fs = require('fs');
let file = fs.readFileSync('D:/Transformacion/frontend/src/components/gestion/ModalFichaResultados.tsx', 'utf8');
file = file.replace('<h2 className="text-lg font-bold text-gray-800">Reportar Datos de la Ficha</h2>', '<h2 className="text-lg font-bold text-red-600">Reportar Datos (V2)</h2>');
fs.writeFileSync('D:/Transformacion/frontend/src/components/gestion/ModalFichaResultados.tsx', file, 'utf8');
