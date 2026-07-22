/**
 * hooks/useOfflineSync.js
 * Custom hook for Feature 2 — manages offline state and auto-syncs
 * queued predictions when the network is restored.
 */

import { useState, useEffect, useCallback } from 'react';
import { submitOfflinePrediction, getPendingCount } from '../services/offlineApi';

const QUEUE_KEY = 'cropcare_offline_queue';

export function useOfflineSync(farmerMobile) {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isSyncing, setIsSyncing] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);

    // Get the current local queue
    const getLocalQueue = () => {
        try {
            return JSON.parse(localStorage.getItem(QUEUE_KEY)) || [];
        } catch {
            return [];
        }
    };

    // Save item to local queue
    const enqueuePrediction = (filename, base64Data) => {
        const queue = getLocalQueue();
        queue.push({
            id: Date.now().toString(),
            filename,
            base64Data,
            timestamp: new Date().toISOString(),
        });
        localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
        setPendingCount(queue.length);
    };

    // Sync queued items to backend
    const syncQueue = useCallback(async () => {
        if (!isOnline || !farmerMobile) return;
        
        const queue = getLocalQueue();
        if (queue.length === 0) {
            // Check server for pending count just in case
            try {
                 const data = await getPendingCount(farmerMobile);
                 setPendingCount(data.pending_count);
            } catch (e) {
                 // ignore
            }
            return;
        }

        setIsSyncing(true);
        let syncSuccessCount = 0;
        const newQueue = [...queue];

        for (let i = 0; i < queue.length; i++) {
            const item = queue[i];
            try {
                // Remove data:image/...;base64, prefix if present
                const b64 = item.base64Data.split(',')[1] || item.base64Data;
                await submitOfflinePrediction(farmerMobile, item.filename, b64);
                // Mark for removal if successful
                newQueue[i] = null;
                syncSuccessCount++;
            } catch (error) {
                console.error('Failed to sync offline item:', item.filename, error);
            }
        }

        const remainingQueue = newQueue.filter(Boolean);
        localStorage.setItem(QUEUE_KEY, JSON.stringify(remainingQueue));
        
        try {
            const data = await getPendingCount(farmerMobile);
            setPendingCount(remainingQueue.length + (data.pending_count || 0));
        } catch(e) {
            setPendingCount(remainingQueue.length);
        }
        
        setIsSyncing(false);
    }, [isOnline, farmerMobile]);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            syncQueue();
        };
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Initial sync check
        if (isOnline) {
            syncQueue();
        } else {
            setPendingCount(getLocalQueue().length);
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [syncQueue, isOnline]);

    return {
        isOnline,
        isSyncing,
        pendingCount,
        enqueuePrediction,
        syncQueue
    };
}

// Utility to convert file to base64
export function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
}
