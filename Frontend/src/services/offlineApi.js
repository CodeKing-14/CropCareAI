/**
 * services/offlineApi.js
 * API calls for Feature 2 — Offline AI Prediction.
 */

import axios from 'axios';
import { getBackendUrl } from './api';

const api = axios.create({ baseURL: getBackendUrl() });

/**
 * Submit an offline prediction to be synced with the server.
 * @param {string} farmerMobile
 * @param {string} imageFilename
 * @param {string} imageB64 - base64 encoded image data
 */
export async function submitOfflinePrediction(farmerMobile, imageFilename, imageB64) {
    const response = await api.post('/offline/submit', {
        farmer_mobile: farmerMobile,
        image_filename: imageFilename,
        image_b64: imageB64,
    });
    return response.data;
}

/**
 * Get the list of offline queued predictions for a farmer.
 * @param {string} farmerMobile
 */
export async function getOfflineQueue(farmerMobile) {
    const response = await api.get(`/offline/queue/${farmerMobile}`);
    return response.data;
}

/**
 * Get the count of pending offline predictions for a farmer.
 * @param {string} farmerMobile
 */
export async function getPendingCount(farmerMobile) {
    const response = await api.get(`/offline/queue/${farmerMobile}/pending-count`);
    return response.data;
}
