const fs = require('fs');
let content = fs.readFileSync('src/components/gestion/FichasDecoradas.tsx', 'utf8');

function exactReplace(startLineStr, endLineStr, replacement) {
  const s = content.indexOf(startLineStr);
  if(s === -1) return;
  const e = content.indexOf(endLineStr, s);
  if(e === -1) return;
  content = content.substring(0, s) + replacement + content.substring(e + endLineStr.length);
}

exactReplace(
  '{renderGauge(ultimaFicha.compromisosPct, ultimaFicha.metaCompromisosPct, 100, c1Color)}',
  '</div>',
  '{renderGauge(ultimaFicha.compromisosPct, ultimaFicha.metaCompromisosPct, 100, c1Color, \'%\')}'
);

exactReplace(
  '{renderGauge(ultimaFicha.girosPct, ultimaFicha.metaGirosPct, 100, c2Color)}',
  '</div>',
  '{renderGauge(ultimaFicha.girosPct, ultimaFicha.metaGirosPct, 100, c2Color, \'%\')}'
);

exactReplace(
  '{renderGauge(ultimaFicha.rollosResueltos, ultimaFicha.rollosProgramadosAlCorte, ultimaFicha.totalRollos, rollosColor)}',
  '</div>',
  '{renderGauge(ultimaFicha.rollosResueltos, ultimaFicha.rollosProgramadosAlCorte, ultimaFicha.totalRollos, rollosColor)}'
);

exactReplace(
  '{renderGauge(ultimaFicha.puntosSostenibilidadEfectiva, ultimaFicha.puntosProgramadosSostenibilidad, ultimaFicha.puntosVerificados, orgColor)}',
  '</div>',
  '{renderGauge(ultimaFicha.puntosSostenibilidadEfectiva, ultimaFicha.puntosProgramadosSostenibilidad, ultimaFicha.puntosVerificados, orgColor)}'
);

exactReplace(
  '{renderGauge(ultimaFicha.archivosPct, ultimaFicha.archivosProgramadosCorte, ultimaFicha.metaArchivos, archColor)}',
  '</div>',
  '{renderGauge(ultimaFicha.archivosPct, ultimaFicha.archivosProgramadosCorte, ultimaFicha.metaArchivos, archColor)}'
);

exactReplace(
  '{renderGauge(ultimaFicha.fallosPrimeraEstanciaPct, ultimaFicha.fallosProgramadosCorte, ultimaFicha.metaFallos, fallosColor)}',
  '</div>',
  '{renderGauge(ultimaFicha.fallosPrimeraEstanciaPct, ultimaFicha.fallosProgramadosCorte, ultimaFicha.metaFallos, fallosColor)}'
);

exactReplace(
  '{renderGauge(ultimaFicha.estrategiasResueltas, ultimaFicha.estrategiasProgramadasCorte, ultimaFicha.estrategiasTotal, memColor)}',
  '</div>',
  '{renderGauge(ultimaFicha.estrategiasResueltas, ultimaFicha.estrategiasProgramadasCorte, ultimaFicha.estrategiasTotal, memColor)}'
);

fs.writeFileSync('src/components/gestion/FichasDecoradas.tsx', content);
