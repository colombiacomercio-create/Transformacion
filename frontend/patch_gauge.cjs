const fs = require('fs');
let content = fs.readFileSync('src/components/gestion/FichasDecoradas.tsx', 'utf8');

// The file was modified earlier by me, let's find the current renderGauge
const startIdx = content.indexOf('const renderGauge = (real: number | undefined, prog: number | undefined, color: string) => {');
const endIdx = content.indexOf('};', startIdx) + 2;
const oldGaugeDef = content.substring(startIdx, endIdx);

const newGaugeDef = `const renderGauge = (real: number | undefined, prog: number | undefined, meta: number | undefined, color: string) => {
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
      return (
        <div 
          className="absolute z-10"
          style={{
            bottom: 0, left: '50%', width: '2px', height: '65px',
            transformOrigin: 'bottom center', transform: \`translateX(-50%) rotate(\${rotateDeg}deg)\`,
            borderLeft: '2px dashed #374151'
          }}
        />
      );
    };

    return (
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
    );
  };`;

content = content.replace(oldGaugeDef, newGaugeDef);

// Replace calls
content = content.replace(
  '{renderGauge(ultimaFicha.compromisosPct, ultimaFicha.metaCompromisosPct, c1Color)}',
  '{renderGauge(ultimaFicha.compromisosPct, ultimaFicha.metaCompromisosPct, ultimaFicha.metaAnualCompromisos, c1Color)}'
);
content = content.replace(
  '{renderGauge(ultimaFicha.girosPct, ultimaFicha.metaGirosPct, c2Color)}',
  '{renderGauge(ultimaFicha.girosPct, ultimaFicha.metaGirosPct, ultimaFicha.metaAnualGiros, c2Color)}'
);
content = content.replace(
  '{renderGauge(ultimaFicha.rollosResueltos, ultimaFicha.rollosProgramadosAlCorte, rollosColor)}',
  '{renderGauge(ultimaFicha.rollosResueltos, ultimaFicha.rollosProgramadosAlCorte, ultimaFicha.totalRollos, rollosColor)}'
);
content = content.replace(
  '{renderGauge(ultimaFicha.puntosSostenibilidadEfectiva, ultimaFicha.puntosProgramadosSostenibilidad, orgColor)}',
  '{renderGauge(ultimaFicha.puntosSostenibilidadEfectiva, ultimaFicha.puntosProgramadosSostenibilidad, ultimaFicha.puntosVerificados, orgColor)}'
);
content = content.replace(
  '{renderGauge(ultimaFicha.archivosPct, ultimaFicha.archivosProgramadosCorte, archColor)}',
  '{renderGauge(ultimaFicha.archivosPct, ultimaFicha.archivosProgramadosCorte, ultimaFicha.metaArchivos, archColor)}'
);
content = content.replace(
  '{renderGauge(ultimaFicha.fallosPrimeraEstanciaPct, ultimaFicha.fallosProgramadosCorte, fallosColor)}',
  '{renderGauge(ultimaFicha.fallosPrimeraEstanciaPct, ultimaFicha.fallosProgramadosCorte, ultimaFicha.metaFallos, fallosColor)}'
);
content = content.replace(
  '{renderGauge(ultimaFicha.estrategiasResueltas, ultimaFicha.estrategiasProgramadasCorte, memColor)}',
  '{renderGauge(ultimaFicha.estrategiasResueltas, ultimaFicha.estrategiasProgramadasCorte, ultimaFicha.estrategiasTotal, memColor)}'
);

fs.writeFileSync('src/components/gestion/FichasDecoradas.tsx', content);
