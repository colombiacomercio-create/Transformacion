import re

with open('frontend/src/components/Dashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix "Cumplimiento Global" number.
# Find: <span className="text-5xl font-bold text-[#FFCD00]">{stats.evaluadas}</span>
# Replace with: <span className="text-5xl font-bold text-[#FFCD00]">{stats.avance}%</span>
content = content.replace('<span className="text-5xl font-bold text-[#FFCD00]">{stats.evaluadas}</span>',
                          '<span className="text-5xl font-bold text-[#FFCD00]">{stats.avance}%</span>')

# 2. Fix the BarChart for localities to show YAxis text
# Find: <BarChart data={dataBars} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 20 }}>
# Replace with: <BarChart data={dataBars} layout="vertical" margin={{ top: 0, right: 30, left: 80, bottom: 20 }}>
content = content.replace('<BarChart data={dataBars} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 20 }}>',
                          '<BarChart data={dataBars} layout="vertical" margin={{ top: 0, right: 30, left: 80, bottom: 20 }}>')

# And add width={80} or width={100} to YAxis if it doesn't have it
# Find: <YAxis dataKey="name" type="category" tick={{ fill: '#4b5563', fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
# Replace with width={90} inside.
content = content.replace('<YAxis dataKey="name" type="category" tick={{ fill: \'#4b5563\', fontSize: 10, fontWeight: \'bold\' }} axisLine={false} tickLine={false} />',
                          '<YAxis dataKey="name" type="category" width={90} tick={{ fill: \'#4b5563\', fontSize: 10, fontWeight: \'bold\' }} axisLine={false} tickLine={false} />')

# 3. Fix the Radar Chart
# Replace mockDataRadar with aspiracionesDinamicas
content = content.replace('data={mockDataRadar}', 'data={aspiracionesDinamicas}')
# Replace dataKey="subject" with dataKey="name"
content = content.replace('dataKey="subject"', 'dataKey="name"')
# Replace dataKey="B" with dataKey="avance"
content = content.replace('dataKey="B"', 'dataKey="avance"')

# 4. Filter objetivosAPI to only those with activities.
# In the return statement:
# {objetivosAPI.map(obj => {
# We will change it to:
# {objetivosAPI.filter(obj => dataBars.length > 0 /* meaning there's data */).map... wait, we need objIdsConActividades.
# Actually, let's just create `const objIdsConActividades = new Set(dataBars... no, data is not available there unless we save it.
# Wait! In useEffect for activities, we can save `objIdsConActividades` in a state!
# But easier: Instead of filtering in render, let's filter in the `setObjetivosAPI`!
# Ah, `setObjetivosAPI(sorted)` happens in the `fetchApi('/api/planes')`. But at that time, `actividades` might not be loaded.
# Let's add a state: `const [objIdsConActividades, setObjIdsConActividades] = useState<Set<string>>(new Set());`
# And in the first useEffect, `setObjIdsConActividades(new Set(data.map((a: any) => a.hito?.programa?.objetivoId).filter(Boolean)));`
# Then in render: `{objetivosAPI.filter(obj => objIdsConActividades.has(obj.id)).map(obj => {`

# Wait! The easiest way is to add it to state.
state_str = "const [aspiracionesDinamicas, setAspiracionesDinamicas] = useState<any[]>(mockAvancePorAspiraciones);"
new_state_str = state_str + "\n  const [objIdsConActividades, setObjIdsConActividades] = useState<Set<string>>(new Set());"
content = content.replace(state_str, new_state_str)

set_obj_ids = "setAspiracionesDinamicas(aspiracionesArr);"
new_set_obj_ids = set_obj_ids + "\n         setObjIdsConActividades(new Set(data.map((a: any) => a.hito?.programa?.objetivo?.id).filter(Boolean)));"
content = content.replace(set_obj_ids, new_set_obj_ids)

map_str = "{objetivosAPI.map(obj => {"
new_map_str = "{objetivosAPI.filter(obj => objIdsConActividades.has(obj.id)).map(obj => {"
content = content.replace(map_str, new_map_str)

with open('frontend/src/components/Dashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
