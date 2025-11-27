import os
from datetime import datetime, timedelta
from typing import Optional, List, Any, Dict

from fastapi import FastAPI, HTTPException, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.security import OAuth2PasswordRequestForm
from jose import JWTError, jwt
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, Field
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-this-in-production")
JWT_ALGORITHM = "HS256"

EMAIL_HOST = os.getenv("EMAIL_HOST", "")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_USER = os.getenv("EMAIL_USER", "")
EMAIL_PASS = os.getenv("EMAIL_PASS", "")
EMAIL_FROM = os.getenv("EMAIL_FROM", EMAIL_USER)

if not MONGODB_URI:
    raise RuntimeError("MONGODB_URI environment variable is required")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI(title="Stream Watch API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    app.state.mongo_client = AsyncIOMotorClient(MONGODB_URI)
    db_name = os.getenv("MONGODB_DB_NAME")
    if db_name:
        app.state.db = app.state.mongo_client[db_name]
    else:
        app.state.db = app.state.mongo_client.get_default_database()


@app.on_event("shutdown")
async def shutdown_event():
    app.state.mongo_client.close()


def get_db(request: Request):
    return request.app.state.db


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserBase(BaseModel):
    username: str = Field(..., min_length=3)
    email: EmailStr
    role: str = Field("user", pattern="^(user|admin)$")


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserPublic(UserBase):
    id: str = Field(..., alias="_id")
    isVerified: bool

    class Config:
        populate_by_name = True


class SensorPowerStats(BaseModel):
    voltage: float
    current: float
    wattage: float


class SensorDataCreate(BaseModel):
    temperature: float
    water_level: float
    power_stats: SensorPowerStats
    location: str = "sensor-001"


class SensorData(SensorDataCreate):
    id: str = Field(..., alias="_id")
    timestamp: datetime

    class Config:
        populate_by_name = True


class AIQueryRequest(BaseModel):
    question: str
    username: Optional[str] = None


class AIQueryResponse(BaseModel):
    question: str
    mongoQuery: Dict[str, Any]
    result: Any
    naturalAnswer: str


class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str = Field(..., min_length=6)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(hours=24))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt


async def send_email_async(subject: str, to_email: str, body: str):
    if not (EMAIL_HOST and EMAIL_USER and EMAIL_PASS and EMAIL_FROM):
        print("Email settings not fully configured; printing email instead:")
        print("=== EMAIL START ===")
        print("To:", to_email)
        print("Subject:", subject)
        print(body)
        print("=== EMAIL END ===")
        return

    import smtplib
    from email.mime.text import MIMEText

    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = EMAIL_FROM
    msg["To"] = to_email

    try:
        with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as server:
            server.starttls()
            server.login(EMAIL_USER, EMAIL_PASS)
            server.send_message(msg)
    except Exception as e:
        print("Failed to send email:", e)
        raise HTTPException(status_code=500, detail="Failed to send email")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


async def get_user_by_username(db, username: str):
    return await db.users.find_one({"username": username})


async def get_user_by_email(db, email: str):
    return await db.users.find_one({"email": email.lower()})


@app.get("/health")
async def health():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}


@app.post("/api/auth/register")
async def register_user(payload: UserCreate, db=Depends(get_db)):
    existing = await db.users.find_one(
        {"$or": [{"username": payload.username}, {"email": payload.email.lower()}]}
    )
    if existing:
        raise HTTPException(status_code=409, detail="Username or email already exists")

    otp = f"{os.urandom(3).hex()[:6]}".upper()[:6]
    now = datetime.utcnow()
    user_doc = {
        "username": payload.username.strip(),
        "email": payload.email.lower(),
        "password": hash_password(payload.password),
        "role": payload.role,
        "otp": otp,
        "otpExpires": now + timedelta(minutes=10),
        "isVerified": False,
        "createdAt": now,
        "lastLogin": None,
        "resetOtp": None,
        "resetOtpExpires": None,
    }
    await db.users.insert_one(user_doc)

    await send_email_async(
        subject="Your Verification Code",
        to_email=payload.email,
        body=f"Your Stream Watch verification code is: {otp}",
    )

    return {
        "success": True,
        "message": "Registration successful. Please check your email for OTP.",
        "email": payload.email,
    }


@app.post("/api/auth/verify-otp")
async def verify_otp(payload: OTPVerifyRequest, db=Depends(get_db)):
    user = await get_user_by_email(db, payload.email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.get("isVerified"):
        raise HTTPException(status_code=400, detail="User already verified")

    if user.get("otp") != payload.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    if user.get("otpExpires") and user["otpExpires"] < datetime.utcnow():
        raise HTTPException(status_code=400, detail="OTP expired")

    await db.users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {"isVerified": True},
            "$unset": {"otp": "", "otpExpires": ""},
        },
    )

    return {"success": True, "message": "Email verified successfully. You can now login."}


@app.post("/api/auth/login", response_model=Dict[str, Any])
async def login(form: OAuth2PasswordRequestForm = Depends(), db=Depends(get_db)):
    username = form.username
    password = form.password
    user = await get_user_by_username(db, username.strip())
    if not user or not verify_password(password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    if not user.get("isVerified"):
        raise HTTPException(status_code=403, detail="Please verify your email first")

    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"lastLogin": datetime.utcnow()}},
    )

    token = create_access_token(
        {"sub": str(user["_id"]), "username": user["username"], "role": user["role"]}
    )

    user_public = {
        "id": str(user["_id"]),
        "username": user["username"],
        "email": user["email"],
        "role": user["role"],
    }

    return {
        "success": True,
        "token": token,
        "user": user_public,
        "message": "Login successful",
    }


@app.post("/api/auth/logout")
async def logout():
    return {"success": True, "message": "Logged out successfully"}


@app.post("/api/auth/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest, db=Depends(get_db)):
    user = await get_user_by_email(db, payload.email)
    if not user:
        return {"success": True, "message": "If that email exists, a code has been sent"}

    otp = f"{os.urandom(3).hex()[:6]}".upper()[:6]
    expires = datetime.utcnow() + timedelta(minutes=10)

    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"resetOtp": otp, "resetOtpExpires": expires}},
    )

    await send_email_async(
        subject="Your Password Reset Code",
        to_email=payload.email,
        body=f"Your Stream Watch password reset code is: {otp}",
    )

    return {
        "success": True,
        "message": "If that email exists, a reset code has been sent.",
    }


@app.post("/api/auth/reset-password")
async def reset_password(payload: ResetPasswordRequest, db=Depends(get_db)):
    user = await get_user_by_email(db, payload.email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.get("resetOtp") != payload.otp:
        raise HTTPException(status_code=400, detail="Invalid reset code")

    if user.get("resetOtpExpires") and user["resetOtpExpires"] < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Reset code expired")

    await db.users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {"password": hash_password(payload.new_password)},
            "$unset": {"resetOtp": "", "resetOtpExpires": ""},
        },
    )

    return {"success": True, "message": "Password reset successful. You can now log in."}


@app.get("/api/sensor-data", response_model=List[SensorData])
async def list_sensor_data(db=Depends(get_db)):
    cursor = db.sensor_data.find().sort("timestamp", -1).limit(100)
    docs = await cursor.to_list(length=100)
    for doc in docs:
        doc["_id"] = str(doc["_id"])
    return docs


@app.post("/api/sensor-data", response_model=SensorData, status_code=status.HTTP_201_CREATED)
async def create_sensor_data(payload: SensorDataCreate, db=Depends(get_db)):
    doc = payload.dict()
    doc["timestamp"] = datetime.utcnow()
    result = await db.sensor_data.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc


@app.put("/api/sensor-data/{item_id}", response_model=SensorData)
async def update_sensor_data(item_id: str, payload: SensorDataCreate, db=Depends(get_db)):
    from bson import ObjectId

    try:
        obj_id = ObjectId(item_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID")

    update_doc = payload.dict()
    result = await db.sensor_data.find_one_and_update(
        {"_id": obj_id},
        {"$set": update_doc},
        return_document=True,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Sensor data not found")
    result["_id"] = str(result["_id"])
    return result


@app.delete("/api/sensor-data/{item_id}")
async def delete_sensor_data(item_id: str, db=Depends(get_db)):
    from bson import ObjectId

    try:
        obj_id = ObjectId(item_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID")

    result = await db.sensor_data.delete_one({"_id": obj_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Sensor data not found")
    return {"message": "Sensor data deleted successfully", "id": item_id}


@app.post("/api/ai-query", response_model=AIQueryResponse)
async def ai_query(payload: AIQueryRequest, db=Depends(get_db)):
    question = payload.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question is required")

    try:
        import google.generativeai as genai

        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY not configured")
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.0-flash")
        prompt = (
            "You are a helpful assistant for a sensor monitoring system. "
            "Given the following user question, generate a short natural language answer "
            "without performing any real database queries. Question: " + question
        )
        result = model.generate_content(prompt)
        answer_text = (result.text or "").strip()
    except Exception as e:
        print("AI error:", e)
        answer_text = "AI explanation is temporarily unavailable, but your question was received."

    sample_result: List[Dict[str, Any]] = []

    return AIQueryResponse(
        question=question,
        mongoQuery={"type": "info", "query": {}},
        result=sample_result,
        naturalAnswer=answer_text,
    )


@app.get("/api/ai-query-history/{username}")
async def ai_query_history(username: str):
    return {"history": []}


@app.get("/admin/stats", response_class=HTMLResponse)
async def admin_stats():
    html = """
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Stream Watch - Admin Dashboard</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at top left, #4c1d95, #020617 55%);
      color: #f9fafb;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .card {
      position: relative;
      width: 90%;
      max-width: 960px;
      padding: 32px 32px 28px;
      border-radius: 24px;
      background: linear-gradient(135deg, rgba(15,23,42,0.96), rgba(15,23,42,0.9));
      border: 1px solid rgba(148,163,184,0.4);
      box-shadow:
        0 40px 80px rgba(15,23,42,0.9),
        0 0 0 1px rgba(15,23,42,0.8);
      overflow: hidden;
    }
    .card::before,
    .card::after {
      content: "";
      position: absolute;
      border-radius: 999px;
      filter: blur(40px);
      opacity: 0.8;
      pointer-events: none;
    }
    .card::before {
      width: 260px;
      height: 260px;
      background: radial-gradient(circle, rgba(168,85,247,0.35), transparent 70%);
      top: -80px;
      right: -40px;
    }
    .card::after {
      width: 260px;
      height: 260px;
      background: radial-gradient(circle, rgba(59,130,246,0.35), transparent 70%);
      bottom: -80px;
      left: -40px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      position: relative;
      z-index: 1;
    }
    .title-group {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .logo {
      width: 56px;
      height: 56px;
      border-radius: 18px;
      background: radial-gradient(circle at 30% 20%, #f97316, #e11d48 40%, #4f46e5 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 18px 45px rgba(15,23,42,0.9);
    }
    .logo span {
      font-weight: 800;
      letter-spacing: 0.08em;
      font-size: 10px;
      text-transform: uppercase;
    }
    .title-text h1 {
      font-size: 24px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin: 0 0 4px;
    }
    .title-text p {
      margin: 0;
      font-size: 12px;
      color: #9ca3af;
    }
    .badge {
      border-radius: 999px;
      background: rgba(15,23,42,0.9);
      border: 1px solid rgba(148,163,184,0.5);
      padding: 6px 12px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.09em;
      color: #e5e7eb;
    }
    .body {
      position: relative;
      z-index: 1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 32px;
    }
    .headline {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .sub {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 6px 12px;
      border-radius: 999px;
      border: 1px solid rgba(248,250,252,0.3);
      font-size: 11px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #e5e7eb;
      margin-bottom: 16px;
    }
    .pill {
      font-size: 11px;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      padding: 6px 10px;
      border-radius: 999px;
      border: 1px solid rgba(148,163,184,0.6);
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: #9ca3af;
    }
    .pill span.dot {
      width: 6px;
      height: 6px;
      border-radius: 999px;
      background: #22c55e;
      box-shadow: 0 0 0 4px rgba(34,197,94,0.35);
    }
    .right-cta {
      text-align: right;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      border-radius: 999px;
      border: none;
      padding: 10px 20px;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #f9fafb;
      cursor: pointer;
      background: linear-gradient(135deg, #4f46e5, #ec4899);
      box-shadow: 0 16px 30px rgba(15,23,42,0.9);
    }
    .btn small {
      font-size: 10px;
      opacity: 0.8;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="title-group">
        <div class="logo">
          <span>SW</span>
        </div>
        <div class="title-text">
          <h1>Stream Watch</h1>
          <p>Admin stats console</p>
        </div>
      </div>
      <div class="badge">Admin / Overview</div>
    </div>
    <div class="body">
      <div>
        <div class="headline">NO DATA YET</div>
        <div class="sub">
          <span>Metrics will appear once traffic flows</span>
        </div>
        <div class="pill">
          <span class="dot"></span>
          Live pipeline ready
        </div>
      </div>
      <div class="right-cta">
        <button class="btn" onclick="window.close()">
          <span>Back to dashboard</span>
          <small>close this tab</small>
        </button>
      </div>
    </div>
  </div>
</body>
</html>
"""
    return HTMLResponse(content=html)



