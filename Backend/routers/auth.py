import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import AgricultureExpert, Farmer, get_db
from schemas import AuthResponse, OTPRequest, OTPVerify

router = APIRouter(prefix="/auth", tags=["Authentication"])

OTP_TTL_MINUTES = 5


def _get_user_model(role: str):
    if role == "farmer":
        return Farmer
    if role == "expert":
        return AgricultureExpert
    raise ValueError("Invalid role")


def _send_otp() -> str:
    return f"{secrets.randbelow(900000) + 100000}"


@router.post("/request-otp", response_model=AuthResponse)
def request_otp(data: OTPRequest, db: Session = Depends(get_db)) -> AuthResponse:
    try:
        model = _get_user_model(data.role)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    mobile = data.mobile_number.strip()
    if not mobile:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Mobile number is required")

    otp_code = _send_otp()
    otp_expires_at = datetime.utcnow() + timedelta(minutes=OTP_TTL_MINUTES)

    user = db.query(model).filter(model.mobile_number == mobile).first()
    if user is None:
        user = model(
            mobile_number=mobile,
            role=data.role,
            preferred_language=data.preferred_language,
            otp_verified=False,
            otp_code=otp_code,
            otp_expires_at=otp_expires_at,
            last_login_at=None,
        )
        db.add(user)
    else:
        user.preferred_language = data.preferred_language
        user.otp_verified = False
        user.otp_code = otp_code
        user.otp_expires_at = otp_expires_at
    db.commit()
    db.refresh(user)

    return AuthResponse(success=True, message="OTP generated successfully", otp_code=otp_code)


@router.post("/verify-otp", response_model=AuthResponse)
def verify_otp(data: OTPVerify, db: Session = Depends(get_db)) -> AuthResponse:
    try:
        model = _get_user_model(data.role)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    mobile = data.mobile_number.strip()
    if not mobile or not data.otp_code.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Mobile number and OTP code are required")

    user = db.query(model).filter(model.mobile_number == mobile).first()
    if not user or not user.otp_code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP not requested for this mobile number")

    if user.otp_code != data.otp_code.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP code")

    if user.otp_expires_at is None or datetime.utcnow() > user.otp_expires_at:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP code has expired")

    user.last_login_at = datetime.utcnow()
    user.otp_verified = True
    user.otp_code = None
    user.otp_expires_at = None
    db.commit()
    db.refresh(user)

    return AuthResponse(success=True, message="OTP verified successfully")
