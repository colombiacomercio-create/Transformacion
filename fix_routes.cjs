const fs = require('fs');
let content = fs.readFileSync('D:/Transformacion/backend/src/routes/obras.routes.ts', 'utf8');
content = content.replace('error.message', '(error as Error).message');
fs.writeFileSync('D:/Transformacion/backend/src/routes/obras.routes.ts', content);
