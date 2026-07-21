import logging
import time
from io import BytesIO
from pathlib import Path
from typing import Any, Dict

import torch
from PIL import Image, UnidentifiedImageError
from torchvision import models, transforms

from utils import load_class_names

logger = logging.getLogger("cropcare")

MODEL_PATH = Path(__file__).resolve().parent.parent / "models" / "plant_model.pth"
CLASS_NAMES_PATH = Path(__file__).resolve().parent.parent / "models" / "class_names.json"


class PredictionService:
    def __init__(self) -> None:
        self.class_names = load_class_names(CLASS_NAMES_PATH)
        self.model_loaded = False
        self.model_error = None
        self.device = torch.device("cpu")
        self.model = None
        self.transform = transforms.Compose(
            [
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
            ]
        )
        self._load_model_metadata()

    def _load_model_metadata(self) -> None:
        if not MODEL_PATH.exists():
            self.model_error = f"Model file not found: {MODEL_PATH}"
            return

        try:
            model = models.resnet18(weights=None)
            model.fc = torch.nn.Linear(model.fc.in_features, len(self.class_names))
            state_dict = torch.load(MODEL_PATH, map_location=self.device)
            model.load_state_dict(state_dict, strict=True)
            model.to(self.device)
            model.eval()
            self.model = model
            self.model_loaded = True
        except Exception as exc:  # pragma: no cover - runtime dependent
            self.model_error = str(exc)

    def predict_image(self, image_bytes: bytes, filename: str) -> Dict[str, Any]:
        try:
            image = Image.open(BytesIO(image_bytes)).convert("RGB")
        except (UnidentifiedImageError, OSError) as exc:
            raise ValueError("Corrupted or invalid image") from exc

        if not self.model_loaded or self.model is None:
            raise RuntimeError(self.model_error or "Model is not available")

        start_time = time.perf_counter()
        with torch.no_grad():
            tensor = self.transform(image).unsqueeze(0).to(self.device)
            outputs = self.model(tensor)
            probabilities = torch.softmax(outputs, dim=1)[0]
            predicted_index = int(torch.argmax(probabilities).item())
            confidence_percentage = round(float(probabilities[predicted_index].item() * 100), 2)

        disease_name = self.class_names[predicted_index]
        prediction_time = round((time.perf_counter() - start_time) * 1000, 2)

        logger.info(
            "Prediction completed for %s using model inference with confidence %.2f",
            filename,
            confidence_percentage,
        )

        return {
            "disease": disease_name,
            "confidence": confidence_percentage,
            "prediction_time": prediction_time,
        }
