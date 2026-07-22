/**
 * components/PendingUploadScreen.jsx
 * Feature 2 - Pending Upload Screen.
 * Reusable overlay component to show when there are pending uploads.
 */

import { motion } from 'framer-motion';
import { MdCloudUpload, MdSync } from 'react-icons/md';

export default function PendingUploadScreen({ pendingCount, isSyncing, onSync }) {
    if (pendingCount === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid #ffe082',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 8px 32px rgba(245, 127, 23, 0.15)',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                width: '280px'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f57f17', fontWeight: 700 }}>
                <MdCloudUpload style={{ fontSize: '1.5rem' }} />
                <span>Pending Uploads</span>
            </div>
            
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#57696a' }}>
                You have {pendingCount} offline prediction{pendingCount > 1 ? 's' : ''} waiting to be synced to the server.
            </p>

            <button 
                onClick={onSync}
                disabled={isSyncing}
                style={{
                    background: '#fff8e1',
                    color: '#f57f17',
                    border: '1px solid #ffe082',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: isSyncing ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '8px'
                }}
            >
                {isSyncing ? (
                    <><MdSync style={{ animation: 'spin 1s linear infinite' }} /> Syncing...</>
                ) : (
                    'Sync Now'
                )}
            </button>
        </motion.div>
    );
}
