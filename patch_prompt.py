import re
with open('backend/src/services/ai.service.ts', 'r', encoding='utf-8') as f:
    c = f.read()

new_prompt = """const prompt = `
        Actúa como un analista experto en políticas públicas para el sistema RADAR.
        Debes generar un borrador narrativo de los "Principales Avances" y "Alertas y Recomendaciones" del objetivo: "${objetivoNombre}" para la localidad de "${localidadNombre}".
        
        INSTRUCCIONES CLAVE:
        1. Debes MENCIONAR EXPLÍCITAMENTE la localidad ("${localidadNombre}") en ambos textos (avances y alertas), indicando qué ocurre específicamente allí.
        2. Si hay múltiples observaciones, divídelas en varios PÁRRAFOS utilizando saltos de línea dobles para facilitar la lectura. No entregues un solo bloque de texto.
        3. Escribe de manera ejecutiva, clara y directa.

        DATOS DISPONIBLES:
        - Avance promedio local: ${totalAvance.toFixed(1)}%
        - Actividades completadas: ${cifrasActividades.filter(a => a.estado === 'COMPLETADA' || a.avance === 100).length} de ${cifrasActividades.length}
        - Alertas activas: ${JSON.stringify(alertasActivas)}
        - Actividades rezagadas: ${JSON.stringify(actividadesRezagadas)}
        - Comentarios del equipo: ${comentarios.join(' | ')}
        - Alerta Ficha Resultados (Global): ${alertasFichaResultados}

        Devuelve ÚNICAMENTE un JSON con este formato (asegúrate de escapar las comillas si es necesario):
        {
          "avances": "texto con los avances, mencionando la localidad, separado en párrafos cortos...",
          "alertas": "texto con las alertas y recomendaciones, mencionando la localidad, separado en párrafos cortos..."
        }
        `;"""

# Need to replace the old prompt block. Let's find it.
c = re.sub(r'const prompt = `.*?`;', new_prompt, c, flags=re.DOTALL)

with open('backend/src/services/ai.service.ts', 'w', encoding='utf-8') as f:
    f.write(c)
