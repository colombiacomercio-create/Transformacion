const fs = require('fs');
const file = 'D:/Transformacion/backend/prisma/schema.prisma';
let text = fs.readFileSync(file, 'utf8');
text = text.replace('motosEntregadas          Int?\\n    motosEntregadasPolicia   Int?', 'motosEntregadas          Int?\n    motosEntregadasPolicia   Int?');
fs.writeFileSync(file, text);
console.log("Fixed schema");
