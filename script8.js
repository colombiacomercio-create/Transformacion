const fs = require('fs');
const file = 'D:/Transformacion/frontend/src/components/gestion/FichasDecoradas.tsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');

const getSlice = (startLine, endLine) => lines.slice(startLine - 1, endLine).join('\n') + '\n';

const beforeLayout = getSlice(1, 114);
const colIzqStart = getSlice(115, 115);
const ejecucion = getSlice(116, 235);
const convivencia = getSlice(236, 290);
const rollos = getSlice(291, 326);
const colIzqEnd = getSlice(327, 328);
const colDerStart = getSlice(329, 329);
const obras = getSlice(330, 378);
const residuos = getSlice(379, 403);
const org = getSlice(404, 445);
const actuaciones = getSlice(446, 533);
const estrategias = getSlice(534, 568);
const afterLayout = getSlice(569, lines.length);

const newLayout = beforeLayout + 
  colIzqStart + 
  ejecucion + residuos + actuaciones + estrategias + 
  colIzqEnd + 
  colDerStart + 
  obras + rollos + org + convivencia + 
  afterLayout;

fs.writeFileSync(file, newLayout);
console.log("Done.");
