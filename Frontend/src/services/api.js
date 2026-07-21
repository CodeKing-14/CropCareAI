import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

const api = axios.create({
    baseURL: BACKEND_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export async function requestOtp(mobileNumber, role) {
    const response = await api.post('/auth/request-otp', { mobile_number: mobileNumber, role });
    return response.data;
}

export async function verifyOtp(mobileNumber, role, otpCode) {
    const response = await api.post('/auth/verify-otp', { mobile_number: mobileNumber, role, otp_code: otpCode });
    return response.data;
}

export async function predictImage(file) {
    const data = new FormData();
    data.append('image', file);
    const response = await axios.post(`${BACKEND_URL}/predict`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
}

export async function transcribeAudio(file) {
    const data = new FormData();
    data.append('audio', file);
    const response = await axios.post(`${BACKEND_URL}/speech/speech-to-text`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
}
