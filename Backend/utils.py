import json
import os
from io import BytesIO
from pathlib import Path
from typing import Any, Dict

from PIL import Image, UnidentifiedImageError

UPLOAD_DIR = Path(__file__).resolve().parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

SUPPORTED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/jpg", "image/webp"}


def is_supported_image(file_bytes: bytes) -> bool:
    try:
        with Image.open(BytesIO(file_bytes)) as image:
            image.verify()
    except (UnidentifiedImageError, OSError):
        return False
    return True


def save_uploaded_image(file_bytes: bytes, filename: str) -> str:
    image_path = UPLOAD_DIR / Path(filename).name
    image_path.write_bytes(file_bytes)
    return str(image_path)


def load_class_names(path: Path) -> list[str]:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)
