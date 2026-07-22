/**
 * components/ExpertAssignmentCard.jsx
 * Feature 1 — Nearby Expert Assignment UI card.
 *
 * Displays:
 *   • Assigned Expert mobile
 *   • Distance in km
 *   • Assignment status badge
 *   • A button to trigger / re-trigger assignment
 *
 * Props:
 *   farmerMobile  {string}  — current farmer's mobile number
 *   disease       {string}  — optional predicted disease for context
 *
 * This component is standalone — it does NOT modify any existing page.
 * Import it wherever you want the assignment panel to appear.
 */

import { motion } from 'framer-motion';
import { MdLocationOn, MdPerson, MdRefresh, MdSchedule } from 'react-icons/md';
import { useAssignment } from '../hooks/useAssignment';

const STATUS_COLOURS = {
    assigned: { bg: '#e5f3e8', color: '#1d5e3b', border: '#b8dfc4' },
    pending:  { bg: '#fff8e1', color: '#856404', border: '#ffe082' },
    completed:{ bg: '#e8f4fd', color: '#1a5276', border: '#b8d9f0' },
};

export default function ExpertAssignmentCard({ farmerMobile, disease }) {
    const { assignment, loading, error, requestAssignment } = useAssignment(farmerMobile, true);

    const statusStyle = assignment?.status
        ? STATUS_COLOURS[assignment.status] || STATUS_COLOURS.pending
        : null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={cardStyle}
        >
            {/* Header */}
            <div style={headerStyle}>
                <span style={eyebrowStyle}>EXPERT ASSIGNMENT</span>
                <button
                    onClick={() => requestAssignment(disease || null)}
                    disabled={loading}
                    title="Request / refresh expert assignment"
                    style={refreshBtnStyle}
                >
                    <MdRefresh style={{ fontSize: '1.1rem', ...(loading ? spinStyle : {}) }} />
                </button>
            </div>

            {/* Content */}
            {!assignment && !loading && !error && (
                <p style={subtitleStyle}>
                    <MdLocationOn style={{ verticalAlign: 'middle', color: '#45965c' }} />{' '}
                    Click ↻ to find the nearest available expert using your GPS location.
                </p>
            )}

            {loading && (
                <div style={spinnerRowStyle}>
                    <div style={spinnerStyle} />
                    <span style={subtitleStyle}>Finding nearest expert…</span>
                </div>
            )}

            {error && (
                <div style={errorStyle}>{error}</div>
            )}

            {assignment && !loading && (
                <div style={infoGridStyle}>
                    {/* Status badge */}
                    <div style={badgeRowStyle}>
                        <span
                            style={{
                                ...badgeStyle,
                                background: statusStyle?.bg,
                                color: statusStyle?.color,
                                border: `1px solid ${statusStyle?.border}`,
                            }}
                        >
                            {assignment.status === 'assigned' ? '✓ Assigned' :
                             assignment.status === 'pending'  ? '⏳ Pending Queue' :
                             assignment.status === 'completed'? '✅ Completed' :
                             assignment.status}
                        </span>
                    </div>

                    {/* Expert mobile */}
                    {assignment.expert_mobile && (
                        <div style={infoRowStyle}>
                            <MdPerson style={iconStyle} />
                            <div>
                                <div style={labelStyle}>Assigned Expert</div>
                                <div style={valueStyle}>{assignment.expert_mobile}</div>
                            </div>
                        </div>
                    )}

                    {/* Distance */}
                    {assignment.distance_km != null && (
                        <div style={infoRowStyle}>
                            <MdLocationOn style={iconStyle} />
                            <div>
                                <div style={labelStyle}>Distance</div>
                                <div style={valueStyle}>{assignment.distance_km} km away</div>
                            </div>
                        </div>
                    )}

                    {/* Message */}
                    {assignment.message && (
                        <div style={infoRowStyle}>
                            <MdSchedule style={iconStyle} />
                            <div style={{ ...valueStyle, fontSize: '0.88rem', color: '#57696a' }}>
                                {assignment.message}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
}

// ─── Inline styles — reuse the existing Page.css design tokens ────────────

const cardStyle = {
    background: 'linear-gradient(180deg, #f7faf6 0%, #f0f6f1 100%)',
    border: '1px solid #dde7dc',
    borderRadius: '20px',
    padding: '20px 22px',
    marginTop: '20px',
};

const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
};

const eyebrowStyle = {
    textTransform: 'uppercase',
    letterSpacing: '0.14em',
    fontSize: '0.72rem',
    fontWeight: 700,
    color: '#45965c',
};

const refreshBtnStyle = {
    background: '#eef6ef',
    border: 'none',
    borderRadius: '10px',
    width: '34px',
    height: '34px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#357849',
};

const spinStyle = {
    animation: 'spin 0.7s linear infinite',
};

const subtitleStyle = {
    color: '#57696a',
    fontSize: '0.92rem',
    margin: 0,
};

const spinnerRowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
};

const spinnerStyle = {
    width: '18px',
    height: '18px',
    border: '2.5px solid #c8e4ce',
    borderTopColor: '#45965c',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
    flexShrink: 0,
};

const errorStyle = {
    background: '#ffe3e8',
    color: '#8a1f2c',
    border: '1px solid #f5b8c2',
    borderRadius: '12px',
    padding: '10px 14px',
    fontSize: '0.88rem',
};

const infoGridStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
};

const badgeRowStyle = {
    marginBottom: '4px',
};

const badgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 12px',
    borderRadius: '999px',
    fontSize: '0.8rem',
    fontWeight: 700,
};

const infoRowStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
};

const iconStyle = {
    fontSize: '1.15rem',
    color: '#45965c',
    marginTop: '2px',
    flexShrink: 0,
};

const labelStyle = {
    fontSize: '0.72rem',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    fontWeight: 700,
    color: '#6b8578',
    marginBottom: '2px',
};

const valueStyle = {
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#1a2e22',
};
