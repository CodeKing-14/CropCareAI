"""
features/models.py — New ORM models for the three new CropCare AI features.

All models use the shared Base from database.py.
None of the existing tables (farmers, agriculture_experts,
prediction_history, expert_messages) are touched here.
"""

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String

from database import Base


# ---------------------------------------------------------------------------
# FEATURE 1 — Nearby Expert Assignment
# ---------------------------------------------------------------------------

class ExpertLocation(Base):
    """Stores the GPS location and availability status of each expert."""
    __tablename__ = "expert_locations"

    id = Column(Integer, primary_key=True, index=True)
    mobile_number = Column(String(20), unique=True, index=True, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    is_available = Column(Boolean, default=True, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class AssignmentHistory(Base):
    """Records every expert assignment made to a farmer request."""
    __tablename__ = "assignment_history"

    id = Column(Integer, primary_key=True, index=True)
    farmer_mobile = Column(String(20), nullable=False, index=True)
    expert_mobile = Column(String(20), nullable=False)
    distance_km = Column(Float, nullable=False)
    # status: assigned | pending | completed
    status = Column(String(20), default="assigned", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class PendingQueue(Base):
    """Holds farmer requests when no expert is currently available."""
    __tablename__ = "pending_queue"

    id = Column(Integer, primary_key=True, index=True)
    farmer_mobile = Column(String(20), nullable=False, index=True)
    farmer_latitude = Column(Float, nullable=False)
    farmer_longitude = Column(Float, nullable=False)
    disease = Column(String(120), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    # resolved: True once an expert is eventually assigned
    resolved = Column(Boolean, default=False, nullable=False)


# ---------------------------------------------------------------------------
# FEATURE 2 — Offline AI Prediction
# ---------------------------------------------------------------------------

class OfflineQueue(Base):
    """
    Stores predictions that were taken while the farmer was offline.
    The frontend replays these to the backend when connectivity is restored.
    """
    __tablename__ = "offline_queue"

    id = Column(Integer, primary_key=True, index=True)
    farmer_mobile = Column(String(20), nullable=False, index=True)
    # Base-64 encoded image stored so we can run server-side prediction on sync
    image_filename = Column(String(260), nullable=False)
    image_b64 = Column(String, nullable=False)   # TEXT column — large but necessary
    # status: pending | synced | failed
    status = Column(String(20), default="pending", nullable=False)
    disease = Column(String(120), nullable=True)          # filled after server predicts
    confidence = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    synced_at = Column(DateTime, nullable=True)


# ---------------------------------------------------------------------------
# FEATURE 3 — Emergency Crop Alert
# ---------------------------------------------------------------------------

class EmergencyAlert(Base):
    """
    Created whenever the CNN model predicts a disease that appears in
    config/emergency_diseases.json.
    """
    __tablename__ = "emergency_alerts"

    id = Column(Integer, primary_key=True, index=True)
    farmer_mobile = Column(String(20), nullable=False, index=True)
    disease = Column(String(120), nullable=False)
    confidence = Column(Float, nullable=False)
    # priority is always HIGH for emergency alerts
    priority = Column(String(10), default="HIGH", nullable=False)
    # mobile of the expert who was notified (nullable until assigned)
    expert_mobile = Column(String(20), nullable=True)
    alert_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    # optional link back to prediction_history.id
    prediction_id = Column(Integer, nullable=True)
    # acknowledged: True once the expert has seen the alert
    acknowledged = Column(Boolean, default=False, nullable=False)
