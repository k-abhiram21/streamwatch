import os
import json
import re
import asyncio
import logging
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any, Union
from enum import Enum

from fastapi import FastAPI, HTTPException, Depends, Request, Response, status, Body, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, Field, EmailStr, validator
from motor.motor_asyncio import AsyncIOMotorClient
# from passlib.context import CryptContext # Removed
from jose import JWTError, jwt
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
import google.generativeai as genai
from email.message import EmailMessage
import aiosmtplib
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
PORT = int(os.getenv("PORT", 5000))
MONGODB_URI = os.getenv("MONGODB_URI")
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-this-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 24 * 60  # 24 hours

# Email Config
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")
SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_SECURE = str(os.getenv("SMTP_SECURE", "")).lower() == "true"
EMAIL_SERVICE = os.getenv("EMAIL_SERVICE", "gmail")

# Gemini Config
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("stream-watch")

# MongoDB Client (Global)
client: AsyncIOMotorClient = None
db = None

# FastAPI App
# app = FastAPI(title="Stream Watch Backend", version="1.0.0") # Moved to bottom


# --- Security & Utils (Ported from security.js) ---

ALLOWED_FIELDS = {
    'temperature', 'water_level', 'timestamp', 'location',
    'power_stats.voltage', 'power_stats.current', 'power_stats.wattage'
}
POWER_STATS_FIELDS = {'voltage', 'current', 'wattage'}
ALLOWED_OPERATORS = {
    '$gt', '$gte', '$lt', '$lte', '$eq', '$ne', '$in', '$nin', '$and', '$or',
    '$not', '$regex', '$exists', '$size', '$elemMatch', '$sum', '$avg', '$max',
    '$min', '$first', '$last', '$push', '$add', '$subtract', '$multiply',
    '$divide', '$ceil', '$floor', '$count'
}
PROHIBITED_KEYS = {
    '$where', '$function', '$lookup', '$graphLookup', '$out', '$merge', '$accumulator'
}
ALLOWED_PIPELINE_STAGES = {
    '$match', '$group', '$sort', '$limit', '$project', '$unwind', '$count'
}
MALICIOUS_PATTERNS = [
    re.compile(r'\bdrop\s+(database|collection|table)', re.IGNORECASE),
    re.compile(r'\bdelete\s+(database|collection|from)', re.IGNORECASE),
    re.compile(r'\bdelete\s+.*database', re.IGNORECASE), # Catch "delete this database"
    re.compile(r'\bshutdown\b', re.IGNORECASE),
    re.compile(r'\bkill\s+cursor\b', re.IGNORECASE),
    re.compile(r'\b(?:rm|remove)\s+(?:-rf|\*)', re.IGNORECASE),
    re.compile(r'\$where', re.IGNORECASE),
    re.compile(r'\$function', re.IGNORECASE),
    re.compile(r'function\s*\(', re.IGNORECASE),
    re.compile(r'\beval\s*\(', re.IGNORECASE),
    re.compile(r';.*?--', re.IGNORECASE),
    re.compile(r'\$merge', re.IGNORECASE),
    re.compile(r'\$out', re.IGNORECASE),
    re.compile(r'createCollection', re.IGNORECASE),
    re.compile(r'dropDatabase', re.IGNORECASE),
    re.compile(r'renameCollection', re.IGNORECASE)
]

# ... (rest of the file)

async def convert_to_mongo_query(question: str):
    try:
        model = genai.GenerativeModel('gemini-2.0-flash')
        prompt = f"""You are a MongoDB query generator. Convert the following natural language question into a valid MongoDB query.

Rules:
1. Return ONLY a JSON object. No markdown, no explanations.
2. The JSON must have a "type" field: either "find" or "aggregate".
3. If "type" is "find", include a "find" object with "filter", "projection", "sort", and "limit".
4. If "type" is "aggregate", include a "pipeline" array.
5. Use the 'sensor_data' collection schema:
   - temperature (Number)
   - water_level (Number)
   - power_stats.voltage (Number)
   - power_stats.current (Number)
   - power_stats.wattage (Number)
   - timestamp (Date)
   - location (String)
6. For date comparisons, use ISO date strings.
7. Do not use $where, $function, or arbitrary code execution.

Question: {question}

Response (JSON only):"""
        
        response = await model.generate_content_async(prompt)
        text = response.text.strip()
        
        # Remove markdown code blocks if present
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
            
        return json.loads(text.strip())
    except Exception as e:
        if "429" in str(e):
             logger.error(f"Gemini API Quota Exceeded: {e}")
             raise HTTPException(status_code=429, detail="AI Service is currently busy (Quota Exceeded). Please try again later.")
        logger.error(f"Error converting to MongoDB query: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to convert question to MongoDB query: {str(e)}")
MAX_QUERY_LIMIT = 500

def detect_malicious_query(question: str) -> Optional[str]:
    """Detects malicious patterns in the natural language question."""
    if not question:
        return "Question is empty"
    if len(question) > 500:
        return "Question is too long"
    
    for pattern in MALICIOUS_PATTERNS:
        if pattern.search(question):
            return "Question triggered security safeguards"
    return None

def validate_mongo_query(query_obj: Dict[str, Any]) -> Dict[str, Any]:
    """Validates the structure of the generated MongoDB query."""
    q_type = query_obj.get("type")
    query = query_obj.get("query")

    query_str = json.dumps(query)
    dangerous_ops = ['$where', '$function', '$accumulator', '$merge', '$out']
    for op in dangerous_ops:
        if op in query_str:
            return {"valid": False, "reason": f"Dangerous operator {op} detected"}

    if q_type == 'aggregate' and isinstance(query, list):
        for stage in query:
            if not isinstance(stage, dict): continue
            stage_keys = list(stage.keys())
            for key in stage_keys:
                if key not in ALLOWED_PIPELINE_STAGES:
                     return {"valid": False, "reason": f"Disallowed aggregation stage: {key}"}

    return {"valid": True}

def convert_iso_dates(obj: Any) -> Any:
    """Recursively converts ISO date strings to datetime objects."""
    if isinstance(obj, dict):
        return {k: convert_iso_dates(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_iso_dates(item) for item in obj]
    elif isinstance(obj, str):
        # Match ISO format roughly: YYYY-MM-DD...
        if re.match(r'^\d{4}-\d{2}-\d{2}', obj):
            try:
                # Handle Z for UTC
                s = obj.replace('Z', '+00:00')
                return datetime.fromisoformat(s)
            except ValueError:
                pass
    return obj

# --- Prometheus Metrics (Ported from server.js) ---

# --- Prometheus Metrics (Ported from server.js) ---

from prometheus_client import REGISTRY

def get_or_create_counter(name, documentation, labels):
    try:
        return Counter(name, documentation, labels)
    except ValueError:
        # If already registered, try to unregister and re-register (for reload safety)
        try:
            if name in REGISTRY._names_to_collectors:
                REGISTRY.unregister(REGISTRY._names_to_collectors[name])
        except Exception:
            pass
        return Counter(name, documentation, labels)

def get_or_create_histogram(name, documentation, labels, buckets):
    try:
        return Histogram(name, documentation, labels, buckets=buckets)
    except ValueError:
        try:
            if name in REGISTRY._names_to_collectors:
                REGISTRY.unregister(REGISTRY._names_to_collectors[name])
        except Exception:
            pass
        return Histogram(name, documentation, labels, buckets=buckets)

def get_or_create_gauge(name, documentation, labels):
    try:
        return Gauge(name, documentation, labels)
    except ValueError:
        try:
            if name in REGISTRY._names_to_collectors:
                REGISTRY.unregister(REGISTRY._names_to_collectors[name])
        except Exception:
            pass
        return Gauge(name, documentation, labels)

CLIENT_QUERY_TRAFFIC = get_or_create_gauge(
    'client_query_traffic',
    'Total number of queries by client',
    ['user_name', 'client_ip', 'query_type']
)

PACKET_SIZE_BYTES = get_or_create_histogram(
    'packet_size_bytes',
    'Size of packets (queries and responses) in bytes',
    ['direction', 'user_name'],
    buckets=[100, 500, 1000, 5000, 10000, 50000, 100000]
)

STREAMWATCH_AI_QUERY_LOG = get_or_create_gauge(
    'streamwatch_ai_query_log',
    'AI queries with full context exposed via labels',
    ['user_name', 'client_ip', 'status', 'question', 'mongo_query', 'result']
)

# In-memory storage (Ported from server.js)
query_history = []
user_stats = {}

def track_query_history(username: str, client_ip: str, question: str, mongo_query: Any, query_type: str):
    entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "username": username,
        "clientIP": client_ip,
        "question": question or query_type,
        "mongoQuery": json.dumps(mongo_query, default=str) if mongo_query else None,
        "queryType": query_type
    }
    query_history.append(entry)
    if len(query_history) > 1000:
        query_history.pop(0)

    if username not in user_stats:
        user_stats[username] = {
            "ip": client_ip,
            "queries": [],
            "packets": {"sent": 0, "received": 0},
            "lastSeen": datetime.utcnow().isoformat()
        }
    
    stats = user_stats[username]
    stats["queries"].append(entry)
    stats["lastSeen"] = datetime.utcnow().isoformat()
    if len(stats["queries"]) > 100:
        stats["queries"].pop(0)

def update_packet_stats(username: str, direction: str, size: int):
    if username not in user_stats:
        user_stats[username] = {
            "ip": "unknown",
            "queries": [],
            "packets": {"sent": 0, "received": 0},
            "lastSeen": datetime.utcnow().isoformat()
        }
    stats = user_stats[username]
    if direction == 'request':
        stats["packets"]["sent"] += size
    else:
        stats["packets"]["received"] += size

def record_packet_size(direction: str, username: str, size: int):
    PACKET_SIZE_BYTES.labels(direction=direction, user_name=username or 'anonymous').observe(size)
    update_packet_stats(username or 'anonymous', direction, size)

# --- Database & Models ---

class SensorDataModel(BaseModel):
    temperature: float
    water_level: float
    power_stats: Dict[str, float]
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    location: str = "sensor-001"

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}

class UserRegister(BaseModel):
    username: str = Field(..., min_length=3)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: str = "user"

class UserLogin(BaseModel):
    username: str
    password: str

class VerifyOTP(BaseModel):
    email: EmailStr
    otp: str

class AIQuery(BaseModel):
    question: str
    username: Optional[str] = None

# --- Auth Helpers ---

import bcrypt

# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto") # Removed passlib
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

def get_password_hash(password):
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password, hashed_password):
    try:
        pwd_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(pwd_bytes, hashed_bytes)
    except Exception as e:
        logger.error(f"Error verifying password: {e}")
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(request: Request):
    token = request.cookies.get("token")
    if not token:
        # Try header
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
    
    if not token:
        return None # Anonymous

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        username: str = payload.get("username")
        if username is None:
            return None
        return payload
    except JWTError:
        return None

def get_client_ip(request: Request):
    return request.client.host or "unknown"

# --- Email Helper ---

async def send_otp_email(email: str, otp: str):
    logger.info(f"==================================================")
    logger.info(f"🔐 OTP for {email}: {otp}")
    logger.info(f"==================================================")

    if not EMAIL_USER or not EMAIL_PASS:
        logger.warning("⚠️ Email credentials not found. OTP sent to console only.")
        return

    message = EmailMessage()
    message["From"] = EMAIL_USER
    message["To"] = email
    message["Subject"] = "Stream Watch - Your Verification Code"
    message.set_content(f"Your OTP is: {otp}\n\nThis code will expire in 10 minutes.")

    try:
        if SMTP_HOST:
            await aiosmtplib.send(
                message,
                hostname=SMTP_HOST,
                port=SMTP_PORT,
                username=EMAIL_USER,
                password=EMAIL_PASS,
                use_tls=SMTP_SECURE
            )
        else:
            # Fallback for gmail service is tricky with aiosmtplib directly, usually requires host
            # Assuming gmail host if not specified but service is gmail
            await aiosmtplib.send(
                message,
                hostname="smtp.gmail.com",
                port=587,
                username=EMAIL_USER,
                password=EMAIL_PASS,
                start_tls=True
            )
        logger.info(f"📧 OTP email sent to {email}")
    except Exception as e:
        logger.error(f"❌ Error sending OTP email: {e}")

# --- AI Logic (Ported from ai.js) ---

def get_gen_ai():
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not set")
    return genai.GenerativeModel('gemini-2.0-flash')

async def convert_to_mongo_query(question: str):
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = get_gen_ai()
        
        prompt = f"""You are a MongoDB query generator. Convert the following natural language question into a valid MongoDB query.

Rules:
1. Return ONLY a valid JSON object with this exact structure:
   {{
     "type": "find" or "aggregate",
     "query": {{ ... }} // MongoDB query object
   }}

2. For "find" queries, use the structure: {{ "filter": {{...}}, "projection": {{...}}, "sort": {{...}}, "limit": number }}
   Example: {{ "filter": {{ "temperature": {{ "$gt": 50 }} }}, "sort": {{ "timestamp": -1 }}, "limit": 10 }}
   
3. For "aggregate" queries, return an array of pipeline stages in the "query" field
   Example: {{ "type": "aggregate", "query": [{{ "$match": {{...}} }}, {{ "$group": {{...}} }}] }}

4. The collection name is "sensor_data" (you don't need to include it in the query)
5. Common fields: temperature (Number), water_level (Number), power_stats.voltage (Number), power_stats.current (Number), power_stats.wattage (Number), timestamp (Date), location (String)
6. Return ONLY the JSON, no explanations, no markdown, no code blocks, no backticks

Question: {question}

Response (JSON only):"""

        response = await model.generate_content_async(prompt)
        text = response.text.strip()
        
        # Clean response
        text = re.sub(r'```json\n?', '', text, flags=re.IGNORECASE)
        text = re.sub(r'```\n?', '', text)
        text = text.strip()
        
        # Extract JSON if wrapped
        match = re.search(r'\{[\s\S]*\}', text)
        if match:
            text = match.group(0)
            
        parsed = json.loads(text)
        
        if parsed.get("type") == "aggregate":
            return {
                "type": "aggregate",
                "query": parsed.get("query") or parsed.get("pipeline") or []
            }
        else:
            return {
                "type": "find",
                "query": parsed.get("query") or {
                    "filter": parsed.get("filter") or parsed,
                    "projection": parsed.get("projection") or {},
                    "sort": parsed.get("sort") or {},
                    "limit": parsed.get("limit") or 100
                }
            }

    except Exception as e:
        logger.error(f"Error converting to MongoDB query: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to convert question to MongoDB query: {str(e)}")

async def generate_natural_language_answer(question: str, query: Any, result: Any):
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = get_gen_ai()
        
        prompt = f"""Given the following:
- Original question: {question}
- MongoDB query used: {json.dumps(query, default=str)}
- Query result: {json.dumps(result, default=str)}

Provide a clear, concise natural language answer explaining what the data shows. Be specific about numbers and values found.

Answer:"""

        response = await model.generate_content_async(prompt)
        return response.text.strip()
    except Exception as e:
        logger.error(f"Error generating natural language answer: {e}")
        count = len(result) if isinstance(result, list) else 1
        return f"Found {count} result(s) matching your query."

# --- Lifespan Events ---

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global client, db
    if not MONGODB_URI:
        logger.error("❌ MONGODB_URI is not set")
        exit(1)
    
    try:
        client = AsyncIOMotorClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
        db = client.get_default_database()
        # Verify connection
        await client.server_info()
        logger.info(f"✅ Connected to MongoDB Atlas: {db.name}")
    except Exception as e:
        logger.error(f"❌ MongoDB connection error: {e}")
        exit(1)
        
    yield
    
    # Shutdown
    if client:
        client.close()
        logger.info("⚠️ MongoDB disconnected")

# FastAPI App
app = FastAPI(title="Stream Watch Backend", version="1.0.0", lifespan=lifespan)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Routes ---

@app.get("/health")
async def health_check():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}

@app.get("/metrics")
async def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

# Sensor Data Routes

@app.get("/api/sensor-data")
async def get_sensor_data(request: Request):
    try:
        user = await get_current_user(request)
        username = user["username"] if user else "anonymous"
        client_ip = get_client_ip(request)
        
        cursor = db.sensor_data.find().sort("timestamp", -1).limit(100)
        data = await cursor.to_list(length=100)
        
        # Convert ObjectId to str
        for item in data:
            item["_id"] = str(item["_id"])
            
        response_size = len(json.dumps(data, default=str))
        record_packet_size('response', username, response_size)
        track_query_history(username, client_ip, 'GET /api/sensor-data', None, 'READ')
        
        return data
    except Exception as e:
        logger.error(f"Error fetching sensor data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/sensor-data/{id}")
async def get_sensor_data_by_id(id: str, request: Request):
    try:
        user = await get_current_user(request)
        username = user["username"] if user else "anonymous"
        
        from bson import ObjectId
        data = await db.sensor_data.find_one({"_id": ObjectId(id)})
        
        if not data:
            raise HTTPException(status_code=404, detail="Sensor data not found")
            
        data["_id"] = str(data["_id"])
        
        response_size = len(json.dumps(data, default=str))
        record_packet_size('response', username, response_size)
        
        return data
    except Exception as e:
        logger.error(f"Error fetching sensor data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/sensor-data", status_code=201)
async def create_sensor_data(data: SensorDataModel, request: Request):
    try:
        user = await get_current_user(request)
        username = user["username"] if user else "anonymous"
        client_ip = get_client_ip(request)
        
        data_dict = data.dict(by_alias=True)
        request_size = len(json.dumps(data_dict, default=str))
        
        record_packet_size('request', username, request_size)
        CLIENT_QUERY_TRAFFIC.labels(user_name=username, client_ip=client_ip, query_type='CREATE').inc()
        
        result = await db.sensor_data.insert_one(data_dict)
        saved_data = await db.sensor_data.find_one({"_id": result.inserted_id})
        saved_data["_id"] = str(saved_data["_id"])
        
        response_size = len(json.dumps(saved_data, default=str))
        record_packet_size('response', username, response_size)
        track_query_history(username, client_ip, 'POST /api/sensor-data', data_dict, 'CREATE')
        
        logger.info(f"[CREATE] User: {username} | IP: {client_ip} | Created sensor data: {saved_data['_id']}")
        return saved_data
    except Exception as e:
        logger.error(f"Error creating sensor data: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/api/sensor-data/{id}")
async def update_sensor_data(id: str, data: Dict[str, Any], request: Request):
    try:
        user = await get_current_user(request)
        username = user["username"] if user else "anonymous"
        client_ip = get_client_ip(request)
        
        request_size = len(json.dumps(data, default=str))
        record_packet_size('request', username, request_size)
        CLIENT_QUERY_TRAFFIC.labels(user_name=username, client_ip=client_ip, query_type='UPDATE').inc()
        
        from bson import ObjectId
        result = await db.sensor_data.find_one_and_update(
            {"_id": ObjectId(id)},
            {"$set": data},
            return_document=True
        )
        
        if not result:
            raise HTTPException(status_code=404, detail="Sensor data not found")
            
        result["_id"] = str(result["_id"])
        
        response_size = len(json.dumps(result, default=str))
        record_packet_size('response', username, response_size)
        track_query_history(username, client_ip, f"PUT /api/sensor-data/{id}", data, 'UPDATE')
        
        logger.info(f"[UPDATE] User: {username} | IP: {client_ip} | Updated sensor data: {id}")
        return result
    except Exception as e:
        logger.error(f"Error updating sensor data: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/api/sensor-data/{id}")
async def delete_sensor_data(id: str, request: Request):
    try:
        user = await get_current_user(request)
        username = user["username"] if user else "anonymous"
        client_ip = get_client_ip(request)
        
        CLIENT_QUERY_TRAFFIC.labels(user_name=username, client_ip=client_ip, query_type='DELETE').inc()
        
        from bson import ObjectId
        result = await db.sensor_data.find_one_and_delete({"_id": ObjectId(id)})
        
        if not result:
            raise HTTPException(status_code=404, detail="Sensor data not found")
            
        track_query_history(username, client_ip, f"DELETE /api/sensor-data/{id}", None, 'DELETE')
        logger.info(f"[DELETE] User: {username} | IP: {client_ip} | Deleted sensor data: {id}")
        
        return {"message": "Sensor data deleted successfully", "id": id}
    except Exception as e:
        logger.error(f"Error deleting sensor data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Auth Routes

@app.post("/api/auth/register", status_code=201)
async def register(user_data: UserRegister, background_tasks: BackgroundTasks):
    try:
        # Check existing
        existing = await db.users.find_one({
            "$or": [{"username": user_data.username}, {"email": user_data.email.lower()}]
        })
        if existing:
            raise HTTPException(status_code=409, detail="Username or email already exists")
            
        hashed_password = get_password_hash(user_data.password)
        otp = str(int(100000 + (datetime.utcnow().timestamp() * 1000) % 900000))[:6] # Simple random OTP
        otp_expires = datetime.utcnow() + timedelta(minutes=10)
        
        new_user = {
            "username": user_data.username,
            "email": user_data.email.lower(),
            "password": hashed_password,
            "role": user_data.role,
            "otp": otp,
            "otpExpires": otp_expires,
            "isVerified": False,
            "createdAt": datetime.utcnow(),
            "lastLogin": None
        }
        
        await db.users.insert_one(new_user)
        
        background_tasks.add_task(send_otp_email, user_data.email, otp)
        
        logger.info(f"[REGISTER] New user registered: {user_data.username}")
        return {
            "success": True,
            "message": "Registration successful. Please check your email for OTP.",
            "email": user_data.email
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error registering user: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/verify-otp")
async def verify_otp(data: VerifyOTP):
    try:
        user = await db.users.find_one({"email": data.email.lower()})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        if user.get("isVerified"):
            raise HTTPException(status_code=400, detail="User already verified")
            
        if user.get("otp") != data.otp:
            raise HTTPException(status_code=400, detail="Invalid OTP")
            
        if user.get("otpExpires") < datetime.utcnow():
            raise HTTPException(status_code=400, detail="OTP expired")
            
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"isVerified": True}, "$unset": {"otp": "", "otpExpires": ""}}
        )
        
        logger.info(f"[VERIFY] User verified: {user['username']}")
        return {"success": True, "message": "Email verified successfully. You can now login."}
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error verifying OTP: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/login")
async def login(data: UserLogin, response: Response):
    try:
        user = await db.users.find_one({"username": data.username})
        if not user or not verify_password(data.password, user["password"]):
            raise HTTPException(status_code=401, detail="Invalid username or password")
            
        if not user.get("isVerified"):
            raise HTTPException(status_code=403, detail="Please verify your email first")
            
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"lastLogin": datetime.utcnow()}}
        )
        
        token_data = {"id": str(user["_id"]), "username": user["username"], "role": user.get("role", "user")}
        token = create_access_token(token_data)
        
        response.set_cookie(
            key="token",
            value=token,
            httponly=True,
            secure=os.getenv("NODE_ENV") == "production",
            max_age=24 * 60 * 60
        )
        
        logger.info(f"[LOGIN] User logged in: {user['username']}")
        return {
            "success": True,
            "token": token,
            "user": {
                "id": str(user["_id"]),
                "username": user["username"],
                "email": user["email"],
                "role": user.get("role", "user")
            },
            "message": "Login successful"
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error logging in: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/logout")
async def logout(response: Response):
    response.delete_cookie("token")
    return {"success": True, "message": "Logged out successfully"}

class ForgotPassword(BaseModel):
    email: EmailStr

class ResetPassword(BaseModel):
    email: EmailStr
    otp: str
    new_password: str = Field(..., min_length=6)

@app.post("/api/auth/forgot-password")
async def forgot_password(data: ForgotPassword, background_tasks: BackgroundTasks):
    try:
        user = await db.users.find_one({"email": data.email.lower()})
        if not user:
            # Don't reveal user existence, but for this app we might want to be explicit or just return success
            # Returning 404 as per user report "says not found" implies we should handle it gracefully or return 404 if that's the expected behavior.
            # However, standard practice is 200. But user said "it says not found", so I'll return 404 to match their observation of *missing* endpoint, 
            # OR if they meant the logic returns "User not found".
            # I will return 404 if user not found to be helpful in this internal tool context.
            raise HTTPException(status_code=404, detail="User not found")
            
        otp = str(int(100000 + (datetime.utcnow().timestamp() * 1000) % 900000))[:6]
        otp_expires = datetime.utcnow() + timedelta(minutes=10)
        
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"otp": otp, "otpExpires": otp_expires}}
        )
        
        background_tasks.add_task(send_otp_email, user["email"], otp)
        
        logger.info(f"[FORGOT_PASSWORD] OTP sent to: {user['email']}")
        return {"success": True, "message": "OTP sent to your email"}
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error in forgot password: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/reset-password")
async def reset_password(data: ResetPassword):
    try:
        user = await db.users.find_one({"email": data.email.lower()})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        if user.get("otp") != data.otp:
            raise HTTPException(status_code=400, detail="Invalid OTP")
            
        if user.get("otpExpires") < datetime.utcnow():
            raise HTTPException(status_code=400, detail="OTP expired")
            
        hashed_password = get_password_hash(data.new_password)
        
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"password": hashed_password}, "$unset": {"otp": "", "otpExpires": ""}}
        )
        
        logger.info(f"[RESET_PASSWORD] Password reset for: {user['username']}")
        return {"success": True, "message": "Password reset successfully. You can now login."}
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error resetting password: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# AI Routes

@app.post("/api/ai-query")
async def ai_query(query: AIQuery, request: Request):
    try:
        user_info = await get_current_user(request)
        username = query.username or (user_info["username"] if user_info else "anonymous")
        client_ip = get_client_ip(request)
        
        if not query.question:
            raise HTTPException(status_code=400, detail="Question is required")
            
        request_size = len(json.dumps(query.dict(), default=str))
        record_packet_size('request', username, request_size)
        CLIENT_QUERY_TRAFFIC.labels(user_name=username, client_ip=client_ip, query_type='AI_Query').inc()
        
        logger.info(f"[AI_QUERY] User: {username} | IP: {client_ip} | Question: {query.question}")
        
        # Malicious check
        malicious_reason = detect_malicious_query(query.question)
        if malicious_reason:
            logger.warning(f"[BLOCKED] User: {username} | Reason: {malicious_reason}")
            
            await db.query_history.insert_one({
                "username": username,
                "question": query.question,
                "blocked": True,
                "blockReason": malicious_reason,
                "timestamp": datetime.utcnow()
            })
            
            STREAMWATCH_AI_QUERY_LOG.labels(
                user_name=username, client_ip=client_ip, status='blocked',
                question=query.question[:500], mongo_query='BLOCKED', result=malicious_reason[:500]
            ).set(1)
            
            return JSONResponse(
                status_code=403,
                content={"error": "Query blocked for security reasons", "reason": malicious_reason, "blocked": True}
            )
            
        # Convert to Mongo Query
        mongo_query_obj = await convert_to_mongo_query(query.question)
        mongo_query_obj = convert_iso_dates(mongo_query_obj)
        
        # Validate Mongo Query
        validation = validate_mongo_query(mongo_query_obj)
        if not validation["valid"]:
            logger.warning(f"[BLOCKED] User: {username} | Reason: {validation['reason']}")
            
            await db.query_history.insert_one({
                "username": username,
                "question": query.question,
                "mongoQuery": mongo_query_obj,
                "blocked": True,
                "blockReason": validation['reason'],
                "timestamp": datetime.utcnow()
            })
            
            STREAMWATCH_AI_QUERY_LOG.labels(
                user_name=username, client_ip=client_ip, status='blocked',
                question=query.question[:500], mongo_query=json.dumps(mongo_query_obj)[:1000], result=validation['reason'][:500]
            ).set(1)
            
            return JSONResponse(
                status_code=403,
                content={"error": "Query blocked for security reasons", "reason": validation['reason'], "blocked": True}
            )
            
        # Execute Query
        result = None
        q_type = mongo_query_obj["type"]
        q_val = mongo_query_obj["query"]
        
        if q_type == "aggregate":
            cursor = db.sensor_data.aggregate(q_val)
            result = await cursor.to_list(length=None)
        else:
            filter_q = q_val.get("filter", {})
            proj_q = q_val.get("projection", {}) or None
            sort_q = list(q_val.get("sort", {}).items())
            raw_limit = q_val.get("limit")
            if raw_limit is None:
                limit_q = 100
            else:
                try:
                    limit_q = int(raw_limit)
                except (ValueError, TypeError):
                    limit_q = 100
            
            if limit_q <= 0:
                limit_q = 100
            if limit_q > MAX_QUERY_LIMIT:
                limit_q = MAX_QUERY_LIMIT
            
            logger.info(f"[EXECUTE] Filter: {filter_q} | Sort: {sort_q} | Limit: {limit_q}")
            
            cursor = db.sensor_data.find(filter_q, proj_q)
            if sort_q:
                cursor = cursor.sort(sort_q)
            cursor = cursor.limit(limit_q)
            result = await cursor.to_list(length=limit_q)
            
        # Convert ObjectId to str in result
        if isinstance(result, list):
            for item in result:
                if "_id" in item:
                    item["_id"] = str(item["_id"])
        elif isinstance(result, dict) and "_id" in result:
            result["_id"] = str(result["_id"])
            
        # Generate Natural Answer
        natural_answer = await generate_natural_language_answer(query.question, mongo_query_obj, result)
        
        response_data = {
            "question": query.question,
            "mongoQuery": mongo_query_obj,
            "result": result,
            "naturalAnswer": natural_answer
        }
        
        # Ensure response is JSON serializable (handle datetime, ObjectId, etc)
        final_response = json.loads(json.dumps(response_data, default=str))
        
        result_count = len(final_response.get("result", [])) if isinstance(final_response.get("result"), list) else 1
        logger.info(f"[AI_QUERY_RESPONSE] Returning {result_count} item(s) to client")
        
        return final_response
        
        # Save History
        await db.query_history.insert_one({
            "username": username,
            "question": query.question,
            "mongoQuery": mongo_query_obj,
            "result": result[:5] if isinstance(result, list) else result,
            "naturalAnswer": natural_answer,
            "blocked": False,
            "timestamp": datetime.utcnow()
        })
        
        response_size = len(json.dumps(response_data, default=str))
        record_packet_size('response', username, response_size)
        track_query_history(username, client_ip, query.question, mongo_query_obj, 'AI_Query')
        
        logger.info(f"[AI_QUERY_RESULT] User: {username} | Found {len(result) if isinstance(result, list) else 1} result(s)")
        
        STREAMWATCH_AI_QUERY_LOG.labels(
            user_name=username, client_ip=client_ip, status='success',
            question=query.question[:500], mongo_query=json.dumps(mongo_query_obj)[:1000],
            result=json.dumps(result[:5] if isinstance(result, list) else result, default=str)[:2000]
        ).set(1)
        
        return response_data

    except Exception as e:
        logger.error(f"Error processing AI query: {e}")
        user_info = await get_current_user(request)
        username = query.username or (user_info["username"] if user_info else "anonymous")
        client_ip = get_client_ip(request)
        
        STREAMWATCH_AI_QUERY_LOG.labels(
            user_name=username, client_ip=client_ip, status='error',
            question=query.question[:500], mongo_query='N/A', result=str(e)[:500]
        ).set(1)
        
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ai-query-history/{username}")
async def get_ai_query_history(username: str, limit: int = 10):
    try:
        cursor = db.query_history.find({"username": username}).sort("timestamp", -1).limit(limit)
        history = await cursor.to_list(length=limit)
        
        # Convert ObjectId and remove result to save bandwidth
        for item in history:
            item["_id"] = str(item["_id"])
            if "result" in item:
                del item["result"]
                
        return {"history": history}
    except Exception as e:
        logger.error(f"Error fetching query history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/query-history")
async def get_query_history(limit: int = 50):
    try:
        recent_queries = list(reversed(query_history[-limit:]))
        return {
            "queries": recent_queries,
            "total": len(query_history)
        }
    except Exception as e:
        logger.error(f"Error fetching query history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Admin Stats Routes

@app.get("/api/admin-stats")
async def get_admin_stats():
    try:
        users = []
        for username, stats in user_stats.items():
            users.append({
                "username": username,
                "ip": stats["ip"],
                "queriesCount": len(stats["queries"]),
                "packetsSent": stats["packets"]["sent"],
                "packetsReceived": stats["packets"]["received"],
                "lastSeen": stats["lastSeen"]
            })
            
        total_packets_sent = sum(u["packetsSent"] for u in users)
        total_packets_received = sum(u["packetsReceived"] for u in users)
        
        return {
            "users": users,
            "totalQueries": len(query_history),
            "totalPacketsSent": total_packets_sent,
            "totalPacketsReceived": total_packets_received,
            "queries": query_history
        }
    except Exception as e:
        logger.error(f"Error fetching admin stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/admin/stats", response_class=HTMLResponse)
async def admin_stats_page():
    try:
        users = []
        for username, stats in user_stats.items():
            users.append({
                "username": username,
                "ip": stats["ip"],
                "queriesCount": len(stats["queries"]),
                "packetsSent": stats["packets"]["sent"],
                "packetsReceived": stats["packets"]["received"],
                "lastSeen": stats["lastSeen"]
            })
            
        total_packets_sent = sum(u["packetsSent"] for u in users)
        total_packets_received = sum(u["packetsReceived"] for u in users)
        
        # Generate HTML
        
        # Query History Rows
        query_rows = ""
        recent_queries = list(reversed(query_history[-50:]))
        for q in recent_queries:
            q_type = q.get("queryType", "UNKNOWN")
            bg_class = "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"
            if q_type == 'AI_Query': bg_class = "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
            elif q_type == 'CREATE': bg_class = "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
            elif q_type == 'UPDATE': bg_class = "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400"
            elif q_type == 'DELETE': bg_class = "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
            
            mongo_query_html = ""
            if q.get("mongoQuery"):
                mongo_query_html = f"""
                                <div class="mt-3">
                                    <div class="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">MongoDB Query:</div>
                                    <pre class="bg-gray-900 dark:bg-gray-950 text-green-400 p-3 rounded-lg text-xs overflow-x-auto font-mono">{q.get("mongoQuery")}</pre>
                                </div>
                """
            
            # Format timestamp safely
            ts = q.get("timestamp", "")
            try:
                # Simple string formatting if it's already ISO string, or parse if needed. 
                # For simplicity, just using the string as is or a simple replace 'T' -> ' '
                ts = ts.replace("T", " ").split(".")[0]
            except: pass

            query_rows += f"""
                        <div class="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl p-4">
                            <div class="flex items-center justify-between mb-3">
                                <div class="flex items-center gap-3">
                                    <span class="px-3 py-1 rounded-lg text-xs font-semibold {bg_class}">{q_type}</span>
                                    <span class="font-semibold text-gray-900 dark:text-white">{q.get("username")}</span>
                                    <span class="text-sm text-gray-500 dark:text-gray-400">({q.get("clientIP")})</span>
                                </div>
                                <span class="text-xs text-gray-500 dark:text-gray-400">{ts}</span>
                            </div>
                            <div class="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                <strong>Query:</strong> {q.get("question") or 'N/A'}
                            </div>
                            {mongo_query_html}
                        </div>
            """

        # User Rows
        user_rows = ""
        sorted_users = sorted(users, key=lambda x: x["lastSeen"], reverse=True)
        for u in sorted_users:
            ts = u["lastSeen"].replace("T", " ").split(".")[0]
            user_rows += f"""
                                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td class="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700">{u["username"]}</td>
                                    <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">{u["ip"]}</td>
                                    <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">{u["queriesCount"]}</td>
                                    <td class="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">{ts}</td>
                                </tr>
            """

        # Packet Rows
        packet_rows = ""
        sorted_packets = sorted(users, key=lambda x: x["packetsSent"] + x["packetsReceived"], reverse=True)
        for u in sorted_packets:
            total = u["packetsSent"] + u["packetsReceived"]
            packet_rows += f"""
                                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td class="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700">{u["username"]}</td>
                                    <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">{u["packetsSent"]:,}</td>
                                    <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">{u["packetsReceived"]:,}</td>
                                    <td class="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700">{total:,}</td>
                                </tr>
            """

        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Stream Watch - Admin Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {{
            darkMode: 'class',
            theme: {{
                extend: {{
                    colors: {{
                        primary: {{
                            50: '#eff6ff',
                            500: '#3b82f6',
                            600: '#2563eb',
                            700: '#1d4ed8',
                        }}
                    }}
                }}
            }}
        }}
    </script>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; }}
    </style>
</head>
<body class="bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-lg sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-6 py-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
                        <p class="text-sm text-gray-600 dark:text-gray-400">Real-time monitoring and statistics</p>
                    </div>
                </div>
                <div class="flex gap-3">
                    <button onclick="toggleTheme()" class="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <svg id="theme-icon-light" class="w-5 h-5 hidden dark:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <svg id="theme-icon-dark" class="w-5 h-5 block dark:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                        <span id="theme-text" class="text-sm font-medium">Theme</span>
                    </button>
                    <button onclick="location.reload()" class="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center gap-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span class="text-sm font-medium">Refresh</span>
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Content -->
    <div class="max-w-7xl mx-auto px-6 py-8">
        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <!-- Active Users -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all">
                <div class="flex items-center gap-3 mb-4">
                    <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                        <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    </div>
                    <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</span>
                </div>
                <div class="text-3xl font-bold text-gray-900 dark:text-white">{len(users)}</div>
            </div>

            <!-- Total Queries -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all">
                <div class="flex items-center gap-3 mb-4">
                    <div class="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                        <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                    <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Queries</span>
                </div>
                <div class="text-3xl font-bold text-gray-900 dark:text-white">{len(query_history)}</div>
            </div>

            <!-- Packets Sent -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all">
                <div class="flex items-center gap-3 mb-4">
                    <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                        <svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                    </div>
                    <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Packets Sent</span>
                </div>
                <div class="text-3xl font-bold text-gray-900 dark:text-white">{total_packets_sent:,}</div>
            </div>

            <!-- Packets Received -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all">
                <div class="flex items-center gap-3 mb-4">
                    <div class="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                        <svg class="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                        </svg>
                    </div>
                    <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Packets Received</span>
                </div>
                <div class="text-3xl font-bold text-gray-900 dark:text-white">{total_packets_received:,}</div>
            </div>
        </div>

        <!-- Content Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Query History -->
            <div class="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div class="flex items-center gap-3 mb-6 pb-4 border-b-2 border-gray-200 dark:border-gray-700">
                    <svg class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Query History (Latest {min(50, len(query_history))})</h2>
                </div>
                <div class="space-y-3 max-h-[600px] overflow-y-auto">
                    {query_rows}
                </div>
            </div>

            <!-- Active Users Table -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div class="flex items-center gap-3 mb-6 pb-4 border-b-2 border-gray-200 dark:border-gray-700">
                    <svg class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Active Users</h2>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 border-b-2 border-gray-200 dark:border-gray-600">Username</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 border-b-2 border-gray-200 dark:border-gray-600">IP</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 border-b-2 border-gray-200 dark:border-gray-600">Queries</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 border-b-2 border-gray-200 dark:border-gray-600">Last Seen</th>
                            </tr>
                        </thead>
                        <tbody>
                            {user_rows}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Packet Statistics Table -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div class="flex items-center gap-3 mb-6 pb-4 border-b-2 border-gray-200 dark:border-gray-700">
                    <svg class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Packet Statistics</h2>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 border-b-2 border-gray-200 dark:border-gray-600">Username</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 border-b-2 border-gray-200 dark:border-gray-600">Sent</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 border-b-2 border-gray-200 dark:border-gray-600">Received</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 border-b-2 border-gray-200 dark:border-gray-600">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {packet_rows}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Theme management
        function toggleTheme() {{
            const html = document.documentElement;
            const isDark = html.classList.toggle('dark');
            localStorage.setItem('admin-theme', isDark ? 'dark' : 'light');
            updateThemeText(isDark);
        }}

        function updateThemeText(isDark) {{
            document.getElementById('theme-text').textContent = isDark ? 'Light' : 'Dark';
        }}

        // Load saved theme
        const savedTheme = localStorage.getItem('admin-theme');
        if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {{
            document.documentElement.classList.add('dark');
            updateThemeText(true);
        }}

        // Auto-refresh every 10 seconds
        setTimeout(() => location.reload(), 10000);
    </script>
</body>
</html>"""
        return html
    except Exception as e:
        logger.error(f"Error serving admin stats page: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)
