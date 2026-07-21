import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaUserTie } from 'react-icons/fa';
import { GiFarmer } from 'react-icons/gi';
import { getLanguage, setRole } from '../utils/appState';
import { t } from '../utils/i18n';
import './Page.css';

const roleOptions = [
    { value: 'farmer', labelKey: 'farmer', icon: GiFarmer },
    { value: 'expert', labelKey: 'expert', icon: FaUserTie },
];

export default function RoleSelection() {
    const navigate = useNavigate();
    const language = getLanguage();

    const handleSelect = (role) => {
        setRole(role);
        navigate('/login');
    };

    return (
        <main className="page shell">
            <motion.section
                className="card"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <p className="eyebrow">{t('stepTwo')} · {t('selectedLanguage')}: {language}</p>
                <h1>{t('whoAreYou')}</h1>
                <p className="subtitle">{t('splashSubtitle')}</p>

                <div className="select-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                    {roleOptions.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <motion.button
                                type="button"
                                className="button option"
                                key={item.value}
                                onClick={() => handleSelect(item.value)}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1, duration: 0.4 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Icon className="option-icon" />
                                {t(item.labelKey)}
                            </motion.button>
                        );
                    })}
                </div>
            </motion.section>
        </main>
    );
}
