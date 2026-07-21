import logging
import os
from datetime import datetime
from getpass import getpass
from typing import Generator
from urllib.parse import urlparse, urlunparse

import psycopg2
from dotenv import load_dotenv
from sqlalchemy import Column, DateTime, Float, Integer, String, create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

load_dotenv()

logger = logging.getLogger("cropcare")


def _resolve_database_url() -> str:
    database_url = os.getenv("DATABASE_URL", "").strip()
    if not database_url:
        raise RuntimeError("DATABASE_URL must be set to a PostgreSQL connection string")

    parsed = urlparse(database_url)
    if parsed.scheme not in {"postgresql", "postgres"}:
        raise RuntimeError("DATABASE_URL must point to a PostgreSQL server")

    if parsed.password in {None, "", "YOUR_PASSWORD", "your_password"} and not os.getenv("PYTEST_CURRENT_TEST"):
        password = getpass("Enter your PostgreSQL password: ")
        if not password:
            raise RuntimeError("A PostgreSQL password is required")

        netloc = parsed.hostname or "localhost"
        if parsed.username:
            netloc = f"{parsed.username}:{password}@{netloc}"
        else:
            netloc = f"postgres:{password}@{netloc}"
        if parsed.port:
            netloc = f"{netloc}:{parsed.port}"
        return urlunparse(parsed._replace(netloc=netloc))

    return database_url


DATABASE_URL = _resolve_database_url()
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def _rebuild_engine() -> None:
    global engine, SessionLocal
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def _ensure_database_exists(database_url: str) -> None:
    parsed = urlparse(database_url)
    if parsed.scheme not in {"postgresql", "postgres"}:
        return

    target_db = parsed.path.lstrip("/") or "postgres"

    try:
        connection_kwargs = {
            "dbname": "postgres",
            "user": parsed.username or "postgres",
            "password": parsed.password,
            "host": parsed.hostname or "localhost",
            "port": parsed.port or 5432,
        }
        conn = psycopg2.connect(**connection_kwargs)
        conn.autocommit = True
        with conn.cursor() as cursor:
            cursor.execute("SELECT 1 FROM pg_database WHERE datname = %s", (target_db,))
            exists = cursor.fetchone()
            if not exists:
                cursor.execute(f'CREATE DATABASE "{target_db}"')
                logger.info("Created PostgreSQL database %s", target_db)
        conn.close()
    except Exception as exc:
        logger.warning("Could not ensure PostgreSQL database exists: %s", exc)


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
    otp_code = Column(String(16), nullable=True)
    otp_expires_at = Column(DateTime, nullable=True)
    last_login_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class AgricultureExpert(Base):
    __tablename__ = "agriculture_experts"

    id = Column(Integer, primary_key=True, index=True)
    mobile_number = Column(String(20), unique=True, index=True, nullable=False)
    otp_code = Column(String(16), nullable=True)
    otp_expires_at = Column(DateTime, nullable=True)
    last_login_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


def init_db() -> None:
    try:
        _ensure_database_exists(DATABASE_URL)
        _rebuild_engine()
        Base.metadata.create_all(bind=engine)
        logger.info("Database initialized successfully")
    except Exception as exc:
        logger.exception("Database initialization failed: %s", exc)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
