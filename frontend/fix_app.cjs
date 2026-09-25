const fs = require('fs');

let c = fs.readFileSync('src/App.tsx', 'utf8');
const newRet = fs.readFileSync('new_return.txt', 'utf8');

const authReturnStart = c.indexOf('return (\\r\\n    <div className="min-h-screen bg-gray-50 flex flex-col">'.replace(/\\r\\n/g, '\r\n'));
const altStart = c.indexOf('return (\n    <div className="min-h-screen bg-gray-50 flex flex-col">');

let start = authReturnStart !== -1 ? authReturnStart : altStart;

if (start === -1) {
    console.log("Not found!");
} else {
    c = c.substring(0, start) + newRet;
    fs.writeFileSync('src/App.tsx', c);
    console.log("Successfully replaced!");
}
