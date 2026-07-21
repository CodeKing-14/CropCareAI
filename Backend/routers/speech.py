"""
routers/speech.py — Speech-to-text endpoint using Faster-Whisper.
"""

import os
import uuid

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from speech.whisper import transcribe_audio

router = APIRouter(prefix="/speech", tags=["Speech To Text"])

UPLOAD_FOLDER = "uploads/audio"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

SUPPORTED_AUDIO_EXTENSIONS = {"wav", "mp3", "m4a", "webm", "ogg", "flac", "aac"}

# Maps human-readable language names sent from the frontend to BCP-47 codes.
LANGUAGE_CODES: dict[str, str] = {
    "English": "en",
    "Tamil": "ta",
    "Hindi": "hi",
    "Telugu": "te",
    "Malayalam": "ml",
    "Marathi": "mr",
}


@router.post("/speech-to-text")
async def speech_to_text(
    audio: UploadFile = File(...),
    language: str | None = Form(default=None),
):
    """Transcribe an uploaded audio file and return the text."""

    if not audio.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No audio file selected",
        )

    file_extension = audio.filename.rsplit(".", 1)[-1].lower()
    if file_extension not in SUPPORTED_AUDIO_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Unsupported audio format. "
                "Please upload one of: wav, mp3, m4a, webm, ogg, flac, aac."
            ),
        )

    # Read bytes asynchronously — never block the event loop.
    audio_bytes = await audio.read()
    if not audio_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty audio file.",
        )

    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join(UPLOAD_FOLDER, unique_filename)

    with open(file_path, "wb") as buffer:
        buffer.write(audio_bytes)

    try:
        language_code = LANGUAGE_CODES.get(language or "")
        result = transcribe_audio(file_path, language_code)
    finally:
        # Always remove the temp file even if transcription fails.
        if os.path.exists(file_path):
            os.remove(file_path)

    return {
        "success": True,
        "text": result["text"],
        "language": result["language"],
        "probability": result["language_probability"],
    }
