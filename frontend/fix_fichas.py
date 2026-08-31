import re

with open('src/components/gestion/FichasDecoradas.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace renderGauge definition
start_idx = content.find('const renderGauge = (real: number | undefined, prog: number | undefined, meta: number | undefined, color: string) => {')
end_idx = content.find('};', start_idx) + 2
old_gauge = content[start_idx:end_idx]

new_gauge = """const renderGauge = (real: number | undefined, prog: number | undefined, meta: number | undefined, color: string, unit: string = '') => {
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
      
      const theta = rotateDeg * Math.PI / 180;
      const tx = Math.sin(theta) * 65; 
      const ty = -Math.cos(theta) * 65;
      
      return (
        <div className="absolute z-10 w-full h-full pointer-events-none" style={{ bottom: 0, left: 0 }}>
          <div 
            style={{
              position: 'absolute',
              bottom: 0, left: '50%', width: '2px', height: '65px',
              transformOrigin: 'bottom center', transform: `translateX(-50%) rotate(${rotateDeg}deg)`,
              borderLeft: '2px dashed #374151'
            }}
          />
          {prog !== undefined && prog !== null && (
             <div 
               className="absolute whitespace-nowrap bg-gray-700 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm"
               style={{
                 left: `calc(50% + ${tx}px)`,
                 bottom: `calc(0px + ${-ty}px)`,
                 transform: 'translate(-50%, -50%)'
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
             <span className="inline-block bg-gray-100 border border-gray-200 text-gray-600 text-[10px] font-bold px-2 py-1 rounded">
               Meta anual: {meta}{unit}
             </span>
           ) : (
             <span className="inline-block bg-red-50 border border-red-200 text-red-600 text-[10px] font-bold px-2 py-1 rounded">
               Meta anual no reportada
             </span>
           )}
        </div>
      </div>
    );
  };"""

content = content.replace(old_gauge, new_gauge)

def replace_block(pattern_start, text_to_replace_with):
    global content
    idx = content.find(pattern_start)
    if idx == -1: return
    # find the end of the div containing the manual text
    # The div starts right after the renderGauge call
    start_div = content.find('<div className="mt-4', idx)
    if start_div == -1: start_div = content.find('<div className="mt-4"', idx)
    if start_div == -1: return
    
    end_div = content.find('</div>', start_div) + 6
    
    # We replace from the start of the renderGauge call up to end_div
    content = content[:idx] + text_to_replace_with + content[end_div:]

replace_block('{renderGauge(ultimaFicha.compromisosPct, ultimaFicha.metaCompromisosPct, 100, c1Color)}', '{renderGauge(ultimaFicha.compromisosPct, ultimaFicha.metaCompromisosPct, 100, c1Color, \'%\')}')
replace_block('{renderGauge(ultimaFicha.girosPct, ultimaFicha.metaGirosPct, 100, c2Color)}', '{renderGauge(ultimaFicha.girosPct, ultimaFicha.metaGirosPct, 100, c2Color, \'%\')}')
replace_block('{renderGauge(ultimaFicha.rollosResueltos, ultimaFicha.rollosProgramadosAlCorte, ultimaFicha.totalRollos, rollosColor)}', '{renderGauge(ultimaFicha.rollosResueltos, ultimaFicha.rollosProgramadosAlCorte, ultimaFicha.totalRollos, rollosColor)}')
replace_block('{renderGauge(ultimaFicha.puntosSostenibilidadEfectiva, ultimaFicha.puntosProgramadosSostenibilidad, ultimaFicha.puntosVerificados, orgColor)}', '{renderGauge(ultimaFicha.puntosSostenibilidadEfectiva, ultimaFicha.puntosProgramadosSostenibilidad, ultimaFicha.puntosVerificados, orgColor)}')
replace_block('{renderGauge(ultimaFicha.archivosPct, ultimaFicha.archivosProgramadosCorte, ultimaFicha.metaArchivos, archColor)}', '{renderGauge(ultimaFicha.archivosPct, ultimaFicha.archivosProgramadosCorte, ultimaFicha.metaArchivos, archColor)}')
replace_block('{renderGauge(ultimaFicha.fallosPrimeraEstanciaPct, ultimaFicha.fallosProgramadosCorte, ultimaFicha.metaFallos, fallosColor)}', '{renderGauge(ultimaFicha.fallosPrimeraEstanciaPct, ultimaFicha.fallosProgramadosCorte, ultimaFicha.metaFallos, fallosColor)}')
replace_block('{renderGauge(ultimaFicha.estrategiasResueltas, ultimaFicha.estrategiasProgramadasCorte, ultimaFicha.estrategiasTotal, memColor)}', '{renderGauge(ultimaFicha.estrategiasResueltas, ultimaFicha.estrategiasProgramadasCorte, ultimaFicha.estrategiasTotal, memColor)}')

with open('src/components/gestion/FichasDecoradas.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
