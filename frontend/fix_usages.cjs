const fs = require('fs');
let content = fs.readFileSync('src/components/gestion/FichasDecoradas.tsx', 'utf8');

// Use string index to replace blocks carefully because of multiline template literals
function removeBlock(content, startString, endString, replacement) {
  const start = content.indexOf(startString);
  if (start === -1) return content;
  const end = content.indexOf(endString, start) + endString.length;
  if (end < start) return content;
  
  return content.substring(0, start) + replacement + content.substring(end);
}

// 1. Compromisos
content = removeBlock(
  content,
  '{renderGauge(ultimaFicha.compromisosPct, ultimaFicha.metaCompromisosPct, 100, c1Color)}',
  '</div>',
  '{renderGauge(ultimaFicha.compromisosPct, ultimaFicha.metaCompromisosPct, 100, c1Color, \'%\')}'
);

// 2. Giros
content = removeBlock(
  content,
  '{renderGauge(ultimaFicha.girosPct, ultimaFicha.metaGirosPct, 100, c2Color)}',
  '</div>',
  '{renderGauge(ultimaFicha.girosPct, ultimaFicha.metaGirosPct, 100, c2Color, \'%\')}'
);

// 3. Rollos
content = removeBlock(
  content,
  '{renderGauge(ultimaFicha.rollosResueltos, ultimaFicha.rollosProgramadosAlCorte, ultimaFicha.totalRollos, rollosColor)}',
  '</div>',
  '{renderGauge(ultimaFicha.rollosResueltos, ultimaFicha.rollosProgramadosAlCorte, ultimaFicha.totalRollos, rollosColor)}'
);

// 4. Puntos
content = removeBlock(
  content,
  '{renderGauge(ultimaFicha.puntosSostenibilidadEfectiva, ultimaFicha.puntosProgramadosSostenibilidad, ultimaFicha.puntosVerificados, orgColor)}',
  '</div>',
  '{renderGauge(ultimaFicha.puntosSostenibilidadEfectiva, ultimaFicha.puntosProgramadosSostenibilidad, ultimaFicha.puntosVerificados, orgColor)}'
);

// 5. Archivos
content = removeBlock(
  content,
  '{renderGauge(ultimaFicha.archivosPct, ultimaFicha.archivosProgramadosCorte, ultimaFicha.metaArchivos, archColor)}',
  '</div>',
  '{renderGauge(ultimaFicha.archivosPct, ultimaFicha.archivosProgramadosCorte, ultimaFicha.metaArchivos, archColor)}'
);

// 6. Fallos
content = removeBlock(
  content,
  '{renderGauge(ultimaFicha.fallosPrimeraEstanciaPct, ultimaFicha.fallosProgramadosCorte, ultimaFicha.metaFallos, fallosColor)}',
  '</div>',
  '{renderGauge(ultimaFicha.fallosPrimeraEstanciaPct, ultimaFicha.fallosProgramadosCorte, ultimaFicha.metaFallos, fallosColor)}'
);

// 7. Estrategias
content = removeBlock(
  content,
  '{renderGauge(ultimaFicha.estrategiasResueltas, ultimaFicha.estrategiasProgramadasCorte, ultimaFicha.estrategiasTotal, memColor)}',
  '</div>',
  '{renderGauge(ultimaFicha.estrategiasResueltas, ultimaFicha.estrategiasProgramadasCorte, ultimaFicha.estrategiasTotal, memColor)}'
);

fs.writeFileSync('src/components/gestion/FichasDecoradas.tsx', content);
