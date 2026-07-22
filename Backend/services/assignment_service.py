"""
services/assignment_service.py — Haversine distance calculation and
nearest-expert assignment logic for Feature 1.
"""

import logging
import math
from typing import Optional

from sqlalchemy.orm import Session

from features.models import AssignmentHistory, ExpertLocation, PendingQueue

logger = logging.getLogger("cropcare")


# ---------------------------------------------------------------------------
# Haversine formula
# ---------------------------------------------------------------------------

_EARTH_RADIUS_KM = 6371.0


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Return the great-circle distance in kilometres between two GPS coordinates.
    Uses the standard Haversine formula.
    """
    lat1_r, lat2_r = math.radians(lat1), math.radians(lat2)
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)

    a = math.sin(d_lat / 2) ** 2 + math.cos(lat1_r) * math.cos(lat2_r) * math.sin(d_lon / 2) ** 2
    return _EARTH_RADIUS_KM * 2 * math.asin(math.sqrt(a))


# ---------------------------------------------------------------------------
# Assignment logic
# ---------------------------------------------------------------------------

def assign_nearest_expert(
    db: Session,
    farmer_mobile: str,
    farmer_lat: float,
    farmer_lon: float,
    disease: Optional[str] = None,
) -> dict:
    """
    Find the nearest available expert and create an AssignmentHistory record.

    Returns a dict with keys:
      status       — "assigned" | "pending"
      expert_mobile (only when assigned)
      distance_km  (only when assigned)
      assignment_id
      message
    """
    # Fetch all available experts that have a registered location.
    available = db.query(ExpertLocation).filter(ExpertLocation.is_available == True).all()

    if not available:
        # No expert available — place farmer in pending queue.
        queued = PendingQueue(
            farmer_mobile=farmer_mobile,
            farmer_latitude=farmer_lat,
            farmer_longitude=farmer_lon,
            disease=disease,
        )
        db.add(queued)
        db.commit()
        db.refresh(queued)
        logger.info("No available expert for farmer %s — added to pending queue (id=%d)", farmer_mobile, queued.id)
        return {
            "status": "pending",
            "message": "No expert is currently available. Your request is queued.",
            "queue_id": queued.id,
        }

    # Rank by Haversine distance and pick the closest.
    ranked = sorted(
        available,
        key=lambda e: haversine_km(farmer_lat, farmer_lon, e.latitude, e.longitude),
    )
    nearest = ranked[0]
    distance = round(haversine_km(farmer_lat, farmer_lon, nearest.latitude, nearest.longitude), 2)

    record = AssignmentHistory(
        farmer_mobile=farmer_mobile,
        expert_mobile=nearest.mobile_number,
        distance_km=distance,
        status="assigned",
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    logger.info(
        "Assigned expert %s to farmer %s (%.2f km away, assignment_id=%d)",
        nearest.mobile_number,
        farmer_mobile,
        distance,
        record.id,
    )
    return {
        "status": "assigned",
        "expert_mobile": nearest.mobile_number,
        "distance_km": distance,
        "assignment_id": record.id,
        "message": f"Expert assigned — {distance} km away.",
    }


def get_latest_assignment(db: Session, farmer_mobile: str) -> Optional[AssignmentHistory]:
    """Return the most recent assignment for a farmer (or None)."""
    return (
        db.query(AssignmentHistory)
        .filter(AssignmentHistory.farmer_mobile == farmer_mobile)
        .order_by(AssignmentHistory.created_at.desc())
        .first()
    )
