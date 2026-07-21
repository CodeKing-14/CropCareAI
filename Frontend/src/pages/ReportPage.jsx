import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLanguage, getRole, isAuthenticated } from '../utils/appState';
import './Page.css';

const sampleReports = [
    {
        id: 1,
        title: 'Healthy crop check',
        summary: 'Review results and recommended soil moisture checks.',
        updatedAt: 'Today',
    },
    {
        id: 2,
        title: 'Pest and disease alert',
        summary: 'A nearby field shows early leaf spot symptoms.',
        updatedAt: 'Yesterday',
    },
];

export default function ReportPage() {
    const navigate = useNavigate();
    const [reports] = useState(sampleReports);
    const language = getLanguage();
    const role = getRole();

    useEffect(() => {
        if (!isAuthenticated()) {
            navigate('/login');
        }
    }, [navigate]);

    return (
        <main className="page shell">
            <section className="card">
                <div className="card-header">
                    <div>
                        <p className="eyebrow">Prediction reports</p>
                        <h1>Review your latest reports</h1>
                        <p className="subtitle">Role: {role || 'Unknown'} · Language: {language || 'English'}</p>
                    </div>
                    <div className="action-group">
                        <button className="button secondary" type="button" onClick={() => navigate(role === 'expert' ? '/expert-chat' : '/chat')}>
                            Dashboard
                        </button>
                    </div>
                </div>

                <div className="report-grid">
                    {reports.map((item) => (
                        <article key={item.id} className="report-card">
                            <h2>{item.title}</h2>
                            <p>{item.summary}</p>
                            <span>{item.updatedAt}</span>
                        </article>
                    ))}
                </div>
            </section>
        </main>
    );
}
