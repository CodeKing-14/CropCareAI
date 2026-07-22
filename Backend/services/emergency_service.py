"""
services/emergency_service.py — Emergency Crop Alert logic (Feature 3).

Reads the configurable disease list from config/emergency_diseases.json
and creates EmergencyAlert rows in the database when dangerous diseases
are detected. No existing code is imported or modified.
"""

import json
import logging
from pathlib import Path
from typing import Optional

from sqlalchemy.orm import Session

from features.models import EmergencyAlert

logger = logging.getLogger("cropcare")

# Path to the configurable disease list — relative to this file's package root.
_CONFIG_PATH = Path(__file__).resolve().parent.parent / "config" / "emergency_diseases.json"


def _load_emergency_diseases() -> list[str]:
    """
    Load the emergency disease list from the JSON config file.
    Returns lower-cased names for case-insensitive comparison.
    Falls back to an empty list if the file is missing or malformed.
    """
    try:
        with _CONFIG_PATH.open("r", encoding="utf-8") as f:
            data = json.load(f)
        return [d.lower() for d in data.get("emergency_diseases", [])]
    except Exception as exc:
        logger.warning("Could not load emergency diseases config: %s", exc)
        return []


def is_emergency_disease(disease_name: str) -> bool:
    """Return True if the predicted disease is in the emergency list."""
    diseases = _load_emergency_diseases()
    return disease_name.lower() in diseases


def create_emergency_alert(
    db: Session,
    farmer_mobile: str,
    disease: str,
    confidence: float,
    expert_mobile: Optional[str] = None,
    prediction_id: Optional[int] = None,
) -> EmergencyAlert:
    """
    Persist an EmergencyAlert record for the given prediction.

    Called by the emergency_router after the CNN prediction if the
    detected disease is in the emergency list.
    """
    alert = EmergencyAlert(
        farmer_mobile=farmer_mobile,
        disease=disease,
        confidence=confidence,
        priority="HIGH",
        expert_mobile=expert_mobile,
        prediction_id=prediction_id,
        acknowledged=False,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    logger.warning(
        "EMERGENCY ALERT created: disease=%s, farmer=%s, alert_id=%d",
        disease,
        farmer_mobile,
        alert.id,
    )
    return alert


def get_unacknowledged_alerts(db: Session, expert_mobile: Optional[str] = None):
    """
    Return all unacknowledged emergency alerts.
    If expert_mobile is provided, filter to that expert's alerts.
    Results are ordered newest first so they appear at the top of the dashboard.
    """
    query = db.query(EmergencyAlert).filter(EmergencyAlert.acknowledged == False)
    if expert_mobile:
        query = query.filter(EmergencyAlert.expert_mobile == expert_mobile)
    return query.order_by(EmergencyAlert.alert_at.desc()).all()
