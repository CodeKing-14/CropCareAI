/**
 * components/EmergencyBadge.jsx
 * Feature 3 — Emergency Crop Alert badge.
 * Reusable component to drop into existing prediction results.
 */

import { motion } from 'framer-motion';
import { MdWarning } from 'react-icons/md';

export default function EmergencyBadge({ emergencyStatus }) {
    if (!emergencyStatus || !emergencyStatus.isEmergency) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
                type: 'spring',
                stiffness: 400,
                damping: 20
            }}
            style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                background: '#ffe3e8',
                border: '1px solid #f5b8c2',
                borderRadius: '12px',
                padding: '12px 16px',
                color: '#8a1f2c',
                marginTop: '12px',
                marginBottom: '12px',
                boxShadow: '0 4px 12px rgba(138, 31, 44, 0.15)'
            }}
        >
            <MdWarning style={{ 
                fontSize: '1.5rem', 
                flexShrink: 0,
                marginTop: '2px',
                animation: 'pulse-soft 1.5s ease-in-out infinite' 
            }} />
            <div>
                <strong style={{ display: 'block', fontSize: '0.95rem', marginBottom: '4px' }}>
                    EMERGENCY ALERT
                </strong>
                <span style={{ fontSize: '0.88rem', lineHeight: 1.4 }}>
                    {emergencyStatus.message}
                </span>
            </div>
        </motion.div>
    );
}
