import torch
from faster_whisper import WhisperModel

# Options: tiny, base, small, medium, large-v3
MODEL_SIZE = "small"

_model = None


def get_model():
    """Lazily load and return the WhisperModel instance."""
    global _model
    if _model is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"
        _model = WhisperModel(
            MODEL_SIZE,
            device=device,
            compute_type="float16" if device == "cuda" else "int8",
        )
    return _model


def transcribe_audio(audio_path: str, language: str | None = None):
    """Transcribe an audio file using Faster-Whisper."""

    model = get_model()
    segments, info = model.transcribe(
        audio_path,
        beam_size=5,
        multilingual=True,
        language=language,
        task="transcribe",
    )

    text = ""
    for segment in segments:
        text += segment.text + " "

    return {
        "text": text.strip(),
        "language": info.language,
        "language_probability": round(info.language_probability, 3),
    }
