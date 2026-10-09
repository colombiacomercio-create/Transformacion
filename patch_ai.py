import re

with open('backend/src/services/ai.service.ts', 'r', encoding='utf-8') as f:
    content = f.read()

fallbackAvances = "const fallbackAvances = `En la localidad de ${localidadNombre}, el objetivo \"${objetivoNombre}\" presenta un avance consolidado promedio del ${totalAvance.toFixed(1)}%. Se destaca la ejecución de ${cifrasActividades.filter(a => a.estado === 'COMPLETADA' || a.avance === 100).length} actividades completadas de un total de ${cifrasActividades.length} programadas.`;"
fallbackAlertas = "const fallbackAlertas = `Se registran ${alertasActivas.length} cuellos de botella activos en el periodo. Se sugiere priorizar la revisión de evidencias pendientes y la articulación con los responsables asignados.`;"

content = re.sub(r'const fallbackAvances = `.*?`;', fallbackAvances, content, flags=re.DOTALL)
content = re.sub(r'const fallbackAlertas = `.*?`;', fallbackAlertas, content, flags=re.DOTALL)

with open('backend/src/services/ai.service.ts', 'w', encoding='utf-8') as f:
    f.write(content)
