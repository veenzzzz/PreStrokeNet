import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from dotenv import load_dotenv
load_dotenv()

from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User

client = TestClient(app)

def main():
    print("==================================================")
    print("VERIFYING API ENDPOINTS FOR REAL AI PROVIDER")
    print("==================================================")

    db = SessionLocal()
    user = db.query(User).filter(User.email == "admin@prestrokenet.org").first()
    if not user:
        user = User(
            full_name="Admin Doctor",
            email="admin@prestrokenet.org",
            password=hash_password("Admin@123456"),
            role="Admin",
            is_active=True
        )
        db.add(user)
        db.commit()
    db.close()

    # Login to get valid JWT token
    login_res = client.post("/auth/login", json={"email": "admin@prestrokenet.org", "password": "Admin@123456"})
    if login_res.status_code != 200:
        print(f"Login failed: {login_res.status_code} {login_res.json()}")
        return

    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Test GET /clinical-assistant/health
    res_health = client.get("/clinical-assistant/health", headers=headers)
    print(f"\nGET /clinical-assistant/health status code: {res_health.status_code}")
    print(f"Health Response: {res_health.json()}")

    # 2. Test POST /clinical-assistant/chat
    payload = {"message": "What is the patient's current risk level?"}
    res_chat = client.post("/clinical-assistant/chat", json=payload, headers=headers)
    print(f"\nPOST /clinical-assistant/chat status code: {res_chat.status_code}")
    print(f"Chat Response: {res_chat.json()}")

if __name__ == "__main__":
    main()
