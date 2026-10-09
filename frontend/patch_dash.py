import re

with open('src/components/Dashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove FichasDecoradas import
content = re.sub(r"import FichasDecoradas from '\./gestion/FichasDecoradas';\n", "", content)

# Remove the component
content = re.sub(r"\{\s*/\*\s*FICHAS SUPERIORES\s*\*/\s*\}.*?<\/div>\s*\)\}", "{/* Ficha de transformación local fue movida a Gestión de Resultados */}", content, flags=re.DOTALL)

with open('src/components/Dashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
