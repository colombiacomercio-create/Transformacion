const fs = require('fs');
let content = fs.readFileSync('D:/Transformacion/backend/migrate_obras.cjs', 'utf8');

const replacement = 
  const safeDate = (d) => {
    if (!d) return null;
    const date = new Date(d);
    if (isNaN(date.getTime()) || date.getFullYear() > 2100 || date.getFullYear() < 1900) return null;
    return date;
  };
  const cleanFrentes = allFrentes.map(({ id, crono_inicio, crono_fin, fecha_real_fin, fecha_suspension, ...rest }) => ({
    ...rest,
    crono_inicio: safeDate(crono_inicio),
    crono_fin: safeDate(crono_fin),
    fecha_real_fin: safeDate(fecha_real_fin),
    fecha_suspension: safeDate(fecha_suspension),
  }));
;

content = content.replace(/const cleanFrentes = allFrentes\.map[\s\S]*?\}\)\);/, replacement.trim());
fs.writeFileSync('D:/Transformacion/backend/migrate_obras.cjs', content);
