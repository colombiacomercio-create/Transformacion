const fs = require('fs');
let content = fs.readFileSync('src/routes/ficha-resultados.routes.ts', 'utf8');
content = content.replace(
  'metaGirosPct: data.metaGirosPct ?? null,',
  'metaGirosPct: data.metaGirosPct ?? null,\n        metaAnualCompromisos: data.metaAnualCompromisos ?? null,\n        metaAnualGiros: data.metaAnualGiros ?? null,'
);
fs.writeFileSync('src/routes/ficha-resultados.routes.ts', content);
