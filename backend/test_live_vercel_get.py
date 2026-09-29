import urllib.request
url = "https://transformacion-backend.vercel.app/api/actividades"
req = urllib.request.Request(url, method="GET", headers={"Authorization": "Bearer bypass-token"})
try:
    with urllib.request.urlopen(req) as response:
        print("Status:", response.status)
        print("Body length:", len(response.read()))
except urllib.error.HTTPError as e:
    print("Status:", e.code)
    print("Body:", e.read().decode('utf-8')[:200])
