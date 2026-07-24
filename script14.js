const fs = require('fs');
const file = 'D:/Transformacion/frontend/src/components/gestion/FichasDecoradas.tsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');
const getSlice = (start, end) => lines.slice(start - 1, end).join('\n') + '\n';

// Let's grab EXACTLY each component
const beforeLayout = getSlice(1, 115);
const ejecucion = getSlice(116, 235);
const convivencia = getSlice(236, 290);
const rollos = getSlice(291, 324); 
const obras = getSlice(330, 378);
const residuos = getSlice(379, 407);
const org = getSlice(408, 445);
const actuaciones = getSlice(446, 532);
const estrategias = getSlice(534, 567);

// Include line 568 which is the closing div for right column!
const afterLayout = getSlice(568, lines.length);

const midLayout = '\\n        </div>\\n\\n        {/* COLUMNA DERECHA */}\\n        <div className="space-y-6">\\n\\n';

const newLayout = beforeLayout + 
  ejecucion + '\\n' + residuos + '\\n' + actuaciones + '\\n' + estrategias + 
  midLayout + 
  obras + '\\n' + rollos + '\\n' + org + '\\n' + convivencia + 
  afterLayout;

fs.writeFileSync(file, newLayout);
console.log("Done layout!");
