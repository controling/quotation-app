import os
import sys

# Ensure the backend directory is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base

# Import all models so Base knows about them
import models

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Quotation App API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
from routers.auth import router as auth_router
from routers.users import router as users_router
from routers.drug_items import router as drug_items_router
from routers.packaging_items import router as packaging_items_router
from routers.quotations import router as quotations_router
from routers.stats import router as stats_router

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(drug_items_router)
app.include_router(packaging_items_router)
app.include_router(quotations_router)
app.include_router(stats_router)


@app.get("/api/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
