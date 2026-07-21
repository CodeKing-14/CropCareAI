import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GiPlantRoots } from 'react-icons/gi';
import heroImage from '../assets/hero.svg';
import { t } from '../utils/i18n';
import './Page.css';

export default function SplashScreen() {
    const navigate = useNavigate();

    useEffect(() => {
        const timer = window.setTimeout(() => navigate('/language'), 3500);
        return () => window.clearTimeout(timer);
    }, [navigate]);

    return (
        <main className="page shell flex items-center justify-center">
            <motion.section
                className="hero-card"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
            >
                <motion.div
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                >
                    <p className="eyebrow splash-logo">
                        <GiPlantRoots /> {t('appName')}
                    </p>
                    <h1>{t('splashTitle')}</h1>
                    <p className="subtitle">{t('splashSubtitle')}</p>
                </motion.div>

                <motion.img
                    className="hero-illustration"
                    src={heroImage}
                    alt="Agriculture illustration with crops and farmland"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, duration: 0.7 }}
                />

                <motion.div
                    className="actions-row"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                >
                    <button className="button primary" type="button" onClick={() => navigate('/language')}>
                        {t('startNow')}
                    </button>
                </motion.div>

                <div className="progress-dots" aria-hidden="true">
                    <span className="progress-dot active" />
                    <span className="progress-dot" style={{ animationDelay: '0.2s' }} />
                    <span className="progress-dot" style={{ animationDelay: '0.4s' }} />
                </div>
            </motion.section>
        </main>
    );
}
