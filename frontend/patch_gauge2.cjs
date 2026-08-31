const fs = require('fs');
let content = fs.readFileSync('src/components/gestion/FichasDecoradas.tsx', 'utf8');

content = content.replace(
  '{renderGauge(ultimaFicha.compromisosPct, ultimaFicha.metaCompromisosPct, ultimaFicha.metaAnualCompromisos, c1Color)}',
  '{renderGauge(ultimaFicha.compromisosPct, ultimaFicha.metaCompromisosPct, 100, c1Color)}'
);
content = content.replace(
  '{renderGauge(ultimaFicha.girosPct, ultimaFicha.metaGirosPct, ultimaFicha.metaAnualGiros, c2Color)}',
  '{renderGauge(ultimaFicha.girosPct, ultimaFicha.metaGirosPct, 100, c2Color)}'
);

fs.writeFileSync('src/components/gestion/FichasDecoradas.tsx', content);
