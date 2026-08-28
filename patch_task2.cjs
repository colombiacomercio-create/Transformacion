const fs = require('fs');
let task = fs.readFileSync('C:/Users/Roberto Carlos/.gemini/antigravity/brain/be3a8a17-f656-42ed-af62-95be700bbb91/task.md', 'utf8');
task = task.replace('- [/] 2. Backend', '- [x] 2. Backend');
task = task.replace('- [ ] Modificar D:\\Transformacion\\backend\\src\\routes\\ficha-resultados.routes.ts', '- [x] Modificar D:\\Transformacion\\backend\\src\\routes\\ficha-resultados.routes.ts');
task = task.replace('- [ ] 3. Frontend - Formulario', '- [/] 3. Frontend - Formulario');
fs.writeFileSync('C:/Users/Roberto Carlos/.gemini/antigravity/brain/be3a8a17-f656-42ed-af62-95be700bbb91/task.md', task);
