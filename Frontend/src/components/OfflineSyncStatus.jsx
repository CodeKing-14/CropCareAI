/**
 * components/OfflineSyncStatus.jsx
 * Feature 2 — Shows offline/sync status badge.
 * Reusable component to drop into existing pages without breaking them.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { MdCloudOff, MdCloudUpload, MdCloudDone, MdSync } from 'react-icons/md';
import { useOfflineSync } from '../hooks/useOfflineSync';

export default function OfflineSyncStatus({ farmerMobile }) {
    const { isOnline, isSyncing, pendingCount } = useOfflineSync(farmerMobile);

    let statusType = 'online'; // online, offline, syncing, pending
    let icon = <MdCloudDone />;
    let text = 'Synced Successfully';
    let bgColor = '#e5f3e8';
    let color = '#1d5e3b';
    let border = '#b8dfc4';

    if (!isOnline) {
        statusType = 'offline';
        icon = <MdCloudOff />;
        text = 'Offline Prediction (No Internet)';
        bgColor = '#ffe3e8';
        color = '#c62828';
        border = '#f5b8c2';
    } else if (isSyncing) {
        statusType = 'syncing';
        icon = <MdSync style={{ animation: 'spin 1s linear infinite' }} />;
        text = 'Syncing...';
        bgColor = '#e8f4fd';
        color = '#1a5276';
        border = '#b8d9f0';
    } else if (pendingCount > 0) {
        statusType = 'pending';
        icon = <MdCloudUpload />;
        text = `Pending Sync (${pendingCount})`;
        bgColor = '#fff8e1';
        color = '#f57f17';
        border = '#ffe082';
    } else {
        // If online and fully synced, we only show it briefly or not at all.
        // For now, let's always show it if online to match requirements (or hide if we want to be clean).
        // Let's hide it if online and no pending count.
        return null; 
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '999px',
                    background: bgColor,
                    color: color,
                    border: `1px solid ${border}`,
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    marginBottom: '10px'
                }}
            >
                {icon}
                <span>{text}</span>
            </motion.div>
        </AnimatePresence>
    );
}
