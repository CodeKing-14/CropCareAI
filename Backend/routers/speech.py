import os
import uuid
import shutil

from fastapi import APIRouter, UploadFile, File, HTTPException

from speech.whisper import transcribe_audio

router = APIRouter(prefix="/speech", tags=["Speech To Text"])

UPLOAD_FOLDER = "uploads/audio"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@router.post("/speech-to-text")
async def speech_to_text(audio: UploadFile = File(...)):

    try:

        file_extension = audio.filename.split(".")[-1]

        unique_filename = f"{uuid.uuid4()}.{file_extension}"

        file_path = os.path.join(UPLOAD_FOLDER, unique_filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(audio.file, buffer)

        result = transcribe_audio(file_path)

        os.remove(file_path)

        return {
            "success": True,
            "text": result["text"],
            "language": result["language"],
            "probability": result["language_probability"],
        }

    except Exception as e:

        raise HTTPException(status_code=500, detail=str(e))
