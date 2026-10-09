import re

with open('src/components/KanbanBoard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add filtroLocalidad state
content = content.replace("const [filtroProducto, setFiltroProducto] = useState('TODOS');", "const [filtroProducto, setFiltroProducto] = useState('TODOS');\n  const [filtroLocalidad, setFiltroLocalidad] = useState('TODAS');")

# 2. Add localidadesList
content = content.replace("const productosList = Array.from(", "const localidadesList = Array.from(new Set(actividades.flatMap((a: any) => a.asignaciones?.map((asig: any) => asig.localidad?.nombre)).filter(Boolean))).sort();\n  const productosList = Array.from(")

# 3. Change userData?.rol === 'GESTOR' to !== 'ADMIN'
content = content.replace("userData?.rol === 'GESTOR'", "userData?.rol !== 'ADMIN'")

# 4. Add the filter logic in the `let actividadesFiltradas` loop
content = content.replace("if (filtroProducto !== 'TODOS' && prodCodigo !== filtroProducto) return false;", "if (filtroProducto !== 'TODOS' && prodCodigo !== filtroProducto) return false;\n    if (filtroLocalidad !== 'TODAS') {\n      if (!a.asignaciones?.some((asig: any) => asig.localidad?.nombre === filtroLocalidad)) return false;\n    }")

# 5. Add the HTML select element for Localidad
# Find <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3"> and change it to lg:grid-cols-6
content = content.replace('<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">', '<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">')

# Add the select for Locality after Objective select
select_obj = """<select 
            value={filtroObjetivo}
            onChange={(e) => setFiltroObjetivo(e.target.value)}
            className="border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm outline-none cursor-pointer w-full focus:ring-2 focus:ring-bogota-secondary focus:border-bogota-secondary"
          >
            <option value="TODOS">Objetivos: Todos</option>
            {objetivosList.map(o => <option key={o as string} value={o as string}>{o as string}</option>)}
          </select>"""

if select_obj not in content:
    select_obj = """<select 
            value={filtroObjetivo}
            onChange={(e) => setFiltroObjetivo(e.target.value)}
            className="border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm outline-none cursor-pointer w-full focus:ring-2 focus:ring-bogota-secondary focus:border-bogota-secondary"
          >
            <option value="TODOS">Objetivos: Todos</option>
            {objetivosList.map(o => <option key={o} value={o}>{o}</option>)}
          </select>"""

new_select = select_obj + """
          <select 
            value={filtroLocalidad}
            onChange={(e) => setFiltroLocalidad(e.target.value)}
            className="border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm outline-none cursor-pointer w-full focus:ring-2 focus:ring-bogota-secondary focus:border-bogota-secondary"
          >
            <option value="TODAS">Localidad: Todas</option>
            {localidadesList.map(l => <option key={l as string} value={l as string}>{l as string}</option>)}
          </select>"""

content = content.replace(select_obj, new_select)

with open('src/components/KanbanBoard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
