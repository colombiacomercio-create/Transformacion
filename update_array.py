import sys
import re

file_path = 'D:/Transformacion/frontend/src/components/gestion/FichasDecoradas.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

new_block = """  const convivenciaData = [
    { name: 'Entregadas Policía (2025)', value: ultimaFicha.motosEntregadasPolicia ?? 0, color: '#16a34a' },
    { name: 'Entregadas SSCJ (2026)', value: ultimaFicha.motosEntregadas ?? 0, color: '#facc15' },
    { name: 'Entregadas FDL (Almacén)', value: ultimaFicha.motosAlmacenFdl ?? 0, color: '#ca8a04' },
    { name: 'En proceso FDL', value: ultimaFicha.motosPendientesFdl ?? 0, color: '#dc2626' },
  ];"""

new_content = re.sub(
    r'const convivenciaData = \[\s*\{ name: \'Motos Contratadas\'.*?\n\s*\];',
    new_block,
    content,
    flags=re.DOTALL
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Replaced array")
