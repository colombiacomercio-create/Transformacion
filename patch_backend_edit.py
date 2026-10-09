import re

filepath = 'backend/src/routes/actividades.routes.ts'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Modify the destructured req.body
content = content.replace(
    'const { descripcion, fechaInicio, fechaLimite, nombre, hitoId, codigoCompleto } = req.body;',
    'const { descripcion, fechaInicio, fechaLimite, nombre, hitoId, codigoCompleto, correosNotificacion } = req.body;'
)

# Add to dataToUpdate
insert_logic = """if (codigoCompleto !== undefined) dataToUpdate.codigoCompleto = codigoCompleto;
    if (correosNotificacion !== undefined) {
      dataToUpdate.correosNotificacion = Array.isArray(correosNotificacion) 
         ? correosNotificacion 
         : correosNotificacion.split(',').map((c: string) => c.trim()).filter(Boolean);
    }"""
content = content.replace('if (codigoCompleto !== undefined) dataToUpdate.codigoCompleto = codigoCompleto;', insert_logic)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
