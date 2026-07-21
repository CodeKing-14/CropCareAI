from fastapi import APIRouter, HTTPException, status

from schemas import ChatRequest, ChatResponse

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("", response_model=ChatResponse)
def chat(data: ChatRequest) -> ChatResponse:
    message = data.message.strip()
    if not message and not data.disease:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Message or disease is required")

    disease = data.disease or "the reported crop issue"
    confidence_text = f" with {data.confidence:.1f}% confidence" if data.confidence is not None else ""

    return ChatResponse(
        success=True,
        ai_response=(
            f"Based on {disease}{confidence_text}, inspect the affected leaves closely, "
            "remove severely damaged parts, and avoid overwatering while monitoring new growth."
        ),
        medicine_recommendation=(
            "Use an appropriate crop-safe fungicide or bactericide only after confirming the disease locally. "
            "For severe spread, contact an agriculture expert before applying chemicals."
        ),
        treatment_steps=[
            "Isolate or mark affected plants for close observation.",
            "Remove infected leaves using clean tools.",
            "Improve air flow and avoid wetting leaves during irrigation.",
            "Apply locally recommended treatment at the label dosage.",
            "Recheck the crop after 3 to 5 days and record changes.",
        ],
        precautions=[
            "Wear gloves and a mask while spraying.",
            "Do not mix chemicals without expert guidance.",
            "Keep children and animals away from treated areas.",
            "Follow the waiting period before harvest.",
        ],
    )
