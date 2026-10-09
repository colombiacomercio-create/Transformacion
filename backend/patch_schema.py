import re

with open('prisma/schema.prisma', 'r', encoding='utf-8') as f:
    schema = f.read()

schema = schema.replace(
    'tiposEvidenciaRequeridos String[] // Array de strings o JSON',
    'tiposEvidenciaRequeridos String[] // Array de strings o JSON\n  correosNotificacion      String[] @default([])'
)

with open('prisma/schema.prisma', 'w', encoding='utf-8') as f:
    f.write(schema)
