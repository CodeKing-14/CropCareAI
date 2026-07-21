import { useNavigate } from 'react-router-dom';
import { getLanguage, setRole } from '../utils/appState';
import './Page.css';

const roleOptions = [
    { value: 'farmer', label: 'Farmer' },
    { value: 'expert', label: 'Expert' },
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
            <section className="card">
                <p className="eyebrow">Selected language: {language}</p>
                <h1>Who are you?</h1>
                <div className="select-grid">
                    {roleOptions.map((item) => (
                        <button
                            type="button"
                            className="button option"
                            key={item.value}
                            onClick={() => handleSelect(item.value)}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </section>
        </main>
    );
}
