/**
 * services/assignmentApi.js
 * API calls for Feature 1 — Nearby Expert Assignment.
 * Extends the existing api.js pattern without modifying it.
 */

import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

const api = axios.create({ baseURL: BACKEND_URL });

/**
 * Register or update an expert's GPS location and availability.
 * @param {string} mobileNumber
 * @param {number} latitude
 * @param {number} longitude
 * @param {boolean} isAvailable
 */
export async function upsertExpertLocation(mobileNumber, latitude, longitude, isAvailable = true) {
    const response = await api.post('/assignment/expert-location', {
        mobile_number: mobileNumber,
        latitude,
        longitude,
        is_available: isAvailable,
    });
    return response.data;
}

/**
 * Assign the nearest available expert to a farmer.
 * @param {string} farmerMobile
 * @param {number} farmerLat
 * @param {number} farmerLon
 * @param {string|null} disease  - optional predicted disease name
 */
export async function assignNearestExpert(farmerMobile, farmerLat, farmerLon, disease = null) {
    const response = await api.post('/assignment/assign', {
        farmer_mobile: farmerMobile,
        farmer_latitude: farmerLat,
        farmer_longitude: farmerLon,
        disease,
    });
    return response.data;
}

/**
 * Get the latest assignment status for a farmer.
 * @param {string} farmerMobile
 */
export async function getAssignmentStatus(farmerMobile) {
    const response = await api.get(`/assignment/status/${farmerMobile}`);
    return response.data;
}

/**
 * List all pending farmer requests (no expert available).
 */
export async function getPendingQueue() {
    const response = await api.get('/assignment/pending-queue');
    return response.data;
}
