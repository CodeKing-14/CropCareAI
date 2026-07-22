"""
routers/assignment_router.py — Nearby Expert Assignment API (Feature 1).

All endpoints are new. No existing routers were modified.
"""

import logging
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import get_db
from features.models import AssignmentHistory, ExpertLocation, PendingQueue
from services.assignment_service import assign_nearest_expert, get_latest_assignment

logger = logging.getLogger("cropcare")
router = APIRouter(prefix="/assignment", tags=["Expert Assignment"])


# ---------------------------------------------------------------------------
# Request / Response schemas (local to this router — keeps things self-contained)
# ---------------------------------------------------------------------------

class ExpertLocationIn(BaseModel):
    mobile_number: str = Field(..., description="Expert mobile number")
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    is_available: bool = Field(True)


class ExpertLocationOut(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    mobile_number: str
    latitude: float
    longitude: float
    is_available: bool


class AssignRequest(BaseModel):
    farmer_mobile: str = Field(..., description="Farmer mobile number")
    farmer_latitude: float = Field(..., ge=-90, le=90)
    farmer_longitude: float = Field(..., ge=-180, le=180)
    disease: Optional[str] = Field(None, description="Detected disease (optional)")


class AssignmentOut(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    farmer_mobile: str
    expert_mobile: str
    distance_km: float
    status: str


class AssignmentStatusOut(BaseModel):
    has_assignment: bool
    status: Optional[str] = None
    expert_mobile: Optional[str] = None
    distance_km: Optional[float] = None
    assignment_id: Optional[int] = None
    message: str


class PendingQueueOut(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    farmer_mobile: str
    farmer_latitude: float
    farmer_longitude: float
    disease: Optional[str]
    resolved: bool


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post(
    "/expert-location",
    response_model=ExpertLocationOut,
    status_code=status.HTTP_201_CREATED,
    summary="Register or update an expert's GPS location and availability",
)
def upsert_expert_location(
    data: ExpertLocationIn,
    db: Session = Depends(get_db),
) -> ExpertLocationOut:
    existing = db.query(ExpertLocation).filter(
        ExpertLocation.mobile_number == data.mobile_number
    ).first()

    if existing:
        existing.latitude = data.latitude
        existing.longitude = data.longitude
        existing.is_available = data.is_available
        db.commit()
        db.refresh(existing)
        return ExpertLocationOut.model_validate(existing)

    record = ExpertLocation(
        mobile_number=data.mobile_number,
        latitude=data.latitude,
        longitude=data.longitude,
        is_available=data.is_available,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return ExpertLocationOut.model_validate(record)


@router.get(
    "/expert-location/{mobile}",
    response_model=ExpertLocationOut,
    summary="Get the stored GPS location of a specific expert",
)
def get_expert_location(
    mobile: str,
    db: Session = Depends(get_db),
) -> ExpertLocationOut:
    record = db.query(ExpertLocation).filter(ExpertLocation.mobile_number == mobile).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No location registered for expert {mobile}",
        )
    return ExpertLocationOut.model_validate(record)


@router.post(
    "/assign",
    summary="Assign the nearest available expert to a farmer's request",
)
def assign(
    data: AssignRequest,
    db: Session = Depends(get_db),
) -> dict:
    return assign_nearest_expert(
        db=db,
        farmer_mobile=data.farmer_mobile,
        farmer_lat=data.farmer_latitude,
        farmer_lon=data.farmer_longitude,
        disease=data.disease,
    )


@router.get(
    "/status/{farmer_mobile}",
    response_model=AssignmentStatusOut,
    summary="Check the latest expert assignment status for a farmer",
)
def assignment_status(
    farmer_mobile: str,
    db: Session = Depends(get_db),
) -> AssignmentStatusOut:
    record = get_latest_assignment(db, farmer_mobile)
    if not record:
        return AssignmentStatusOut(
            has_assignment=False,
            message="No assignment found for this farmer.",
        )
    return AssignmentStatusOut(
        has_assignment=True,
        status=record.status,
        expert_mobile=record.expert_mobile,
        distance_km=record.distance_km,
        assignment_id=record.id,
        message=f"Expert {record.expert_mobile} assigned — {record.distance_km} km away.",
    )


@router.get(
    "/pending-queue",
    response_model=List[PendingQueueOut],
    summary="List all pending farmer requests (no expert available at the time)",
)
def list_pending_queue(
    db: Session = Depends(get_db),
) -> List[PendingQueueOut]:
    items = (
        db.query(PendingQueue)
        .filter(PendingQueue.resolved == False)
        .order_by(PendingQueue.created_at.asc())
        .all()
    )
    return [PendingQueueOut.model_validate(item) for item in items]
