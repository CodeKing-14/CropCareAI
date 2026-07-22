"""
routers/emergency_router.py — Emergency Crop Alert API (Feature 3).

All endpoints are new. No existing code is modified.
"""

import logging
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import get_db
from features.models import EmergencyAlert
from services.emergency_service import (
    create_emergency_alert,
    get_unacknowledged_alerts,
    is_emergency_disease,
)

logger = logging.getLogger("cropcare")
router = APIRouter(prefix="/emergency", tags=["Emergency Alerts"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class EmergencyCheckIn(BaseModel):
    farmer_mobile: str = Field(..., description="Farmer mobile number")
    disease: str = Field(..., description="Predicted disease name from CNN model")
    confidence: float = Field(..., ge=0, le=100)
    expert_mobile: Optional[str] = Field(None, description="Expert assigned to this farmer")
    prediction_id: Optional[int] = Field(None, description="ID from prediction_history table")


class EmergencyCheckOut(BaseModel):
    is_emergency: bool
    alert_id: Optional[int] = None
    priority: Optional[str] = None
    message: str


class EmergencyAlertOut(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    farmer_mobile: str
    disease: str
    confidence: float
    priority: str
    expert_mobile: Optional[str]
    alert_at: datetime
    prediction_id: Optional[int]
    acknowledged: bool


class AcknowledgeIn(BaseModel):
    alert_id: int


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post(
    "/check",
    response_model=EmergencyCheckOut,
    summary="Check if a predicted disease is an emergency and create an alert if so",
)
def check_disease(
    data: EmergencyCheckIn,
    db: Session = Depends(get_db),
) -> EmergencyCheckOut:
    """
    Call this immediately after a CNN prediction.
    If the disease is in the emergency config, an EmergencyAlert is created
    with priority=HIGH and the response includes is_emergency=True.
    """
    if not is_emergency_disease(data.disease):
        return EmergencyCheckOut(
            is_emergency=False,
            message="Disease is not in the emergency list. No alert created.",
        )

    alert = create_emergency_alert(
        db=db,
        farmer_mobile=data.farmer_mobile,
        disease=data.disease,
        confidence=data.confidence,
        expert_mobile=data.expert_mobile,
        prediction_id=data.prediction_id,
    )
    return EmergencyCheckOut(
        is_emergency=True,
        alert_id=alert.id,
        priority=alert.priority,
        message=f"EMERGENCY: {data.disease} is a high-priority disease. Expert notified.",
    )


@router.get(
    "/alerts",
    response_model=List[EmergencyAlertOut],
    summary="List all unacknowledged emergency alerts (for the expert dashboard)",
)
def list_alerts(
    expert_mobile: Optional[str] = None,
    db: Session = Depends(get_db),
) -> List[EmergencyAlertOut]:
    """
    Returns unacknowledged alerts, newest first.
    Optionally filter by expert_mobile so each expert only sees their own alerts.
    """
    alerts = get_unacknowledged_alerts(db, expert_mobile=expert_mobile)
    return [EmergencyAlertOut.model_validate(a) for a in alerts]


@router.post(
    "/alerts/acknowledge",
    summary="Mark an emergency alert as acknowledged by the expert",
)
def acknowledge_alert(
    data: AcknowledgeIn,
    db: Session = Depends(get_db),
) -> dict:
    alert = db.query(EmergencyAlert).filter(EmergencyAlert.id == data.alert_id).first()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert {data.alert_id} not found.",
        )
    alert.acknowledged = True
    db.commit()
    return {"success": True, "alert_id": data.alert_id, "message": "Alert acknowledged."}


@router.get(
    "/diseases",
    summary="Return the current list of emergency diseases from config",
)
def list_emergency_diseases() -> dict:
    """
    Returns the live emergency disease list straight from
    config/emergency_diseases.json — no server restart required after editing.
    """
    from services.emergency_service import _load_emergency_diseases
    diseases = _load_emergency_diseases()
    return {"emergency_diseases": [d.title() for d in diseases], "count": len(diseases)}
