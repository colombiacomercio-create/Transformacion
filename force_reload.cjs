const fs = require('fs');
let file = fs.readFileSync('D:/Transformacion/frontend/src/components/gestion/ModalFichaResultados.tsx', 'utf8');

// just to force Vite to reload, add a space
file = file + ' ';
fs.writeFileSync('D:/Transformacion/frontend/src/components/gestion/ModalFichaResultados.tsx', file);
