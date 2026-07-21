import logging
import os
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from database import ExpertMessage, get_db
from schemas import ExpertMessageCreate, ExpertMessageItem
from utils import is_supported_image, save_uploaded_image

logger = logging.getLogger("cropcare")
router = APIRouter(prefix="/expert-chat", tags=["Expert Chat"])

AUDIO_UPLOAD_DIR = "uploads/expert_audio"
os.makedirs(AUDIO_UPLOAD_DIR, exist_ok=True)

SUPPORTED_AUDIO_EXTENSIONS = {"wav", "mp3", "m4a", "webm", "ogg", "flac", "aac"}


@router.get("/messages", response_model=list[ExpertMessageItem])
def list_messages(db: Session = Depends(get_db)) -> list[ExpertMessageItem]:
    try:
        items = (
            db.query(ExpertMessage)
            .order_by(ExpertMessage.created_at.asc())
            .limit(200)
            .all()
        )
        return [ExpertMessageItem.model_validate(item) for item in items]
    except Exception as exc:
        logger.exception("Failed to fetch expert chat messages")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not load messages",
        ) from exc


@router.post("/messages", response_model=ExpertMessageItem, status_code=status.HTTP_201_CREATED)
def send_message(data: ExpertMessageCreate, db: Session = Depends(get_db)) -> ExpertMessageItem:
    content = data.content.strip()
    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Message cannot be empty")

    mobile = data.sender_mobile.strip()
    if not mobile:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Sender mobile number is required")

    message = ExpertMessage(
        sender_role=data.sender_role,
        sender_mobile=mobile,
        message_type="text",
        content=content,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return ExpertMessageItem.model_validate(message)


@router.post("/messages/image", response_model=ExpertMessageItem, status_code=status.HTTP_201_CREATED)
async def send_image_message(
    sender_role: Annotated[str, Form(...)],
    sender_mobile: Annotated[str, Form(...)],
    image: Annotated[UploadFile, File(...)],
    db: Session = Depends(get_db),
) -> ExpertMessageItem:
    if sender_role not in {"farmer", "expert"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid sender role")

    mobile = sender_mobile.strip()
    if not mobile:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Sender mobile number is required")

    if not image.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No image selected")

    contents = await image.read()
    if not contents:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty image upload")

    if not is_supported_image(contents):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file type. Please upload a valid image.",
        )

    image_path = save_uploaded_image(contents, f"expert_{uuid.uuid4().hex}_{image.filename}")

    message = ExpertMessage(
        sender_role=sender_role,
        sender_mobile=mobile,
        message_type="image",
        content=image_path,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return ExpertMessageItem.model_validate(message)


@router.post("/messages/voice", response_model=ExpertMessageItem, status_code=status.HTTP_201_CREATED)
async def send_voice_message(
    sender_role: Annotated[str, Form(...)],
    sender_mobile: Annotated[str, Form(...)],
    audio: Annotated[UploadFile, File(...)],
    transcription: Annotated[str | None, Form()] = None,
    db: Session = Depends(get_db),
) -> ExpertMessageItem:
    if sender_role not in {"farmer", "expert"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid sender role")

    mobile = sender_mobile.strip()
    if not mobile:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Sender mobile number is required")

    if not audio.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No audio selected")

    file_extension = audio.filename.rsplit(".", 1)[-1].lower()
    if file_extension not in SUPPORTED_AUDIO_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported audio format.",
        )

    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join(AUDIO_UPLOAD_DIR, unique_filename)

    with open(file_path, "wb") as buffer:
        buffer.write(await audio.read())

    content = transcription.strip() if transcription and transcription.strip() else f"[Voice message: {unique_filename}]"

    message = ExpertMessage(
        sender_role=sender_role,
        sender_mobile=mobile,
        message_type="voice",
        content=content,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return ExpertMessageItem.model_validate(message)
