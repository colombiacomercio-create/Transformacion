const fs = require('fs');
let content = fs.readFileSync('src/components/gestion/FichasDecoradas.tsx', 'utf8');

const estr = `{renderGauge(ultimaFicha.estrategiasResueltas, ultimaFicha.estrategiasProgramadasCorte, ultimaFicha.estrategiasTotal, memColor)}
                      <div className="mt-4 text-[10px] font-bold text-gray-700">
                        {ultimaFicha.estrategiasProgramadasCorte === undefined || ultimaFicha.estrategiasProgramadasCorte === null ? (
                           <span className="block text-red-500">Prog. no reportado</span>
                        ) : (
                           <span className="block text-gray-500">{ultimaFicha.estrategiasProgramadasCorte} Prog. al corte</span>
                        )}
                      </div>`;

content = content.replace(estr, `{renderGauge(ultimaFicha.estrategiasResueltas, ultimaFicha.estrategiasProgramadasCorte, ultimaFicha.estrategiasTotal, memColor)}`);

const arch = `{renderGauge(ultimaFicha.archivosPct, ultimaFicha.archivosProgramadosCorte, ultimaFicha.metaArchivos, archColor)}
                    <div className="mt-4 text-[10px] font-bold text-gray-700">
                      {ultimaFicha.archivosProgramadosCorte === undefined || ultimaFicha.archivosProgramadosCorte === null ? (
                         <span className="block text-red-500">Programado al corte no reportado</span>
                      ) : (
                         <span className="block text-gray-500">{ultimaFicha.archivosProgramadosCorte} Prog. al corte</span>
                      )}
                      <span className="block text-gray-400 mt-1">Meta anual: {ultimaFicha.metaArchivos || 0}</span>
                    </div>`;

content = content.replace(arch, `{renderGauge(ultimaFicha.archivosPct, ultimaFicha.archivosProgramadosCorte, ultimaFicha.metaArchivos, archColor)}`);

fs.writeFileSync('src/components/gestion/FichasDecoradas.tsx', content);
