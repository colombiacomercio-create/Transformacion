import re
with open('frontend/src/components/Dashboard.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

find_str = "const asp = mapByCodigo(a.codigoCompleto);"
replace_str = """let asp = mapByCodigo(a.codigoCompleto);
              if (!asp && (a.codigoCompleto.includes('[P05') || a.codigoCompleto.includes('H2') || a.codigoCompleto.includes('P2') || a.codigoCompleto.includes('P08'))) {
                 asp = 'A4. Rollo Legendario';
              }"""
c = c.replace(find_str, replace_str)

with open('frontend/src/components/Dashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
