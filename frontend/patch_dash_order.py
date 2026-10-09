import re

with open('src/components/Dashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("const ordenCodigos = ['O1', 'O2', 'O3', 'O4', 'O5', 'O6', 'OV1', 'OV2'];", "const ordenCodigos = ['O1', 'O2', 'O3', 'O4', 'O5', 'O6', 'OV1', 'OV2', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7'];")

with open('src/components/Dashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
