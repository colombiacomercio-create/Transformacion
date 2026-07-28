const fs = require('fs');
const file = 'D:/Transformacion/frontend/src/components/gestion/FichasDecoradas.tsx';
let text = fs.readFileSync(file, 'utf8');

text = text.replace(
  "const convivenciaData = [",
  "const motosPoliciaCalculado = (ultimaFicha.motosContratadas || 337) - ((ultimaFicha.motosEntregadas || 0) + (ultimaFicha.motosAlmacenFdl || 0) + (ultimaFicha.motosPendientesFdl || 0));\n  const finalMotosPolicia = ultimaFicha.motosEntregadasPolicia ?? motosPoliciaCalculado;\n\n  const convivenciaData = ["
);

text = text.replace(
  "{ name: 'Entregadas a la Policia (2025)', value: ultimaFicha.motosEntregadasPolicia ?? 0, color: '#16a34a' }",
  "{ name: 'Entregadas a la Policia (2025)', value: finalMotosPolicia, color: '#16a34a' }"
);

text = text.replace(
  /<span className="font-black text-sm text-gray-900">\{ultimaFicha\.motosEntregadasPolicia\}<\/span>/g,
  '<span className="font-black text-sm text-gray-900">{finalMotosPolicia}</span>'
);

fs.writeFileSync(file, text);
console.log("Updated FichasDecoradas.tsx");
