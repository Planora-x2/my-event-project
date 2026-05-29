import urllib.request
import urllib.parse
import json

# Login
login_url = "http://localhost:8000/api/auth/login/"
login_data = json.dumps({"username": "admin", "password": "adminpassword123"}).encode('utf-8')
req = urllib.request.Request(login_url, data=login_data, headers={'Content-Type': 'application/json'})
try:
    with urllib.request.urlopen(req) as response:
        login_res = json.loads(response.read().decode())
        access_token = login_res.get('access')
        
        # Get users
        users_req = urllib.request.Request("http://localhost:8000/api/admin/users/", headers={'Authorization': f'JWT {access_token}'})
        with urllib.request.urlopen(users_req) as users_res:
            users_data = json.loads(users_res.read().decode())
            print("USERS:", json.dumps(users_data, indent=2))
            
        # Get events
        events_req = urllib.request.Request("http://localhost:8000/api/events/", headers={'Authorization': f'JWT {access_token}'})
        with urllib.request.urlopen(events_req) as events_res:
            events_data = json.loads(events_res.read().decode())
            print("EVENTS:", json.dumps(events_data, indent=2))
            
except Exception as e:
    print("Error:", e)
