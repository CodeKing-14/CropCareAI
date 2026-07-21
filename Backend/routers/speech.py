import os
import uuid
import shutil

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status

from speech.whisper import transcribe_audio

router = APIRouter(prefix="/speech", tags=["Speech To Text"])

UPLOAD_FOLDER = "uploads/audio"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

SUPPORTED_AUDIO_EXTENSIONS = {"wav", "mp3", "m4a", "webm", "ogg", "flac", "aac"}
LANGUAGE_CODES = {
    "English": "en",
    "Tamil": "ta",
    "Hindi": "hi",
    "Telugu": "te",
    "Malayalam": "ml",
    "Marathi": "mr",
}


@router.post("/speech-to-text")
async def speech_to_text(audio: UploadFile = File(...), language: str | None = Form(default=None)):

    try:
        if not audio.filename:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No audio file selected")

        file_extension = audio.filename.rsplit(".", 1)[-1].lower()
        if file_extension not in SUPPORTED_AUDIO_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported audio format. Upload wav, mp3, m4a, webm, ogg, flac, or aac.",
            )

        unique_filename = f"{uuid.uuid4()}.{file_extension}"

        file_path = os.path.join(UPLOAD_FOLDER, unique_filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(audio.file, buffer)

        language_code = LANGUAGE_CODES.get(language or "")
        result = transcribe_audio(file_path, language_code)

        os.remove(file_path)

        return {
            "success": True,
            "text": result["text"],
            "language": result["language"],
            "probability": result["language_probability"],
        }

    except HTTPException:
        raise
    except Exception as e:

        raise HTTPException(status_code=500, detail=str(e))
