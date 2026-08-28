const fs = require('fs');
let task = fs.readFileSync('C:/Users/Roberto Carlos/.gemini/antigravity/brain/be3a8a17-f656-42ed-af62-95be700bbb91/task.md', 'utf8');
task = task.replace('- [/] 3. Frontend - Formulario', '- [x] 3. Frontend - Formulario');
task = task.replace('- [ ] Modificar tipados', '- [x] Modificar tipados');
task = task.replace('- [ ] Actualizar ModalFichaResultados.tsx', '- [x] Actualizar ModalFichaResultados.tsx');
task = task.replace('- [ ] 4. Frontend - Diseño PDF', '- [/] 4. Frontend - Diseño PDF');
fs.writeFileSync('C:/Users/Roberto Carlos/.gemini/antigravity/brain/be3a8a17-f656-42ed-af62-95be700bbb91/task.md', task);
