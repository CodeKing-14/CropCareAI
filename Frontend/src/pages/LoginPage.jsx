import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MdPhoneAndroid, MdSms, MdSecurity, MdRefresh } from 'react-icons/md';
import { getRole, getLanguage, setAuthenticated, setMobile } from '../utils/appState';
import { requestOtp, verifyOtp } from '../services/api';
import { t } from '../utils/i18n';
import './Page.css';

export default function LoginPage() {
    const navigate = useNavigate();

    const [mobile, setMobileInput] = useState('');
    const [otp, setOtp] = useState('');
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [otpRequested, setOtpRequested] = useState(false);
    const [devOtp, setDevOtp] = useState('');

    const role = getRole();
    const language = getLanguage();

    // Redirect to role selection if role is not set.
    useEffect(() => {
        if (!role) navigate('/role');
    }, [navigate, role]);

    // When a dev OTP is received, auto-fill the OTP input immediately.
    useEffect(() => {
        if (devOtp) setOtp(devOtp);
    }, [devOtp]);

    const handleRequestOtp = async () => {
        setLoading(true);
        setError('');
        setStatus('');
        setOtp('');
        setDevOtp('');

        try {
            const data = await requestOtp(mobile.trim(), role, language);
            setOtpRequested(true);
            if (data.otp_code) {
                setDevOtp(data.otp_code);
            }
            setStatus(t('otpSent'));
        } catch (err) {
            setError(err?.response?.data?.detail || err.message || t('failedOtp'));
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        setLoading(true);
        setError('');
        setStatus('');

        try {
            await verifyOtp(mobile.trim(), role, otp.trim());
            setMobile(mobile.trim());
            setAuthenticated(true);
            navigate(role === 'expert' ? '/expert-chat' : '/chat');
        } catch (err) {
            setError(err?.response?.data?.detail || err.message || t('failedVerify'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="page shell">
            <motion.section
                className="card"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <p className="eyebrow">
                    {t('stepThree')} · {t('loginMode')}: {role === 'expert' ? t('expert') : t('farmer')}
                </p>
                <h1>{t('signInOtp')}</h1>
                <p className="subtitle">{t('language')}: {language}</p>

                <div className="form-stack">
                    {/* ── Mobile number field ── */}
                    <label className="field-label">
                        <span className="icon-label"><MdPhoneAndroid /> {t('mobileNumber')}</span>
                        <input
                            type="tel"
                            inputMode="numeric"
                            value={mobile}
                            onChange={(e) => setMobileInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            placeholder={t('mobilePlaceholder')}
                            maxLength={10}
                            disabled={otpRequested}
                        />
                    </label>

                    {/* ── Request / Resend OTP button ── */}
                    <button
                        className="button primary"
                        type="button"
                        onClick={handleRequestOtp}
                        disabled={loading || mobile.trim().length < 10}
                    >
                        {loading && !otpRequested
                            ? t('sendingOtp')
                            : otpRequested
                                ? <><MdRefresh style={{ verticalAlign: 'middle' }} /> {t('resendOtp') || 'Resend OTP'}</>
                                : t('requestOtp')
                        }
                    </button>

                    {/* ── OTP section — visible after first OTP request ── */}
                    <AnimatePresence>
                        {otpRequested && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.3 }}
                                style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
                            >
                                {/* Dev OTP banner — shown prominently so you can see the code */}
                                {devOtp && (
                                    <div className="notice info" style={{ textAlign: 'center' }}>
                                        <span className="icon-label">
                                            <MdSecurity />
                                            <strong>Your OTP: {devOtp}</strong>
                                        </span>
                                        <small style={{ display: 'block', marginTop: 4, opacity: 0.75 }}>
                                            (auto-filled below — remove in production)
                                        </small>
                                    </div>
                                )}

                                {/* OTP input — auto-filled from devOtp */}
                                <label className="field-label">
                                    <span className="icon-label"><MdSms /> {t('otpCode')}</span>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder={t('otpPlaceholder')}
                                        maxLength={6}
                                        autoFocus
                                    />
                                </label>

                                <button
                                    className="button primary"
                                    type="button"
                                    onClick={handleVerifyOtp}
                                    disabled={loading || otp.trim().length < 6}
                                >
                                    {loading ? t('verifying') : t('verifyOtp')}
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ── Status and error notices ── */}
                {status && <div className="notice success">{status}</div>}
                {error && <div className="notice error">{error}</div>}

                <button
                    className="button secondary"
                    type="button"
                    onClick={() => navigate('/role')}
                    style={{ marginTop: 16 }}
                >
                    {t('changeRole')}
                </button>
            </motion.section>
        </main>
    );
}
