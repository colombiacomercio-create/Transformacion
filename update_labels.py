import sys
import re

file_path = 'D:/Transformacion/frontend/src/components/gestion/FichasDecoradas.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the data array
old_array = r"const convivenciaData = \[\s*\{ name: 'Entregadas Policía.*?\];"
new_array = """const convivenciaData = [
    { name: 'Entregadas a la Policia (2025)', value: ultimaFicha.motosEntregadasPolicia ?? 0, color: '#16a34a' },
    { name: 'Entregadas a SDSCJ (2026)', value: ultimaFicha.motosEntregadas ?? 0, color: '#facc15' },
    { name: 'En almacen FDL', value: ultimaFicha.motosAlmacenFdl ?? 0, color: '#ca8a04' },
    { name: 'Pendientes entrega FDL', value: ultimaFicha.motosPendientesFdl ?? 0, color: '#dc2626' },
  ];"""

content = re.sub(old_array, new_array, content, flags=re.DOTALL)

# Replace the UI list
old_ui = r'<div className="bg-white p-4 flex items-center">\s*<div className="flex-1 space-y-2">.*?<div className="w-48 h-48">'
new_ui = """<div className="bg-white p-4 flex items-center">
                  <div className="flex-1 space-y-2">
                       <div className="flex justify-between items-center px-2 py-1 mb-2 border-b-2 border-gray-100">
                          <span className="font-bold text-gray-700">Total Motos Contratadas</span>
                          <span className="font-black text-xl text-[#e3182d]">{ultimaFicha.motosContratadas}</span>
                       </div>
                       <div className="flex justify-between items-center bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">
                          <div className="flex items-center gap-2">
                             <div className="w-3 h-3 rounded-full bg-[#16a34a]"></div>
                             <span className="text-xs font-medium leading-tight text-gray-700">Entregadas a la Policia (2025)</span>
                          </div>
                          <span className="font-black text-sm text-gray-900">{ultimaFicha.motosEntregadasPolicia}</span>
                       </div>
                       <div className="flex justify-between items-center bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">
                          <div className="flex items-center gap-2">
                             <div className="w-3 h-3 rounded-full bg-[#facc15]"></div>
                             <span className="text-xs font-medium leading-tight text-gray-700">Entregadas a SDSCJ (2026)</span>
                          </div>
                          <span className="font-black text-sm text-gray-900">{ultimaFicha.motosEntregadas}</span>
                       </div>
                       <div className="flex justify-between items-center bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">
                          <div className="flex items-center gap-2">
                             <div className="w-3 h-3 rounded-full bg-[#ca8a04]"></div>
                             <span className="text-xs font-medium leading-tight text-gray-700">En almacen FDL</span>
                          </div>
                          <span className="font-black text-sm text-gray-900">{ultimaFicha.motosAlmacenFdl}</span>
                       </div>
                       <div className="flex justify-between items-center bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">
                          <div className="flex items-center gap-2">
                             <div className="w-3 h-3 rounded-full bg-[#dc2626]"></div>
                             <span className="text-xs font-medium leading-tight text-gray-700">Pendientes entrega FDL</span>
                          </div>
                          <span className="font-black text-sm text-gray-900">{ultimaFicha.motosPendientesFdl}</span>
                       </div>
                    </div>
                  <div className="w-48 h-48">"""

content = re.sub(old_ui, new_ui, content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated texts")
