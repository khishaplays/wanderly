
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.destinations import router as destinations_router


app = FastAPI(
    title="Wanderly API",
    description=(
        "Backend API for discovering and planning "
        "travel experiences across Kenya."
    ),
    version="1.0.0",
)


# Allow the local frontend and our future deployed frontend.
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

production_frontend = os.getenv("FRONTEND_URL")

if production_frontend:
    allowed_origins.append(production_frontend.rstrip("/"))


app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)


app.include_router(destinations_router)


@app.get("/")
def root():
    return {
        "name": "Wanderly API",
        "message": "Karibu Kenya 🇰🇪",
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "message": "Wanderly API is running",
    }
