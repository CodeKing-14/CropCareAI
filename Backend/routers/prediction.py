import logging
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from database import PredictionHistory, get_db
from predict import prediction_service
from schemas import ErrorResponse, PredictionHistoryItem, PredictionResponse
from utils import is_supported_image, save_uploaded_image

logger = logging.getLogger("cropcare")
router = APIRouter(tags=["prediction"])


@router.post(
    "/predict",
    response_model=PredictionResponse,
    status_code=status.HTTP_200_OK,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
async def predict(
    image: Annotated[UploadFile, File(...)],
    db: Session = Depends(get_db),
) -> PredictionResponse:
    if not image.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No file selected")

    contents = await image.read()
    if not contents:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty upload")

    if not is_supported_image(contents):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file type. Please upload a valid image.",
        )

    try:
        image_path = save_uploaded_image(contents, image.filename)
        result = prediction_service.predict_image(contents, image.filename)

        history_item = PredictionHistory(
            image_name=image_path,
            predicted_disease=result["disease"],
            confidence=result["confidence"],
            prediction_time=result["prediction_time"],
        )
        db.add(history_item)
        db.commit()
        db.refresh(history_item)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover - defensive branch
        logger.exception("Prediction failed")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Prediction failed: {exc}") from exc

    return PredictionResponse(disease=result["disease"], confidence=result["confidence"])


@router.get(
    "/history",
    response_model=list[PredictionHistoryItem],
    responses={503: {"model": ErrorResponse}},
)
def list_history(db: Session = Depends(get_db)) -> list[PredictionHistoryItem]:
    try:
        items = db.query(PredictionHistory).order_by(PredictionHistory.created_at.desc()).all()
    except Exception as exc:  # pragma: no cover - defensive branch
        logger.exception("Failed to read prediction history")
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database is unavailable") from exc

    return [PredictionHistoryItem.model_validate(item) for item in items]


@router.get(
    "/history/{history_id}",
    response_model=PredictionHistoryItem,
    responses={404: {"model": ErrorResponse}, 503: {"model": ErrorResponse}},
)
def get_history_item(
    history_id: int,
    db: Session = Depends(get_db),
) -> PredictionHistoryItem:
    try:
        item = db.query(PredictionHistory).filter(PredictionHistory.id == history_id).first()
    except Exception as exc:  # pragma: no cover - defensive branch
        logger.exception("Failed to fetch prediction history item")
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database is unavailable") from exc

    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prediction not found")
    return item


@router.delete(
    "/history/{history_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={404: {"model": ErrorResponse}, 503: {"model": ErrorResponse}},
)
def delete_history_item(
    history_id: int,
    db: Session = Depends(get_db),
) -> None:
    try:
        item = db.query(PredictionHistory).filter(PredictionHistory.id == history_id).first()
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prediction not found")
        db.delete(item)
        db.commit()
    except HTTPException:
        raise
    except Exception as exc:  # pragma: no cover - defensive branch
        logger.exception("Failed to delete prediction history item")
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database is unavailable") from exc
