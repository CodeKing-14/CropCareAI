import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GiPlantRoots } from 'react-icons/gi';
import heroImage from '../assets/hero.png';
import './Page.css';

export default function SplashScreen() {
    const navigate = useNavigate();

    useEffect(() => {
        const timer = window.setTimeout(() => navigate('/language'), 3500);
        return () => window.clearTimeout(timer);
    }, [navigate]);

    return (
        <main className="page shell">
            <motion.section
                className="hero-card"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
            >
                <div>
                    <p className="eyebrow icon-label"><GiPlantRoots /> CropCare AI</p>
                    <h1>Smart crop help for farmers and experts</h1>
                    <p className="subtitle">
                        Identify crop diseases, transcribe voice reports, and review prediction history.
                    </p>
                </div>

                <img className="hero-illustration" src={heroImage} alt="Healthy crop illustration" />

                <div className="actions-row">
                    <button className="button primary" onClick={() => navigate('/language')}>
                        Start now
                    </button>
                    <button className="button secondary" onClick={() => navigate('/report')}>
                        View reports
                    </button>
                </div>
            </motion.section>
        </main>
    );
}
