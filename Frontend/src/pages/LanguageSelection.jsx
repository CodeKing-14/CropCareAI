import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { setLanguage } from '../utils/appState';
import { languageOptions, t } from '../utils/i18n';
import './Page.css';

export default function LanguageSelection() {
    const navigate = useNavigate();

    const handleSelect = (language) => {
        setLanguage(language);
        navigate('/role');
    };

    return (
        <main className="page shell">
            <motion.section
                className="card"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <p className="eyebrow">{t('stepOne')}</p>
                <h1>{t('chooseLanguage')}</h1>
                <p className="subtitle">{t('splashSubtitle')}</p>

                <div className="select-grid">
                    {languageOptions.map((option, index) => (
                        <motion.button
                            type="button"
                            className="button option"
                            key={option.value}
                            onClick={() => handleSelect(option.value)}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.06, duration: 0.4 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <span>{option.label}</span>
                            <span className="option-native">{option.native}</span>
                        </motion.button>
                    ))}
                </div>
            </motion.section>
        </main>
    );
}
