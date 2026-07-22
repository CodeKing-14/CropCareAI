"""
routers/offline_router.py — Offline AI Prediction sync endpoint (Feature 2).

When a farmer goes back online, the frontend replays any locally-queued
predictions to this endpoint. The server runs the actual CNN prediction
on the stored image bytes and updates the OfflineQueue record.
"""

import base64
import logging
from io import BytesIO
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import get_db
from features.models import OfflineQueue

logger = logging.getLogger("cropcare")
router = APIRouter(prefix="/offline", tags=["Offline Prediction Sync"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class OfflineSubmitIn(BaseModel):
    farmer_mobile: str = Field(..., description="Farmer mobile number")
    image_filename: str = Field(..., description="Original filename from the device")
    image_b64: str = Field(..., description="Base-64 encoded image bytes")


class OfflineQueueOut(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    farmer_mobile: str
    image_filename: str
    status: str
    disease: str | None
    confidence: float | None


class OfflineSyncResultOut(BaseModel):
    queue_id: int
    status: str
    disease: str | None
    confidence: float | None
    message: str


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post(
    "/submit",
    response_model=OfflineSyncResultOut,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a prediction that was taken while the device was offline",
)
def submit_offline_prediction(
    data: OfflineSubmitIn,
    db: Session = Depends(get_db),
) -> OfflineSyncResultOut:
    """
    1. Store the image + metadata in offline_queue.
    2. Attempt server-side prediction using the existing prediction service.
    3. Mark status = 'synced' on success, 'failed' on error.
    """
    # Validate base-64 payload
    try:
        image_bytes = base64.b64decode(data.image_b64)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="image_b64 is not valid base-64 encoded data.",
        )

    # Persist the queue record immediately so we have a record even if prediction fails.
    record = OfflineQueue(
        farmer_mobile=data.farmer_mobile,
        image_filename=data.image_filename,
        image_b64=data.image_b64,
        status="pending",
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    # Run the CNN prediction on the decoded bytes.
    try:
        from predict import prediction_service
        from datetime import datetime

        result = prediction_service.predict_image(image_bytes, data.image_filename)
        record.disease = result["disease"]
        record.confidence = result["confidence"]
        record.status = "synced"
        record.synced_at = datetime.utcnow()
        db.commit()
        db.refresh(record)
        logger.info(
            "Offline sync successful for farmer %s — queue_id=%d, disease=%s",
            data.farmer_mobile,
            record.id,
            record.disease,
        )
        return OfflineSyncResultOut(
            queue_id=record.id,
            status="synced",
            disease=record.disease,
            confidence=record.confidence,
            message="Prediction completed and synced successfully.",
        )
    except Exception as exc:
        record.status = "failed"
        db.commit()
        logger.exception("Offline sync prediction failed for queue_id=%d", record.id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Image stored but prediction failed: {exc}",
        ) from exc


@router.get(
    "/queue/{farmer_mobile}",
    response_model=List[OfflineQueueOut],
    summary="List all offline-queued predictions for a farmer",
)
def get_offline_queue(
    farmer_mobile: str,
    db: Session = Depends(get_db),
) -> List[OfflineQueueOut]:
    items = (
        db.query(OfflineQueue)
        .filter(OfflineQueue.farmer_mobile == farmer_mobile)
        .order_by(OfflineQueue.created_at.desc())
        .limit(50)
        .all()
    )
    return [OfflineQueueOut.model_validate(item) for item in items]


@router.get(
    "/queue/{farmer_mobile}/pending-count",
    summary="Return the number of unsynced offline predictions for a farmer",
)
def pending_count(
    farmer_mobile: str,
    db: Session = Depends(get_db),
) -> dict:
    count = (
        db.query(OfflineQueue)
        .filter(
            OfflineQueue.farmer_mobile == farmer_mobile,
            OfflineQueue.status == "pending",
        )
        .count()
    )
    return {"farmer_mobile": farmer_mobile, "pending_count": count}
