const fs = require('fs');
let content = fs.readFileSync('src/components/gestion/FichasDecoradas.tsx', 'utf8');

// Replace renderGauge definition
const startIdx = content.indexOf('const renderGauge = (real: number | undefined, prog: number | undefined, meta: number | undefined, color: string) => {');
const endIdx = content.indexOf('};', startIdx) + 2;
const oldGaugeDef = content.substring(startIdx, endIdx);

const newGaugeDef = `const renderGauge = (real: number | undefined, prog: number | undefined, meta: number | undefined, color: string, unit: string = '') => {
    const safeReal = real || 0;
    const safeProg = prog || 0;
    const safeMeta = meta || 0;
    
    let fillPct = 0;
    let needlePct = 0;
    
    if (safeMeta > 0) {
      fillPct = Math.min(100, (safeReal / safeMeta) * 100);
      needlePct = Math.min(100, (safeProg / safeMeta) * 100);
    } else if (safeProg > 0) {
      fillPct = Math.min(100, (safeReal / safeProg) * 100);
      needlePct = 100;
    }
    
    const data = [
      { value: fillPct, color },
      { value: Math.max(0, 100 - fillPct), color: '#e5e7eb' }
    ];

    const renderNeedle = (pct: number) => {
      const rotateDeg = (pct * 180 / 100) - 90;
      
      // Calculate badge position using trigonometry
      const theta = rotateDeg * Math.PI / 180;
      const tx = Math.sin(theta) * 65; 
      const ty = -Math.cos(theta) * 65;
      
      return (
        <div className="absolute z-10 w-full h-full pointer-events-none" style={{ bottom: 0, left: 0 }}>
          <div 
            style={{
              position: 'absolute',
              bottom: 0, left: '50%', width: '2px', height: '65px',
              transformOrigin: 'bottom center', transform: \`translateX(-50%) rotate(\${rotateDeg}deg)\`,
              borderLeft: '2px dashed #374151'
            }}
          />
          {prog !== undefined && prog !== null && (
             <div 
               className="absolute whitespace-nowrap bg-gray-700 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm"
               style={{
                 left: \`calc(50% + \${tx}px)\`,
                 bottom: \`calc(0px + \${-ty}px)\`,
                 transform: 'translate(-50%, -50%)' // center the badge on tip
               }}
             >
               {prog}{unit} Prog.
             </div>
          )}
        </div>
      );
    };

    return (
      <div className="flex flex-col items-center">
        <div className="relative h-20 w-32 mx-auto mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="100%" startAngle={180} endAngle={0} innerRadius={35} outerRadius={55} paddingAngle={0} dataKey="value" stroke="none">
                {data.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {(safeMeta > 0 || safeProg > 0) && renderNeedle(needlePct)}
          <div className="absolute bottom-0 left-0 w-full text-center mb-[-8px]">
             <span className="text-xl font-black" style={{ color }}>{Math.round(fillPct)}%</span>
          </div>
        </div>
        <div className="mt-5">
           {meta !== undefined && meta !== null ? (
             <span className="inline-block bg-gray-100 border border-gray-200 text-gray-600 text-[10px] font-bold px-2 py-1 rounded shadow-sm">
               Meta anual: {meta}{unit}
             </span>
           ) : (
             <span className="inline-block bg-red-50 border border-red-200 text-red-600 text-[10px] font-bold px-2 py-1 rounded shadow-sm">
               Meta anual no reportada
             </span>
           )}
        </div>
      </div>
    );
  };`;

content = content.replace(oldGaugeDef, newGaugeDef);

const b1 = `{renderGauge(ultimaFicha.compromisosPct, ultimaFicha.metaCompromisosPct, 100, c1Color)}
                    <div className="mt-4 text-[10px] font-bold text-gray-700">
                      {ultimaFicha.metaCompromisosPct === undefined || ultimaFicha.metaCompromisosPct === null ? (
                         <span className="block text-red-500">Programado al corte no reportado</span>
                      ) : (
                         <span className="block text-gray-500">{ultimaFicha.metaCompromisosPct}% Prog. al corte</span>
                      )}
                    </div>`;

const b2 = `{renderGauge(ultimaFicha.girosPct, ultimaFicha.metaGirosPct, 100, c2Color)}
                    <div className="mt-4 text-[10px] font-bold text-gray-700">
                      {ultimaFicha.metaGirosPct === undefined || ultimaFicha.metaGirosPct === null ? (
                         <span className="block text-red-500">Programado al corte no reportado</span>
                      ) : (
                         <span className="block text-gray-500">{ultimaFicha.metaGirosPct}% Prog. al corte</span>
                      )}
                    </div>`;

const b3 = `{renderGauge(ultimaFicha.rollosResueltos, ultimaFicha.rollosProgramadosAlCorte, ultimaFicha.totalRollos, rollosColor)}
                      <div className="mt-4 text-[10px] font-bold text-gray-700">
                        {ultimaFicha.rollosProgramadosAlCorte === undefined || ultimaFicha.rollosProgramadosAlCorte === null ? (
                           <span className="block text-red-500">Programado al corte no reportado</span>
                        ) : (
                           <span className="block text-gray-500">{ultimaFicha.rollosProgramadosAlCorte} Prog. al corte</span>
                        )}
                        <span className="block text-gray-400 mt-1">Total Rollos: {ultimaFicha.totalRollos || 0}</span>
                      </div>`;

const b4 = `{renderGauge(ultimaFicha.puntosSostenibilidadEfectiva, ultimaFicha.puntosProgramadosSostenibilidad, ultimaFicha.puntosVerificados, orgColor)}
                       <div className="mt-4">
                         <span className="font-bold text-lg" style={{ color: orgColor }}>{ultimaFicha.puntosSostenibilidadEfectiva || 0}</span>
                         <span className="text-[10px] text-gray-500"> reales de </span>
                         <span className="font-bold text-sm text-gray-700">{ultimaFicha.puntosProgramadosSostenibilidad || 0}</span>
                         <span className="text-[10px] text-gray-500"> prog. al corte</span>
                         {ultimaFicha.puntosProgramadosSostenibilidad === undefined || ultimaFicha.puntosProgramadosSostenibilidad === null ? (
                            <span className="block text-red-500 text-[10px] font-bold">Programado al corte no reportado</span>
                         ) : null}
                       </div>`;

const b5 = `{renderGauge(ultimaFicha.archivosPct, ultimaFicha.archivosProgramadosCorte, ultimaFicha.metaArchivos, archColor)}
                    <div className="mt-4 text-[10px] font-bold text-gray-700">
                      {ultimaFicha.archivosProgramadosCorte === undefined || ultimaFicha.archivosProgramadosCorte === null ? (
                         <span className="block text-red-500">Programado al corte no reportado</span>
                      ) : (
                         <span className="block text-gray-500">{ultimaFicha.archivosProgramadosCorte} Prog. al corte</span>
                      )}
                      <span className="block text-gray-400 mt-1">Meta anual: {ultimaFicha.metaArchivos || 0}</span>
                    </div>`;

const b6 = `{renderGauge(ultimaFicha.fallosPrimeraEstanciaPct, ultimaFicha.fallosProgramadosCorte, ultimaFicha.metaFallos, fallosColor)}
                    <div className="mt-4 text-[10px] font-bold text-gray-700">
                      {ultimaFicha.fallosProgramadosCorte === undefined || ultimaFicha.fallosProgramadosCorte === null ? (
                         <span className="block text-red-500">Programado al corte no reportado</span>
                      ) : (
                         <span className="block text-gray-500">{ultimaFicha.fallosProgramadosCorte} Prog. al corte</span>
                      )}
                      <span className="block text-gray-400 mt-1">Meta anual: {ultimaFicha.metaFallos || 0}</span>
                    </div>`;

const b7 = `{renderGauge(ultimaFicha.estrategiasResueltas, ultimaFicha.estrategiasProgramadasCorte, ultimaFicha.estrategiasTotal, memColor)}
                      <div className="mt-4 text-[10px] font-bold text-gray-700">
                        {ultimaFicha.estrategiasProgramadasCorte === undefined || ultimaFicha.estrategiasProgramadasCorte === null ? (
                           <span className="block text-red-500">Prog. no reportado</span>
                        ) : (
                           <span className="block text-gray-500">{ultimaFicha.estrategiasProgramadasCorte} Prog. al corte</span>
                        )}
                      </div>`;

content = content.replace(b1, `{renderGauge(ultimaFicha.compromisosPct, ultimaFicha.metaCompromisosPct, 100, c1Color, '%')}`);
content = content.replace(b2, `{renderGauge(ultimaFicha.girosPct, ultimaFicha.metaGirosPct, 100, c2Color, '%')}`);
content = content.replace(b3, `{renderGauge(ultimaFicha.rollosResueltos, ultimaFicha.rollosProgramadosAlCorte, ultimaFicha.totalRollos, rollosColor)}`);
content = content.replace(b4, `{renderGauge(ultimaFicha.puntosSostenibilidadEfectiva, ultimaFicha.puntosProgramadosSostenibilidad, ultimaFicha.puntosVerificados, orgColor)}`);
content = content.replace(b5, `{renderGauge(ultimaFicha.archivosPct, ultimaFicha.archivosProgramadosCorte, ultimaFicha.metaArchivos, archColor)}`);
content = content.replace(b6, `{renderGauge(ultimaFicha.fallosPrimeraEstanciaPct, ultimaFicha.fallosProgramadosCorte, ultimaFicha.metaFallos, fallosColor)}`);
content = content.replace(b7, `{renderGauge(ultimaFicha.estrategiasResueltas, ultimaFicha.estrategiasProgramadasCorte, ultimaFicha.estrategiasTotal, memColor)}`);

fs.writeFileSync('src/components/gestion/FichasDecoradas.tsx', content);
