const fs = require('fs');
const file = 'D:/Transformacion/frontend/src/components/gestion/FichasDecoradas.tsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');

const getSlice = (startLine, endLine) => lines.slice(startLine - 1, endLine).join('\n') + '\n';

// The original lines before ANY of my rearrangements were:
// (Wait, the file currently is in the state of the LAST rearrange I did, because the git commit was made!)
// So I should just reset hard to ca1183bf again, and then apply THIS specific order!
