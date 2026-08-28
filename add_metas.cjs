const fs = require('fs');
let content = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');
content = content.replace(
  'metaGirosPct       Float?',
  'metaGirosPct       Float?\n  metaAnualCompromisos Float?\n  metaAnualGiros     Float?'
);
fs.writeFileSync('backend/prisma/schema.prisma', content);
