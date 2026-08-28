const fs = require('fs');
let content = fs.readFileSync('src/components/gestion/ModalFichaResultados.tsx', 'utf8');
content = content.replace(
  "{ key: 'compromisosPct', label: 'Compromisos - Avance Real %', type: 'number', step: '0.1' },",
  "{ key: 'metaAnualCompromisos', label: 'Compromisos - Meta global anual %', type: 'number', step: '0.1' },\n        { key: 'compromisosPct', label: 'Compromisos - Avance Real %', type: 'number', step: '0.1' },"
);
content = content.replace(
  "{ key: 'girosPct', label: 'Giros - Avance Real %', type: 'number', step: '0.1' },",
  "{ key: 'metaAnualGiros', label: 'Giros - Meta global anual %', type: 'number', step: '0.1' },\n        { key: 'girosPct', label: 'Giros - Avance Real %', type: 'number', step: '0.1' },"
);
fs.writeFileSync('src/components/gestion/ModalFichaResultados.tsx', content);
