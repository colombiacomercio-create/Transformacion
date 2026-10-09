import re

filepath = 'frontend/src/components/gestion/SeccionResultados.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add header column
header_search = '<th className="text-left px-3 py-2">Reportado por</th>\n              </tr></thead>'
header_replace = '<th className="text-left px-3 py-2">Reportado por</th>\n                <th className="text-center px-3 py-2">Acciones</th>\n              </tr></thead>'
content = content.replace(header_search, header_replace)

# Add body column
body_search = '<td className="px-3 py-2">{f.reportadoPor?.nombre}</td>\n                  </tr>'
body_replace = """<td className="px-3 py-2">{f.reportadoPor?.nombre}</td>
                    <td className="px-3 py-2 text-center flex justify-center gap-2">
                      <button 
                        onClick={() => setFichaActivaId(f.id)}
                        className="px-2 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded text-xs"
                      >
                        Ver
                      </button>
                      <button 
                        onClick={() => {
                           setFichaActivaId(f.id);
                           setTimeout(exportPDF, 500);
                        }}
                        className="px-2 py-1 bg-bogota-primary text-white hover:bg-red-700 rounded text-xs"
                      >
                        Descargar
                      </button>
                    </td>
                  </tr>"""
content = content.replace(body_search, body_replace)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
