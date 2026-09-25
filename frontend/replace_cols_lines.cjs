const fs = require('fs');
let c = fs.readFileSync('src/components/KanbanBoard.tsx', 'utf8');
const newCols = fs.readFileSync('new_columns.txt', 'utf8');

let lines = c.split(/\r?\n/);

// Remove lines 280 to 339 (0-indexed: 279 to 338)
// Wait, the line numbers might have shifted since I added/removed some lines when rewriting the header.
// So let's re-verify the line numbers with the actual array.
let startIdx = -1;
let endIdx = -1;

for (let i=0; i<lines.length; i++) {
    if (lines[i].includes('{columnasDinamicas.map(col => (')) {
        startIdx = i;
    }
    if (startIdx !== -1 && i > startIdx && lines[i].includes('))}')) {
        // Keep searching for the closing of the map
        // The closing of the map has '          ))}'
        if (lines[i].trim() === '))}'){
           endIdx = i;
           break;
        }
    }
}

if (startIdx !== -1 && endIdx !== -1) {
    const before = lines.slice(0, startIdx).join('\n');
    const after = lines.slice(endIdx + 1).join('\n');
    fs.writeFileSync('src/components/KanbanBoard.tsx', before + '\n' + newCols + '\n' + after);
    console.log("Replaced using lines!");
} else {
    console.log("Could not find start/end. Start: " + startIdx + ", End: " + endIdx);
}

