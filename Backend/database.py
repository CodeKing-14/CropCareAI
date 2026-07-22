"""
database.py — Database engine, models, and session management.

The engine is created lazily inside init_db() so the module can be imported
safely without touching the database at import time.
"""

import logging
import os
from datetime import datetime
from typing import Generator

import psycopg2
from dotenv import load_dotenv
from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String, create_engine, text
from sqlalchemy.orm import Session, declarative_base, sessionmaker

load_dotenv()

logger = logging.getLogger("cropcare")

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

Base = declarative_base()

# These are set once during init_db() — never at import time.
engine = None
SessionLocal = None


def _get_database_url() -> str:
    """Read and validate DATABASE_URL from the environment."""
    url = os.getenv("DATABASE_URL", "").strip()
    if not url:
        raise RuntimeError(
            "DATABASE_URL is not set. "
            "Add it to your .env file: DATABASE_URL=postgresql://user:password@host:5432/dbname"
        )
    if not (url.startswith("postgresql://") or url.startswith("postgres://")):
        raise RuntimeError(
            "DATABASE_URL must be a PostgreSQL connection string "
            "(e.g. postgresql://user:password@localhost:5432/cropcare)"
        )
    return url


# ---------------------------------------------------------------------------
# ORM Models
# ---------------------------------------------------------------------------

class PredictionHistory(Base):
    __tablename__ = "prediction_history"

    id = Column(Integer, primary_key=True, index=True)
    image_name = Column(String, nullable=False)
    predicted_disease = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    prediction_time = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Farmer(Base):
    __tablename__ = "farmers"

    id = Column(Integer, primary_key=True, index=True)
    mobile_number = Column(String(20), unique=True, index=True, nullable=False)
    role = Column(String(20), default="farmer", nullable=False)
    preferred_language = Column(String(40), default="English", nullable=False)
    otp_verified = Column(Boolean, default=False, nullable=False)
    otp_code = Column(String(16), nullable=True)
    otp_expires_at = Column(DateTime, nullable=True)
    last_login_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class AgricultureExpert(Base):
    __tablename__ = "agriculture_experts"

    id = Column(Integer, primary_key=True, index=True)
    mobile_number = Column(String(20), unique=True, index=True, nullable=False)
    role = Column(String(20), default="expert", nullable=False)
    preferred_language = Column(String(40), default="English", nullable=False)
    otp_verified = Column(Boolean, default=False, nullable=False)
    otp_code = Column(String(16), nullable=True)
    otp_expires_at = Column(DateTime, nullable=True)
    specialty = Column(String(50), nullable=True)
    last_login_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class ExpertMessage(Base):
    __tablename__ = "expert_messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_role = Column(String(20), nullable=False)
    sender_mobile = Column(String(20), nullable=False)
    recipient_mobile = Column(String(20), nullable=True)
    message_type = Column(String(20), default="text", nullable=False)
    content = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


# ---------------------------------------------------------------------------
# Initialisation helpers
# ---------------------------------------------------------------------------

def _ensure_database_exists(database_url: str) -> None:
    """
    Connect to the 'postgres' maintenance database and create the target
    database if it does not already exist.
    """
    from urllib.parse import urlparse

    parsed = urlparse(database_url)
    target_db = parsed.path.lstrip("/") or "postgres"

    try:
        conn = psycopg2.connect(
            dbname="postgres",
            user=parsed.username or "postgres",
            password=parsed.password,
            host=parsed.hostname or "localhost",
            port=parsed.port or 5432,
        )
        conn.autocommit = True
        with conn.cursor() as cursor:
            cursor.execute("SELECT 1 FROM pg_database WHERE datname = %s", (target_db,))
            if not cursor.fetchone():
                cursor.execute(f'CREATE DATABASE "{target_db}"')
                logger.info("Created PostgreSQL database: %s", target_db)
        conn.close()
    except Exception as exc:
        logger.warning("Could not verify/create database '%s': %s", target_db, exc)


def _ensure_auth_columns() -> None:
    """Add any missing columns that were introduced after the initial migration."""
    statements = [
        "ALTER TABLE farmers ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'farmer'",
        "ALTER TABLE farmers ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(40) NOT NULL DEFAULT 'English'",
        "ALTER TABLE farmers ADD COLUMN IF NOT EXISTS otp_verified BOOLEAN NOT NULL DEFAULT FALSE",
        "ALTER TABLE agriculture_experts ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'expert'",
        "ALTER TABLE agriculture_experts ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(40) NOT NULL DEFAULT 'English'",
        "ALTER TABLE agriculture_experts ADD COLUMN IF NOT EXISTS otp_verified BOOLEAN NOT NULL DEFAULT FALSE",
        "ALTER TABLE agriculture_experts ADD COLUMN IF NOT EXISTS specialty VARCHAR(50)",
        "ALTER TABLE expert_messages ADD COLUMN IF NOT EXISTS recipient_mobile VARCHAR(20)",
    ]
    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))


def init_db() -> None:
    """
    Initialise the database:
      1. Validate DATABASE_URL.
      2. Create the database if it does not exist.
      3. Build the SQLAlchemy engine and session factory.
      4. Create all ORM tables.
      5. Apply any missing column migrations.
    """
    global engine, SessionLocal

    database_url = _get_database_url()

    _ensure_database_exists(database_url)

    engine = create_engine(database_url, pool_pre_ping=True)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    # Import new feature models so Base.metadata includes their tables.
    import features.models  # noqa: F401 — registers ExpertLocation, AssignmentHistory, etc.
    Base.metadata.create_all(bind=engine)
    _ensure_auth_columns()

    # Seed dummy experts
    _seed_dummy_experts()

    logger.info("Database initialised successfully")


def _seed_dummy_experts() -> None:
    from features.models import ExpertLocation
    dummy_experts = [
        {"mobile": "9999999901", "specialty": "Tomato", "lat": 12.9716, "lon": 77.5946},
        {"mobile": "9999999902", "specialty": "Potato", "lat": 12.9816, "lon": 77.6046},
        {"mobile": "9999999903", "specialty": "Apple", "lat": 12.9616, "lon": 77.5846},
    ]
    with SessionLocal() as db:
        for ex in dummy_experts:
            expert = db.query(AgricultureExpert).filter_by(mobile_number=ex["mobile"]).first()
            if not expert:
                expert = AgricultureExpert(
                    mobile_number=ex["mobile"],
                    role="expert",
                    specialty=ex["specialty"],
                    otp_verified=True
                )
                db.add(expert)
            
            loc = db.query(ExpertLocation).filter_by(mobile_number=ex["mobile"]).first()
            if not loc:
                loc = ExpertLocation(
                    mobile_number=ex["mobile"],
                    latitude=ex["lat"],
                    longitude=ex["lon"],
                    is_available=True
                )
                db.add(loc)
        
        db.commit()


# ---------------------------------------------------------------------------
# Dependency
# ---------------------------------------------------------------------------

def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that provides a database session per request."""
    if SessionLocal is None:
        raise RuntimeError("Database has not been initialised. Call init_db() first.")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
