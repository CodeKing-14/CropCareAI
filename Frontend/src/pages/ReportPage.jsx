import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaLeaf, FaClock } from 'react-icons/fa';
import { MdArrowBack } from 'react-icons/md';
import { getLanguage, getRole, isAuthenticated } from '../utils/appState';
import { getPredictionHistory } from '../services/api';
import { t } from '../utils/i18n';
import './Page.css';

function confidenceClass(confidence) {
    if (confidence >= 80) return 'confidence-high';
    if (confidence >= 50) return 'confidence-mid';
    return 'confidence-low';
}

function formatDate(value) {
    try {
        return new Date(value).toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
        });
    } catch {
        return value;
    }
}

export default function ReportPage() {
    const navigate = useNavigate();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const language = getLanguage();
    const role = getRole();

    useEffect(() => {
        if (!isAuthenticated()) {
            navigate('/login');
            return;
        }

        async function loadReports() {
            setLoading(true);
            setError('');
            try {
                const data = await getPredictionHistory();
                setReports(data);
            } catch (err) {
                setError(err?.response?.data?.detail || err.message || t('failedMessages'));
            } finally {
                setLoading(false);
            }
        }

        loadReports();
    }, [navigate]);

    return (
        <main className="page shell-wide">
            <motion.section
                className="card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
            >
                <div className="card-header">
                    <div>
                        <p className="eyebrow">{t('predictionReports')}</p>
                        <h1>{t('latestReports')}</h1>
                        <p className="subtitle">{t('role')}: {role === 'expert' ? t('expert') : t('farmer')} · {t('language')}: {language}</p>
                    </div>
                    <div className="action-group">
                        <button
                            className="button secondary"
                            type="button"
                            onClick={() => navigate(role === 'expert' ? '/expert-chat' : '/chat')}
                        >
                            <MdArrowBack /> {t('dashboard')}
                        </button>
                    </div>
                </div>

                {loading && <div className="loading-spinner">{t('loadingReports')}</div>}
                {error && <div className="notice error">{error}</div>}

                {!loading && !error && reports.length === 0 && (
                    <div className="empty-state">
                        <FaLeaf />
                        <p>{t('noReports')}</p>
                    </div>
                )}

                {!loading && reports.length > 0 && (
                    <div className="report-grid">
                        {reports.map((item, index) => (
                            <motion.article
                                key={item.id}
                                className="report-card"
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05, duration: 0.35 }}
                            >
                                <h2>{item.predicted_disease}</h2>
                                <p>{item.image_name.split(/[/\\]/).pop()}</p>
                                <div className="report-meta">
                                    <span className={`report-badge ${confidenceClass(item.confidence)}`}>
                                        {Number(item.confidence).toFixed(1)}% {t('confidenceLabel')}
                                    </span>
                                    <span className="report-badge">
                                        <FaClock /> {formatDate(item.created_at)}
                                    </span>
                                </div>
                                <div className="confidence-bar" style={{ marginTop: 14 }}>
                                    <div
                                        className="confidence-fill"
                                        style={{ width: `${Math.min(item.confidence, 100)}%` }}
                                    />
                                </div>
                            </motion.article>
                        ))}
                    </div>
                )}
            </motion.section>
        </main>
    );
}
