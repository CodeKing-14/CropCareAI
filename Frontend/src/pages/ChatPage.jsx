import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLanguage, getRole, isAuthenticated, logout } from '../utils/appState';
import { predictImage, transcribeAudio } from '../services/api';
import './Page.css';

export default function ChatPage() {
    const navigate = useNavigate();
    const [imageFile, setImageFile] = useState(null);
    const [audioFile, setAudioFile] = useState(null);
    const [prediction, setPrediction] = useState(null);
    const [transcription, setTranscription] = useState(null);
    const [loadingPrediction, setLoadingPrediction] = useState(false);
    const [loadingAudio, setLoadingAudio] = useState(false);
    const [error, setError] = useState('');

    const language = getLanguage();
    const role = getRole();

    useEffect(() => {
        if (!isAuthenticated() || role !== 'farmer') {
            navigate('/login');
        }
    }, [navigate, role]);

    const handleImageSubmit = async (event) => {
        event.preventDefault();
        if (!imageFile) {
            setError('Please choose an image first.');
            return;
        }

        setLoadingPrediction(true);
        setError('');
        setPrediction(null);

        try {
            const data = await predictImage(imageFile);
            setPrediction(data);
        } catch (err) {
            setError(err?.response?.data?.detail || err.message || 'Prediction failed.');
        } finally {
            setLoadingPrediction(false);
        }
    };

    const handleAudioSubmit = async (event) => {
        event.preventDefault();
        if (!audioFile) {
            setError('Please choose an audio file first.');
            return;
        }

        setLoadingAudio(true);
        setError('');
        setTranscription(null);

        try {
            const data = await transcribeAudio(audioFile);
            setTranscription(data);
        } catch (err) {
            setError(err?.response?.data?.detail || err.message || 'Transcription failed.');
        } finally {
            setLoadingAudio(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <main className="page shell">
            <section className="card">
                <div className="card-header">
                    <div>
                        <p className="eyebrow">Farmer dashboard</p>
                        <h1>Crop prediction and voice report</h1>
                        <p className="subtitle">Language: {language}</p>
                    </div>
                    <div className="action-group">
                        <button className="button secondary" type="button" onClick={() => navigate('/report')}>
                            Reports
                        </button>
                        <button className="button secondary" type="button" onClick={handleLogout}>
                            Logout
                        </button>
                    </div>
                </div>

                <form className="form-stack" onSubmit={handleImageSubmit}>
                    <label className="field-label">
                        Upload crop image
                        <input type="file" accept="image/*" onChange={(event) => setImageFile(event.target.files?.[0] || null)} />
                    </label>
                    <button className="button primary" type="submit" disabled={loadingPrediction}>
                        {loadingPrediction ? 'Predicting…' : 'Predict disease'}
                    </button>
                </form>

                <form className="form-stack" onSubmit={handleAudioSubmit}>
                    <label className="field-label">
                        Upload voice report
                        <input type="file" accept="audio/*" onChange={(event) => setAudioFile(event.target.files?.[0] || null)} />
                    </label>
                    <button className="button primary" type="submit" disabled={loadingAudio}>
                        {loadingAudio ? 'Transcribing…' : 'Transcribe voice'}
                    </button>
                </form>

                {prediction && (
                    <div className="result-card">
                        <h2>Prediction result</h2>
                        <p>
                            <strong>Disease:</strong> {prediction.disease}
                        </p>
                        <p>
                            <strong>Confidence:</strong> {(prediction.confidence * 100).toFixed(1)}%
                        </p>
                    </div>
                )}

                {transcription && (
                    <div className="result-card">
                        <h2>Transcription result</h2>
                        <p>{transcription.text}</p>
                        <p>
                            <strong>Detected language:</strong> {transcription.language}
                        </p>
                    </div>
                )}

                {error && <div className="notice error">{error}</div>}
            </section>
        </main>
    );
}
