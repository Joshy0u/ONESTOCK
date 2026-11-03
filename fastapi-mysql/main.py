# API ENDPOINTS TIME!!!

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import SessionLocal
from routes import products
from routes import carriers


app = FastAPI(title="OneStock API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the modular routers
app.include_router(products.router)
app.include_router(carriers.router)

# Create tables? (i can skip this step, tables already exist)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
async def root():
    return {"message": "OneStock API is live!"}
