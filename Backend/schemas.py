from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


class PredictionResponse(BaseModel):
    disease: str = Field(..., description="Predicted disease label")
    confidence: float = Field(..., description="Prediction confidence percentage")


class PredictionHistoryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    image_name: str
    predicted_disease: str
    confidence: float
    prediction_time: float
    created_at: datetime


class ErrorResponse(BaseModel):
    detail: str


class OTPRequest(BaseModel):
    mobile_number: str = Field(..., description="Mobile number for OTP login")
    role: Literal["farmer", "expert"] = Field(..., description="User role for login")
    preferred_language: str = Field("English", description="Preferred app language")
    specialty: Optional[str] = Field(None, description="Crop specialty (for experts)")


class OTPVerify(BaseModel):
    mobile_number: str = Field(..., description="Mobile number for OTP verification")
    role: Literal["farmer", "expert"] = Field(..., description="User role for login")
    otp_code: str = Field(..., description="One-time password code")


class AuthResponse(BaseModel):
    success: bool
    message: str
    otp_code: Optional[str] = None


class ChatRequest(BaseModel):
    message: str = Field(..., description="User message for crop care advice")
    disease: Optional[str] = Field(None, description="Predicted disease name, when available")
    confidence: Optional[float] = Field(None, description="Prediction confidence, when available")
    language: str = Field("English", description="Preferred response language")


class ChatResponse(BaseModel):
    success: bool
    ai_response: str
    medicine_recommendation: str
    treatment_steps: list[str]
    precautions: list[str]
    recovery_advice: str


class ExpertMessageCreate(BaseModel):
    sender_role: Literal["farmer", "expert"] = Field(..., description="Role of the message sender")
    sender_mobile: str = Field(..., description="Mobile number of the sender")
    recipient_mobile: Optional[str] = Field(None, description="Mobile number of the recipient")
    content: str = Field(..., description="Text message content")


class ExpertMessageItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sender_role: str
    sender_mobile: str
    recipient_mobile: Optional[str] = None
    message_type: str
    content: str
    created_at: datetime
