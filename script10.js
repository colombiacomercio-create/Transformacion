const fs = require('fs');
const file = 'D:/Transformacion/frontend/src/components/gestion/FichasDecoradas.tsx';
let text = fs.readFileSync(file, 'utf8');

const s1 = text.indexOf('          {/* EJECUCI');
const s2 = text.indexOf('          {/* CONVIVENCIA');
const s3 = text.indexOf('          {/* ROLLOS');
const s4 = text.indexOf('        {/* COLUMNA DERECHA');
const s6 = text.indexOf('          {/* OBRAS LOCALES');
const s7 = text.indexOf('          {/* ESPACIO P');

var orgIdx = text.indexOf('Organizaci');
var s8_real = text.lastIndexOf('           <div className="bg-[#e3182d]', orgIdx);

const s9 = text.indexOf('          {/* ACTUACIONES');
const s10 = text.indexOf('          {/* ESTRATEGIAS');
var s11_real = text.lastIndexOf('        </div>', text.length - 100);

const beforeLayout = text.substring(0, s1);
const ejecucion = text.substring(s1, s2);
const convivencia = text.substring(s2, s3);
const rollos = text.substring(s3, s4);
const obras = text.substring(s6, s7);
const residuos = text.substring(s7, s8_real);
const org = text.substring(s8_real, s9);
const actuaciones = text.substring(s9, s10);
const estrategias = text.substring(s10, s11_real);
const afterLayout = text.substring(s11_real);

// The split between cols:
const midLayout = '\\n        </div>\\n        {/* COLUMNA DERECHA */}\\n        <div className="space-y-6">\\n';

const newText = beforeLayout + 
  ejecucion + residuos + actuaciones + estrategias + 
  midLayout + 
  obras + rollos + org + convivencia + 
  afterLayout;

fs.writeFileSync(file, newText);
console.log("Done text merge.");
