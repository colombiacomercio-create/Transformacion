import psycopg2

conn = psycopg2.connect("postgresql://postgres.chyxultlgupbvhtgkxek:%2Az%24%2CWP%2F%23Tx4%2CkKW@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true")
cur = conn.cursor()

corrections = {
    "Ingenier\ufffda de Detalle": "Ingenier\u00eda de Detalle",
    "Participaci\ufffdn": "Participaci\u00f3n",
    "Reducci\ufffdn PC": "Reducci\u00f3n PC",
    "Transformaci\ufffdn": "Transformaci\u00f3n",
    "Cartograf\ufffda": "Cartograf\u00eda",
    "Cap\ufffdtulo": "Cap\u00edtulo"
}

for bad, good in corrections.items():
    cur.execute("UPDATE \"Programa\" SET nombre = %s WHERE nombre = %s;", (good, bad))

obj_corrections = {
    "Ejecuci\ufffdn presupuestal": "Ejecuci\u00f3n presupuestal",
    "Espacio P\ufffdblico": "Espacio P\u00fablico"
}

for bad, good in obj_corrections.items():
    cur.execute("UPDATE \"ObjetivoEstrategico\" SET nombre = %s WHERE nombre = %s;", (good, bad))

conn.commit()
print("Done")
