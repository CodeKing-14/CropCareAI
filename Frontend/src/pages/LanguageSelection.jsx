import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { setLanguage } from '../utils/appState';
import './Page.css';

const languageOptions = [
    'English',
    'Tamil',
    'Hindi',
    'Telugu',
    'Malayalam',
    'Marathi',
];

export default function LanguageSelection() {
    const navigate = useNavigate();

    const handleSelect = (language) => {
        setLanguage(language);
        navigate('/role');
    };

    return (
        <main className="page shell">
            <motion.section className="card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
                <p className="eyebrow">Step 1 of 3</p>
                <h1>Choose your language</h1>
                <div className="select-grid">
                    {languageOptions.map((language) => (
                        <button
                            type="button"
                            className="button option"
                            key={language}
                            onClick={() => handleSelect(language)}
                        >
                            {language}
                        </button>
                    ))}
                </div>
            </motion.section>
        </main>
    );
}
