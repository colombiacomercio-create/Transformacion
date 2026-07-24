const fs = require('fs');
const file = 'D:/Transformacion/frontend/src/components/gestion/FichasDecoradas.tsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');
const getSlice = (start, end) => lines.slice(start - 1, end).join('\n') + '\n';

// Let's grab EXACTLY each component
const ejecucion = getSlice(116, 235);
const convivencia = getSlice(236, 290);
const rollos = getSlice(291, 324); 
const obras = getSlice(330, 378);
const residuos = getSlice(379, 407);
const org = getSlice(409, 445);
const actuaciones = getSlice(446, 532);
const estrategias = getSlice(534, 567);

// Print the first and last line of each to verify!
const check = (name, text) => {
  const tlines = text.trim().split('\n');
  console.log(name + ' START: ' + tlines[0]);
  console.log(name + ' END: ' + tlines[tlines.length - 1]);
};

check('Ejecucion', ejecucion);
check('Convivencia', convivencia);
check('Rollos', rollos);
check('Obras', obras);
check('Residuos', residuos);
check('Org', org);
check('Actuaciones', actuaciones);
check('Estrategias', estrategias);
