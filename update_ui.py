import sys
import re

file_path = 'D:/Transformacion/frontend/src/components/gestion/FichasDecoradas.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

new_block = """               <div className="bg-white p-4 flex items-center">
                  <div className="flex-1 space-y-2">
                       <div className="flex justify-between items-center px-2 py-1 mb-2 border-b-2 border-gray-100">
                          <span className="font-bold text-gray-700">Total Motos Contratadas</span>
                          <span className="font-black text-xl text-[#e3182d]">{ultimaFicha.motosContratadas}</span>
                       </div>
                       <div className="flex justify-between items-center bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">
                          <div className="flex items-center gap-2">
                             <div className="w-3 h-3 rounded-full bg-[#16a34a]"></div>
                             <span className="text-xs font-medium leading-tight text-gray-700">Entregadas Policía (25)</span>
                          </div>
                          <span className="font-black text-sm text-gray-900">{ultimaFicha.motosEntregadasPolicia}</span>
                       </div>
                       <div className="flex justify-between items-center bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">
                          <div className="flex items-center gap-2">
                             <div className="w-3 h-3 rounded-full bg-[#facc15]"></div>
                             <span className="text-xs font-medium leading-tight text-gray-700">Entregadas SSCJ (26)</span>
                          </div>
                          <span className="font-black text-sm text-gray-900">{ultimaFicha.motosEntregadas}</span>
                       </div>
                       <div className="flex justify-between items-center bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">
                          <div className="flex items-center gap-2">
                             <div className="w-3 h-3 rounded-full bg-[#ca8a04]"></div>
                             <span className="text-xs font-medium leading-tight text-gray-700">Entregadas FDL</span>
                          </div>
                          <span className="font-black text-sm text-gray-900">{ultimaFicha.motosAlmacenFdl}</span>
                       </div>
                       <div className="flex justify-between items-center bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">
                          <div className="flex items-center gap-2">
                             <div className="w-3 h-3 rounded-full bg-[#dc2626]"></div>
                             <span className="text-xs font-medium leading-tight text-gray-700">En proceso FDL</span>
                          </div>
                          <span className="font-black text-sm text-gray-900">{ultimaFicha.motosPendientesFdl}</span>
                       </div>
                    </div>
                  <div className="w-48 h-48">"""

new_content = re.sub(
    r'<div className="bg-white p-4 flex items-center">\s*<div className="flex-1 space-y-3">.*?<div className="w-48 h-48">',
    new_block,
    content,
    flags=re.DOTALL
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Replaced UI")
