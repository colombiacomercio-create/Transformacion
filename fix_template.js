const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/gestion/ModalImportarRutas.tsx', 'utf8');

const regexHeaders = /const TEMPLATE_HEADERS = \[[\s\S]*?\];/m;
const newHeaders = `const TEMPLATE_HEADERS = [
  'Codigo Actividad (Opcional)',
  'Aspiracion (Ej: A1)',
  'Producto (Ej: P01)',
  'Actividad',
  'Descripcion',
  'Fecha inicio',
  'Fecha final (Separar con coma si es repetitiva)',
  'Valor actividad (%)',
  'Es Repetitiva (SI/NO)',
  'Numero Entregas'
];`;

code = code.replace(regexHeaders, newHeaders);

const regexParser = /for \(let i = 1; i < data\.length; i\+\+\) \{[\s\S]*?parsedActs\.push\(act\);\s*\}/m;

const newParser = `for (let i = 1; i < data.length; i++) {
          const row = data[i] as any[];
          if (!row || row.length === 0 || row.every(c => !c)) continue; // skip empty rows

          const act: any = {};
          let rowError = false;

          // Optional columns are index 0 (Codigo), 8 (Repetitiva), 9 (Entregas)
          const mandatory = [1, 2, 3, 4, 5, 6, 7];
          mandatory.forEach((index) => {
            const val = row[index];
            if (val === undefined || val === null || val === '') {
              newErrors.push(\`Fila \${i + 1}: Falta valor obligatorio en la columna "\${TEMPLATE_HEADERS[index]}".\`);
              rowError = true;
            }
          });

          if (!rowError) {
            act.codigoActividad = row[0] ? String(row[0]) : '';
            act.aspiracion = String(row[1]);
            act.producto = String(row[2]);
            act.nombre = String(row[3]);
            act.descripcion = String(row[4]);
            act.fechaInicio = String(row[5]);
            act.fechaLimite = String(row[6]);
            act.valorActividad = String(row[7]);
            
            const rep = row[8] ? String(row[8]).trim().toUpperCase() : 'NO';
            act.esRepetitiva = (rep === 'SI' || rep === 'SÍ');
            act.numRepeticiones = row[9] ? parseInt(String(row[9])) : 1;
            
            if (act.esRepetitiva) {
               act.fechasLimites = act.fechaLimite.split(',').map((f: string) => f.trim());
               act.fechaLimite = act.fechasLimites[0];
            }
            
            parsedActs.push(act);
          }`;

code = code.replace(regexParser, newParser);

fs.writeFileSync('frontend/src/components/gestion/ModalImportarRutas.tsx', code, 'utf8');
console.log("File patched.");
