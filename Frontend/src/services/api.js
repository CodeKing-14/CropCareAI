import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

const api = axios.create({
    baseURL: BACKEND_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export function getBackendUrl() {
    return BACKEND_URL;
}

export async function requestOtp(mobileNumber, role, preferredLanguage) {
    const response = await api.post('/auth/request-otp', {
        mobile_number: mobileNumber,
        role,
        preferred_language: preferredLanguage,
    });
    return response.data;
}

export async function verifyOtp(mobileNumber, role, otpCode) {
    const response = await api.post('/auth/verify-otp', {
        mobile_number: mobileNumber,
        role,
        otp_code: otpCode,
    });
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

export async function transcribeAudio(file, language) {
    const data = new FormData();
    data.append('audio', file);
    if (language) {
        data.append('language', language);
    }
    const response = await axios.post(`${BACKEND_URL}/speech/speech-to-text`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
}

export async function sendChatMessage(payload) {
    const response = await api.post('/chat', payload);
    return response.data;
}

export async function getPredictionHistory() {
    const response = await api.get('/history');
    return response.data;
}

export async function getExpertMessages() {
    const response = await api.get('/expert-chat/messages');
    return response.data;
}

export async function sendExpertMessage(payload) {
    const response = await api.post('/expert-chat/messages', payload);
    return response.data;
}

export async function sendExpertImage(senderRole, senderMobile, file) {
    const data = new FormData();
    data.append('sender_role', senderRole);
    data.append('sender_mobile', senderMobile);
    data.append('image', file);
    const response = await axios.post(`${BACKEND_URL}/expert-chat/messages/image`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
}

export async function sendExpertVoice(senderRole, senderMobile, file, transcription) {
    const data = new FormData();
    data.append('sender_role', senderRole);
    data.append('sender_mobile', senderMobile);
    data.append('audio', file);
    if (transcription) {
        data.append('transcription', transcription);
    }
    const response = await axios.post(`${BACKEND_URL}/expert-chat/messages/voice`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
}
