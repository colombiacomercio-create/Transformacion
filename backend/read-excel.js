const xlsx = require('xlsx');
const path = require('path');

const filePath = "C:\\Users\\Roberto Carlos\\Downloads\\11. Transformación 2026 Suba.xlsx";
try {
  const workbook = xlsx.readFile(filePath);
  const sheetNames = workbook.SheetNames;
  console.log("Sheet names:", sheetNames);
  
  const sheet = workbook.Sheets[sheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  console.log("Total rows:", data.length);
  console.log("Row 0:", data[0]);
  console.log("Row 1:", data[1]);
  console.log("Row 2:", data[2]);
  console.log("Row 3:", data[3]);
  console.log("Row 4:", data[4]);
  console.log("Row 5:", data[5]);
} catch (e) {
  console.error(e);
}
