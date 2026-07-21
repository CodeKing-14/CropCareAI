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


class OTPVerify(BaseModel):
    mobile_number: str = Field(..., description="Mobile number for OTP verification")
    role: Literal["farmer", "expert"] = Field(..., description="User role for login")
    otp_code: str = Field(..., description="One-time password code")


class AuthResponse(BaseModel):
    success: bool
    message: str
    otp_code: Optional[str] = None
