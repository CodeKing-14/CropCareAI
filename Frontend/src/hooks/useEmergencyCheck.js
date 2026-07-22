/**
 * hooks/useEmergencyCheck.js
 * Custom hook for Feature 3 — checks if a predicted disease is an emergency.
 */

import { useState, useCallback } from 'react';
import { checkEmergency } from '../services/emergencyApi';

export function useEmergencyCheck(farmerMobile) {
    const [emergencyStatus, setEmergencyStatus] = useState(null);
    const [isChecking, setIsChecking] = useState(false);

    const verifyEmergency = useCallback(async (disease, confidence) => {
        if (!farmerMobile || !disease) return;
        
        setIsChecking(true);
        setEmergencyStatus(null);
        
        try {
            const result = await checkEmergency(farmerMobile, disease, confidence);
            if (result.is_emergency) {
                setEmergencyStatus({
                    isEmergency: true,
                    message: result.message
                });
            }
        } catch (error) {
            console.error('Failed to check emergency status:', error);
        } finally {
            setIsChecking(false);
        }
    }, [farmerMobile]);

    return { emergencyStatus, isChecking, verifyEmergency, clearEmergency: () => setEmergencyStatus(null) };
}
