import { useNavigate } from 'react-router-dom';
import './Page.css';

export default function SplashScreen() {
    const navigate = useNavigate();

    return (
        <main className="page shell">
            <section className="hero-card">
                <div>
                    <p className="eyebrow">CropCare AI</p>
                    <h1>Smart crop help for farmers and experts</h1>
                    <p className="subtitle">
                        Identify crop diseases, transcribe voice reports, and review prediction history.
                    </p>
                </div>

                <div className="actions-row">
                    <button className="button primary" onClick={() => navigate('/language')}>
                        Start now
                    </button>
                    <button className="button secondary" onClick={() => navigate('/report')}>
                        View reports
                    </button>
                </div>
            </section>
        </main>
    );
}
