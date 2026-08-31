const fs = require('fs');
let content = fs.readFileSync('src/components/gestion/FichasDecoradas.tsx', 'utf8');

// Update renderGauge signature
const startIdx = content.indexOf('const renderGauge = (real: number | undefined, prog: number | undefined, meta: number | undefined, color: string');
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
  };`;

content = content.replace(oldGaugeDef, newGaugeDef);

// Now I will replace all the specific calls to remove the bottom text blocks
fs.writeFileSync('src/components/gestion/FichasDecoradas.tsx', content);
