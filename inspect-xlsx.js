const xlsx = require('xlsx');

const filePath = 'd:/Transformacion/backend/imports/11. Transformación 2026 Suba.xlsx';
const workbook = xlsx.readFile(filePath);
const sheet = workbook.Sheets['Datos consolidados'];
const rows = xlsx.utils.sheet_to_json(sheet);

const depositos = new Set();
const etiquetas = new Set();

for (const row of rows) {
  if (row['Depósito']) depositos.add(row['Depósito']);
  if (row['Etiquetas']) etiquetas.add(row['Etiquetas']);
}

console.log('Unique Depósitos (Deposits):');
console.log(Array.from(depositos));

console.log('\nUnique Etiquetas (Labels):');
console.log(Array.from(etiquetas));
