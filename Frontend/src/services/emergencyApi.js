/**
 * services/emergencyApi.js
 * API calls for Feature 3 — Emergency Crop Alert.
 */

import axios from 'axios';
import { getBackendUrl } from './api';

const api = axios.create({ baseURL: getBackendUrl() });

/**
 * Check if a disease is an emergency.
 * @param {string} farmerMobile
 * @param {string} disease
 * @param {number} confidence
 * @param {string} expertMobile - optional
 * @param {number} predictionId - optional
 */
export async function checkEmergency(farmerMobile, disease, confidence, expertMobile = null, predictionId = null) {
    const response = await api.post('/emergency/check', {
        farmer_mobile: farmerMobile,
        disease,
        confidence,
        expert_mobile: expertMobile,
        prediction_id: predictionId
    });
    return response.data;
}

/**
 * Get unacknowledged alerts (for expert dashboard).
 * @param {string} expertMobile - optional filter
 */
export async function getEmergencyAlerts(expertMobile = null) {
    const url = expertMobile ? `/emergency/alerts?expert_mobile=${expertMobile}` : '/emergency/alerts';
    const response = await api.get(url);
    return response.data;
}

/**
 * Acknowledge an alert.
 * @param {number} alertId 
 */
export async function acknowledgeAlert(alertId) {
    const response = await api.post('/emergency/alerts/acknowledge', { alert_id: alertId });
    return response.data;
}
