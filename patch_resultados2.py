import re

filepath = 'frontend/src/components/gestion/SeccionResultados.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix td class just in case
content = content.replace('className="px-3 py-2 text-center flex justify-center gap-2"', 'className="px-3 py-2 text-center"')

# Add a div wrapper around buttons for safety
content = content.replace("""<button 
                        onClick={() => setFichaActivaId(f.id)}""", """<div className="flex justify-center gap-2">
                      <button 
                        onClick={() => setFichaActivaId(f.id)}""")

content = content.replace("""Descargar
                      </button>
                    </td>""", """Descargar
                      </button>
                      </div>
                    </td>""")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
