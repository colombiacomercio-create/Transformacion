const fs = require('fs');
const file = 'D:/Transformacion/frontend/src/components/gestion/ModalFichaResultados.tsx';
let text = fs.readFileSync(file, 'utf8');
text = text.replace("{ key: 'motosEntregadas', label: 'Motos Entregadas', type: 'number' },", "{ key: 'motosEntregadas', label: 'Motos Entregadas SSCJ', type: 'number' },\\n      { key: 'motosEntregadasPolicia', label: 'Motos Entregadas Policia', type: 'number' },");
fs.writeFileSync(file, text);
console.log("Updated modal");
