import re
with open('frontend/src/components/Dashboard.tsx', 'r', encoding='utf-8') as f:
    c = f.read()
c = c.replace('<YAxis dataKey="name" type="category" width={90}', '<YAxis dataKey="nombre" type="category" width={110}')
c = c.replace('margin={{ top: 0, right: 30, left: 80, bottom: 20 }}', 'margin={{ top: 0, right: 30, left: 100, bottom: 20 }}')
with open('frontend/src/components/Dashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
