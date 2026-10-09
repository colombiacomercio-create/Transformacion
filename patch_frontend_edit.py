import re

filepath = 'frontend/src/components/ModalDetalleActividad.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add correosNotificacion to editData initial state
search_editData = """const [editData, setEditData] = useState({
     codigoCompleto: actividad.codigoCompleto || '',
     nombre: actividad.nombre || '',
     hitoId: actividad.hitoId || '',
     descripcion: actividad.descripcion || '',
     fechaInicio: actividad.fechaInicio ? new Date(actividad.fechaInicio).toISOString().split('T')[0] : '',
     fechaLimite: actividad.fechaLimite ? new Date(actividad.fechaLimite).toISOString().split('T')[0] : ''
  });"""
replace_editData = """const [editData, setEditData] = useState({
     codigoCompleto: actividad.codigoCompleto || '',
     nombre: actividad.nombre || '',
     hitoId: actividad.hitoId || '',
     descripcion: actividad.descripcion || '',
     fechaInicio: actividad.fechaInicio ? new Date(actividad.fechaInicio).toISOString().split('T')[0] : '',
     fechaLimite: actividad.fechaLimite ? new Date(actividad.fechaLimite).toISOString().split('T')[0] : '',
     correosNotificacion: actividad.correosNotificacion?.join(', ') || ''
  });"""
content = content.replace(search_editData, replace_editData)

# Add input for correosNotificacion
search_input = """<label className="text-xs font-bold text-gray-500 uppercase mt-2">Reclasificar en Ruta/Aspiracion</label>
                  <select className="w-full border rounded p-1 text-sm outline-none" value={editData.hitoId} onChange={e => setEditData({...editData, hitoId: e.target.value})}>
                     {getHitosPlano().map(h => (
                        <option key={h.id} value={h.id}>{h.nombre}</option>
                     ))}
                  </select>"""
replace_input = """<label className="text-xs font-bold text-gray-500 uppercase mt-2">Reclasificar en Ruta/Aspiracion</label>
                  <select className="w-full border rounded p-1 text-sm outline-none" value={editData.hitoId} onChange={e => setEditData({...editData, hitoId: e.target.value})}>
                     {getHitosPlano().map(h => (
                        <option key={h.id} value={h.id}>{h.nombre}</option>
                     ))}
                  </select>
                  
                  <label className="text-xs font-bold text-gray-500 uppercase mt-2">Responsables a Notificar (Correos separados por coma)</label>
                  <input type="text" className="w-full text-sm border rounded p-1 outline-none mb-2" value={editData.correosNotificacion} onChange={e => setEditData({...editData, correosNotificacion: e.target.value})} placeholder="admin@gobierno.gov.co, alcalde@bogota.gov.co" />"""
content = content.replace(search_input, replace_input)

# Wait, we need to show the correosNotificacion when not editing!
search_display = """<span className="flex items-center gap-1"><Calendar className="w-4 h-4"/> Lmite: {actividad.fechaLimite ? new Date(actividad.fechaLimite).toLocaleDateString() : 'Sin Fecha'}</span>"""
replace_display = """<span className="flex items-center gap-1"><Calendar className="w-4 h-4"/> Lmite: {actividad.fechaLimite ? new Date(actividad.fechaLimite).toLocaleDateString() : 'Sin Fecha'}</span>
               {actividad.correosNotificacion && actividad.correosNotificacion.length > 0 && (
                 <span className="flex items-center gap-1 bg-yellow-50 text-yellow-800 px-2 py-0.5 rounded-full text-xs ml-4 border border-yellow-200">
                   Responsables: {actividad.correosNotificacion.length}
                 </span>
               )}"""
# Actually, the replacement might fail due to encoding. Let's just write exactly as found.
# I will use a different anchor.

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
