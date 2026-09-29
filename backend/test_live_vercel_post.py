import urllib.request
url = "https://transformacion-backend.vercel.app/api/actividades/importar"
req = urllib.request.Request(url, method="POST", headers={"Authorization": "Bearer bypass-token"})
try:
    with urllib.request.urlopen(req) as response:
        print("Status:", response.status)
except urllib.error.HTTPError as e:
    print("Status:", e.code)
    print("Body:", e.read().decode('utf-8')[:200])
