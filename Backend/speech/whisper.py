from faster_whisper import WhisperModel

# Options: tiny, base, small, medium, large-v3
MODEL_SIZE = "small"

_model = None


def get_model():
    """Lazily load and return the WhisperModel instance."""
    global _model
    if _model is None:
        _model = WhisperModel(
            MODEL_SIZE,
            device="cpu",  # Change to "cuda" if using NVIDIA GPU
            compute_type="int8",
        )
    return _model


def transcribe_audio(audio_path: str):
    """Transcribe an audio file using Faster-Whisper."""

    model = get_model()
    segments, info = model.transcribe(
        audio_path,
        beam_size=5,
        multilingual=True,
        language=None,
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
