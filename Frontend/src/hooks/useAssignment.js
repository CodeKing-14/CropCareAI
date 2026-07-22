/**
 * hooks/useAssignment.js
 * Custom hook for Feature 1 — fetches and auto-polls the nearest-expert
 * assignment status for the current farmer.
 *
 * Usage:
 *   const { assignment, loading, error, requestAssignment } = useAssignment(farmerMobile);
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { assignNearestExpert, getAssignmentStatus } from '../services/assignmentApi';

const POLL_INTERVAL_MS = 15_000; // re-check every 15 s

/**
 * @param {string} farmerMobile - the logged-in farmer's mobile number
 * @param {boolean} autoStart   - start polling immediately on mount (default true)
 */
export function useAssignment(farmerMobile, autoStart = true) {
    const [assignment, setAssignment] = useState(null); // null | AssignmentStatusOut
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const intervalRef = useRef(null);

    const fetchStatus = useCallback(async () => {
        if (!farmerMobile) return;
        try {
            const data = await getAssignmentStatus(farmerMobile);
            setAssignment(data);
            setError('');
        } catch (err) {
            setError(err?.response?.data?.detail || err.message || 'Could not fetch assignment status');
        }
    }, [farmerMobile]);

    // Request assignment by triggering geolocation + calling the assign API.
    const requestAssignment = useCallback(
        async (disease = null) => {
            if (!farmerMobile) return;
            setLoading(true);
            setError('');

            const getPosition = () =>
                new Promise((resolve, reject) => {
                    if (!navigator.geolocation) {
                        reject(new Error('Geolocation is not supported by this browser.'));
                    } else {
                        navigator.geolocation.getCurrentPosition(resolve, reject, {
                            timeout: 8000,
                            enableHighAccuracy: false,
                        });
                    }
                });

            try {
                const position = await getPosition();
                const { latitude, longitude } = position.coords;
                const data = await assignNearestExpert(farmerMobile, latitude, longitude, disease);
                setAssignment({
                    has_assignment: data.status === 'assigned',
                    status: data.status,
                    expert_mobile: data.expert_mobile || null,
                    distance_km: data.distance_km || null,
                    assignment_id: data.assignment_id || null,
                    message: data.message,
                });
            } catch (err) {
                setError(err?.response?.data?.detail || err.message || 'Assignment request failed');
            } finally {
                setLoading(false);
            }
        },
        [farmerMobile]
    );

    // Auto-start polling
    useEffect(() => {
        if (!autoStart || !farmerMobile) return;
        fetchStatus();
        intervalRef.current = setInterval(fetchStatus, POLL_INTERVAL_MS);
        return () => clearInterval(intervalRef.current);
    }, [autoStart, farmerMobile, fetchStatus]);

    return { assignment, loading, error, requestAssignment, refetch: fetchStatus };
}
