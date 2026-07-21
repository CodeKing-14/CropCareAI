import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRole, isAuthenticated, logout } from '../utils/appState';
import './Page.css';

export default function ExpertChatPage() {
    const navigate = useNavigate();
    const role = getRole();

    useEffect(() => {
        if (!isAuthenticated() || role !== 'expert') {
            navigate('/login');
        }
    }, [navigate, role]);

    return (
        <main className="page shell">
            <section className="card">
                <div className="card-header">
                    <div>
                        <p className="eyebrow">Expert dashboard</p>
                        <h1>Expert support center</h1>
                        <p className="subtitle">Review reports and give advice to farmers.</p>
                    </div>
                    <div className="action-group">
                        <button className="button secondary" type="button" onClick={() => navigate('/report')}>
                            Reports
                        </button>
                        <button className="button secondary" type="button" onClick={() => { logout(); navigate('/'); }}>
                            Logout
                        </button>
                    </div>
                </div>

                <div className="message-block">
                    <p>
                        This expert interface is ready for integration with a chat backend.
                        Use this screen to review crop images, examine predictions, and reply to farmers.
                    </p>
                </div>
            </section>
        </main>
    );
}
