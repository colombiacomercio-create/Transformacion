const fs = require('fs');
let c = fs.readFileSync('src/components/KanbanBoard.tsx', 'utf8');
const newRet = fs.readFileSync('new_kanban_return.txt', 'utf8');
const searchStart = c.indexOf('return (\n    <div className="h-[calc(100vh-12rem)] flex flex-col relative">'.replace(/\r\n/g, '\n'));
let searchStart2 = c.indexOf('return (\r\n    <div className="h-[calc(100vh-12rem)] flex flex-col relative">');
let start = searchStart !== -1 ? searchStart : searchStart2;

if (start === -1) {
    console.log("Not found!");
} else {
    // Find the end of '<div className="flex-1 flex gap-4 overflow-x-auto pb-4">' block
    const blockEndStr = '<div className="flex-1 flex gap-4 overflow-x-auto pb-4">';
    let endIdx = c.indexOf(blockEndStr);
    if (endIdx === -1) endIdx = c.indexOf('<div className="flex-1 flex gap-4 overflow-x-auto pb-4">');
    
    if (endIdx === -1) {
       console.log("End Not found!");
    } else {
       c = c.substring(0, start) + newRet + c.substring(endIdx + blockEndStr.length);
       fs.writeFileSync('src/components/KanbanBoard.tsx', c);
       console.log("Successfully replaced KanbanBoard!");
    }
}
