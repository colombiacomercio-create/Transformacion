const fs = require('fs');
const path = require('path');

const files = [
  'src/components/KanbanBoard.tsx',
  'src/components/ModalNuevaActividad.tsx',
  'src/components/PanelAlertas.tsx',
  'src/components/Dashboard.tsx',
  'src/components/ModalDetalleActividad.tsx'
];

files.forEach(f => {
  const p = path.join(__dirname, f);
  let content = fs.readFileSync(p, 'utf8');
  content = content.replace(/'http:\/\/localhost:4000(\/[^']*)'/g, "`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}$1`");
  content = content.replace(/`http:\/\/localhost:4000(\/[^`]*)`/g, "`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}$1`");
  fs.writeFileSync(p, content);
});
console.log('done');
