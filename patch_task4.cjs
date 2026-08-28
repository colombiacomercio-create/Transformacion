const fs = require('fs');
let task = fs.readFileSync('C:/Users/Roberto Carlos/.gemini/antigravity/brain/be3a8a17-f656-42ed-af62-95be700bbb91/task.md', 'utf8');
task = task.replace('- [/] 4. Frontend - Diseño PDF', '- [x] 4. Frontend - Diseño PDF');
task = task.replace(/- \[ \] Actualizar/g, '- [x] Actualizar');
task = task.replace(/- \[ \] Añadir/g, '- [x] Añadir');
task = task.replace(/- \[ \] Eliminar/g, '- [x] Eliminar');
fs.writeFileSync('C:/Users/Roberto Carlos/.gemini/antigravity/brain/be3a8a17-f656-42ed-af62-95be700bbb91/task.md', task);
