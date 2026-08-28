const fs = require('fs');
let task = fs.readFileSync('C:/Users/Roberto Carlos/.gemini/antigravity/brain/be3a8a17-f656-42ed-af62-95be700bbb91/task.md', 'utf8');
task = task.replace('- [/] 1. Actualización de Base de Datos', '- [x] 1. Actualización de Base de Datos');
task = task.replace('- [ ] Añadir campos faltantes a', '- [x] Añadir campos faltantes a');
task = task.replace('- [ ] Ejecutar 
px prisma db push', '- [x] Ejecutar 
px prisma db push');
task = task.replace('- [ ] Generar de nuevo el Prisma Client', '- [x] Generar de nuevo el Prisma Client');
task = task.replace('- [ ] 2. Backend', '- [/] 2. Backend');
fs.writeFileSync('C:/Users/Roberto Carlos/.gemini/antigravity/brain/be3a8a17-f656-42ed-af62-95be700bbb91/task.md', task);
