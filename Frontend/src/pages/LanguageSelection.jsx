import { useNavigate } from 'react-router-dom';
import { setLanguage } from '../utils/appState';
import './Page.css';

const languageOptions = [
    { value: 'English', label: 'English' },
    { value: 'Hindi', label: 'हिन्दी' },
    { value: 'Kannada', label: 'ಕನ್ನಡ' },
];

export default function LanguageSelection() {
    const navigate = useNavigate();

    const handleSelect = (language) => {
        setLanguage(language);
        navigate('/role');
    };

    return (
        <main className="page shell">
            <section className="card">
                <p className="eyebrow">Step 1 of 3</p>
                <h1>Choose your language</h1>
                <div className="select-grid">
                    {languageOptions.map((item) => (
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
