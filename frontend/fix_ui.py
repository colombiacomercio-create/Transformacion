import os

with open('src/components/gestion/TablaGestionResultados.tsx', 'r', encoding='utf-8') as f:
    tgr = f.read()

tgr = tgr.replace("ENTIDAD_DISTRITO: 'Entidad Distrito'", "ENTIDAD_DISTRITO: 'Distrito'")
tgr = tgr.replace("OTRA_ENTIDAD: 'Otras entidades y actores'", "OTRA_ENTIDAD: 'Otros'")

tgr = tgr.replace(
    '''<Pie data={dataPieContraparte} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>''',
    '''<Pie data={dataPieContraparte} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}>'''
)

if '<Legend ' not in tgr.split('dataPieContraparte')[1][:500]:
    tgr = tgr.replace(
        '''<Pie data={dataPieContraparte} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}>\n                  {dataPieContraparte.map((_: any, i: number) => <Cell key={i} fill={COLORS_PIE[i % COLORS_PIE.length]} />)}\n                </Pie>\n                <Tooltip />''',
        '''<Pie data={dataPieContraparte} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}>\n                  {dataPieContraparte.map((_: any, i: number) => <Cell key={i} fill={COLORS_PIE[i % COLORS_PIE.length]} />)}\n                </Pie>\n                <Tooltip />\n                <Legend wrapperStyle={{ fontSize: "11px" }} />'''
    )

with open('src/components/gestion/TablaGestionResultados.tsx', 'w', encoding='utf-8') as f:
    f.write(tgr)

with open('src/components/PanelAlertas.tsx', 'r', encoding='utf-8') as f:
    pa = f.read()

old_h3 = '<h3 className="text-gray-800 font-bold text-lg">{a.descripcion}</h3>'
new_h3 = '''<h3 className="text-gray-800 font-bold text-lg leading-tight">
                      {a.descripcion ? (a.descripcion.split(/[\\n\\.]/)[0].substring(0, 80) + (a.descripcion.length > 80 && !a.descripcion.includes('.') ? "..." : "")) : "Alerta"}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{a.descripcion}</p>'''

pa = pa.replace(old_h3, new_h3)

with open('src/components/PanelAlertas.tsx', 'w', encoding='utf-8') as f:
    f.write(pa)
    
print("UI files updated")
