import urllib.request

id = "003189aa-5527-400b-bd0d-b873523bd320" # UUID format
url = f"https://transformacion-backend.vercel.app/api/actividades/{id}"
req = urllib.request.Request(url, method="DELETE", headers={"Authorization": "Bearer bypass-token"})

try:
    with urllib.request.urlopen(req) as response:
        print("Status:", response.status)
        print("Body:", response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("Status:", e.code)
    print("Body:", e.read().decode('utf-8'))
