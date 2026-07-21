import logging
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from routers.prediction import router as prediction_router
from routers.speech import router as speech_router
from routers.auth import router as auth_router
from routers.chat import router as chat_router

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("cropcare")


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    logger.info("Database initialized")
    yield


app = FastAPI(
    title="CropCare AI Backend",
    version="1.0.0",
    description="Crop disease prediction backend with prediction history storage",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(prediction_router)
app.include_router(speech_router)
app.include_router(auth_router)
app.include_router(chat_router)


@app.get("/", tags=["health"])
def health_check() -> str:
    return "CropCare AI Backend Running"
