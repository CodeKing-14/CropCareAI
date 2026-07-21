import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MdPhoneAndroid, MdSms } from 'react-icons/md';
import { getRole, getLanguage, setAuthenticated } from '../utils/appState';
import { requestOtp, verifyOtp } from '../services/api';
import './Page.css';

export default function LoginPage() {
    const navigate = useNavigate();
    const [mobile, setMobile] = useState('');
    const [otp, setOtp] = useState('');
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [otpRequested, setOtpRequested] = useState(false);

    const role = getRole();
    const language = getLanguage();

    useEffect(() => {
        if (!role) {
            navigate('/role');
        }
    }, [navigate, role]);

    const handleRequestOtp = async () => {
        setLoading(true);
        setError('');
        setStatus('');

        try {
            await requestOtp(mobile.trim(), role, language);
            setOtpRequested(true);
            setStatus('OTP sent. Check your phone and enter the code below.');
        } catch (err) {
            setError(err?.response?.data?.detail || err.message || 'Failed to send OTP');
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
            setAuthenticated(true);
            navigate(role === 'expert' ? '/expert-chat' : '/chat');
        } catch (err) {
            setError(err?.response?.data?.detail || err.message || 'OTP verification failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="page shell">
            <motion.section className="card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
                <p className="eyebrow">Login mode: {role || 'Unknown'}</p>
                <h1>Sign in with OTP</h1>
                <p className="subtitle">Language: {language || 'English'}</p>

                <label className="field-label">
                    <span className="icon-label"><MdPhoneAndroid /> Mobile number</span>
                    <input
                        value={mobile}
                        onChange={(event) => setMobile(event.target.value)}
                        placeholder="Enter mobile number"
                    />
                </label>

                <button className="button primary" type="button" onClick={handleRequestOtp} disabled={loading || !mobile.trim()}>
                    {loading ? 'Sending OTP…' : 'Request OTP'}
                </button>

                {otpRequested && (
                    <label className="field-label">
                        <span className="icon-label"><MdSms /> OTP code</span>
                        <input
                            value={otp}
                            onChange={(event) => setOtp(event.target.value)}
                            placeholder="Enter received OTP"
                        />
                    </label>
                )}

                {otpRequested && (
                    <button className="button primary" type="button" onClick={handleVerifyOtp} disabled={loading || !otp.trim()}>
                        {loading ? 'Verifying…' : 'Verify OTP'}
                    </button>
                )}

                {status && <div className="notice success">{status}</div>}
                {error && <div className="notice error">{error}</div>}

                <button className="button secondary" type="button" onClick={() => navigate('/role')}>
                    Change role
                </button>
            </motion.section>
        </main>
    );
}
