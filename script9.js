const fs = require('fs');
const file = 'D:/Transformacion/frontend/src/components/gestion/FichasDecoradas.tsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');

const getSlice = (start, end) => lines.slice(start - 1, end).join('\n') + '\n';

const beforeLayout = getSlice(1, 115);
const ejecucion = getSlice(116, 235);
const convivencia = getSlice(236, 290);
const rollos = getSlice(291, 326);
const colIzqEnd = getSlice(327, 329);
const obras = getSlice(330, 378);
const residuos = getSlice(379, 406);
const org = getSlice(407, 445);
const actuaciones = getSlice(446, 533);
const estrategias = getSlice(534, 568);
const afterLayout = getSlice(569, lines.length);

const newLayout = beforeLayout + 
  ejecucion + residuos + actuaciones + estrategias + 
  colIzqEnd + 
  obras + rollos + org + convivencia + 
  afterLayout;

fs.writeFileSync(file, newLayout);
console.log("Done");
