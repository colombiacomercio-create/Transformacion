const fs = require('fs');
let c = fs.readFileSync('src/components/KanbanBoard.tsx', 'utf8');
const newCols = fs.readFileSync('new_columns.txt', 'utf8');

const startStr = '{columnasDinamicas.map(col => (';
let startIdx = c.indexOf(startStr);

if (startIdx === -1) {
    console.log("Start Not found!");
} else {
    // Find the end of the loop
    const endStr = '              </div>\n            </div>\n          ))}';
    const endStrCRLF = '              </div>\r\n            </div>\r\n          ))}';
    let endIdx = c.indexOf(endStr);
    let matchedStr = endStr;
    if (endIdx === -1) {
        endIdx = c.indexOf(endStrCRLF);
        matchedStr = endStrCRLF;
    }
    
    if (endIdx === -1) {
         console.log("End Not found!");
    } else {
         c = c.substring(0, startIdx) + newCols + c.substring(endIdx + matchedStr.length);
         fs.writeFileSync('src/components/KanbanBoard.tsx', c);
         console.log("Replaced columns successfully!");
    }
}
