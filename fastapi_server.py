import uvicorn
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import Optional, Literal
import time

app = FastAPI(
    title="Bhoo Drishti - Geospatial Intelligence & Land Governance API",
    description="FastAPI Backend for User Authentication, Citizen Portals, and Government Official Command Portal.",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- PYDANTIC SCHEMAS ---

class UserRegisterSchema(BaseModel):
    name: str
    email: EmailStr
    phone: str
    gender: Literal["Male", "Female", "Other"]
    password: str
    confirmPassword: str
    role: Literal["official", "citizen"]
    domain: Optional[str] = None
    customDomain: Optional[str] = None
    state: str
    address: Optional[str] = None

class OfficialLoginSchema(BaseModel):
    email: EmailStr
    password: str

class CitizenLoginSchema(BaseModel):
    email: EmailStr
    password: str
    address: str
    state: str

# --- MOCK DATA / IN-MEMORY STORAGE ---
# Simulate standard backend user store
MOCK_USERS = {}

# --- API ENDPOINTS ---

@app.post("/api/auth/register", status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserRegisterSchema):
    """
    Registers a new user (either Government Official or Citizen Resident).
    """
    if user_data.password != user_data.confirmPassword:
        raise HTTPException(
            status_code=400,
            detail="Passwords do not match. Please verify both passwords match exactly."
        )
    
    email_lower = user_data.email.lower()
    if email_lower in MOCK_USERS:
        raise HTTPException(
            status_code=400,
            detail="An account is already registered with this email address."
        )

    # Resolve portfolio domain for government officials
    resolved_domain = None
    if user_data.role == "official":
        resolved_domain = user_data.customDomain if user_data.domain == "Other" else user_data.domain
        if not resolved_domain:
            raise HTTPException(
                status_code=400,
                detail="Government officials must specify their administrative domain."
            )

    new_user = {
        "id": f"usr-{int(time.time() * 1000)}",
        "name": user_data.name,
        "email": email_lower,
        "phone": user_data.phone,
        "gender": user_data.gender,
        "role": user_data.role,
        "domain": resolved_domain,
        "designation": resolved_domain if user_data.role == "official" else None,
        "department": f"{resolved_domain} Division" if user_data.role == "official" else None,
        "state": user_data.state,
        "address": user_data.address or "",
        "district": "Ahmedabad", # Mocked regional sector
        "created_at": time.time()
    }
    
    MOCK_USERS[email_lower] = new_user
    return {
        "success": True,
        "message": "User account created successfully.",
        "user": new_user
    }

@app.post("/api/auth/official/login")
async def login_official(credentials: OfficialLoginSchema):
    """
    Authenticates a Government Official and returns their command profile.
    """
    email_lower = credentials.email.lower()
    
    # Allow local demo credentials
    if email_lower == "sharma.ias@gujarat.gov.in" and credentials.password == "Official@2024":
        return {
            "success": True,
            "user": {
                "id": "usr-off-1",
                "name": "Dr. Rajeshwar Sharma, IAS",
                "email": email_lower,
                "role": "official",
                "gender": "Male",
                "phone": "+91 98765 43210",
                "domain": "District Administration / Collectorate",
                "department": "District Administration & Urban Infrastructure",
                "designation": "District Development Officer (DDO)",
                "jurisdiction": "Ahmedabad & Suburban Industrial Belt",
                "district": "Ahmedabad",
                "state": "Gujarat"
            }
        }
        
    # Check regular user db
    if email_lower in MOCK_USERS:
        user = MOCK_USERS[email_lower]
        if user["role"] == "official":
            return {
                "success": True,
                "user": user
            }
            
    raise HTTPException(
        status_code=401,
        detail="Invalid official email or password credentials. Authentication failed."
    )

@app.post("/api/auth/citizen/login")
async def login_citizen(credentials: CitizenLoginSchema):
    """
    Authenticates a Citizen resident with spatial district validation.
    """
    email_lower = credentials.email.lower()

    # Allow local demo credentials
    if email_lower == "pooja.patel@citizen.in" and credentials.password == "Citizen@2024":
        return {
            "success": True,
            "user": {
                "id": "usr-cit-1",
                "name": "Pooja Patel",
                "email": email_lower,
                "role": "citizen",
                "gender": "Female",
                "phone": "+91 98250 11223",
                "address": credentials.address,
                "state": credentials.state,
                "district": "Ahmedabad"
            }
        }

    # Check regular user db
    if email_lower in MOCK_USERS:
        user = MOCK_USERS[email_lower]
        if user["role"] == "citizen":
            user["address"] = credentials.address
            user["state"] = credentials.state
            return {
                "success": True,
                "user": user
            }

    raise HTTPException(
        status_code=401,
        detail="Invalid citizen credentials or unverified address alignment."
    )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
