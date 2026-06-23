const XLSX = require('xlsx');

const workbook = XLSX.readFile('C:/Users/Roberto Carlos/Downloads/20251205 mesas de trabajo.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

console.log("Total rows:", data.length);
if (data.length > 0) {
  console.log("Headers:", Object.keys(data[0]));
  console.log("First 2 rows:");
  console.log(data.slice(0, 2));
}
