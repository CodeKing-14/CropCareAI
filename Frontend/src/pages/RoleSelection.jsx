import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaUserTie } from 'react-icons/fa';
import { GiFarmer } from 'react-icons/gi';
import { getLanguage, setRole } from '../utils/appState';
import './Page.css';

const roleOptions = [
    { value: 'farmer', label: 'Farmer', icon: GiFarmer },
    { value: 'expert', label: 'Agriculture Expert', icon: FaUserTie },
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
            <motion.section className="card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
                <p className="eyebrow">Selected language: {language}</p>
                <h1>Who are you?</h1>
                <div className="select-grid">
                    {roleOptions.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                type="button"
                                className="button option"
                                key={item.value}
                                onClick={() => handleSelect(item.value)}
                            >
                                <Icon className="option-icon" />
                                {item.label}
                            </button>
                        );
                    })}
                </div>
            </motion.section>
        </main>
    );
}
