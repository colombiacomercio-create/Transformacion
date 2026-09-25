const fs = require('fs');

let c = fs.readFileSync('src/App.tsx', 'utf8');
const newRet = fs.readFileSync('new_return.txt', 'utf8');

const authReturnStart = c.indexOf('return (\n    <div className="min-h-screen bg-gray-50 flex flex-col">');

if (authReturnStart === -1) {
    console.log("Not found!");
} else {
    c = c.substring(0, authReturnStart) + newRet;
    fs.writeFileSync('src/App.tsx', c);
    console.log("Successfully replaced!");
}
