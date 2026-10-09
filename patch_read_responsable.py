import re

filepath = 'frontend/src/components/ModalDetalleActividad.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add Responsables Asignados to the details tab
search = """<div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Localidades Asignadas</h3>"""
replace = """<div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Responsables Asignados</h3>
                    <p className="font-medium text-sm text-bogota-primary mb-3">
                      {actividad.correosNotificacion?.length > 0 ? actividad.correosNotificacion.join(', ') : 'No asignado'}
                    </p>
                 </div>
                 <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Localidades Asignadas</h3>"""
content = content.replace(search, replace)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
