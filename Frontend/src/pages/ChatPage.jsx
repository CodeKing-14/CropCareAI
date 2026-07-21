import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaImage, FaMicrophone, FaPaperPlane, FaStop } from 'react-icons/fa';
import { getLanguage, getRole, isAuthenticated, logout } from '../utils/appState';
import { predictImage, sendChatMessage, transcribeAudio } from '../services/api';
import './Page.css';

export default function ChatPage() {
    const navigate = useNavigate();
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);
    const [imageFile, setImageFile] = useState(null);
    const [prediction, setPrediction] = useState(null);
    const [chatInput, setChatInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [recording, setRecording] = useState(false);
    const [loadingPrediction, setLoadingPrediction] = useState(false);
    const [loadingAudio, setLoadingAudio] = useState(false);
    const [loadingChat, setLoadingChat] = useState(false);
    const [error, setError] = useState('');

    const language = getLanguage();
    const role = getRole();

    useEffect(() => {
        if (!isAuthenticated() || role !== 'farmer') {
            navigate('/login');
        }
    }, [navigate, role]);

    const handleImageFile = async (file) => {
        if (!file) return;
        setImageFile(file);
        setLoadingPrediction(true);
        setError('');
        setPrediction(null);

        try {
            const data = await predictImage(file);
            setPrediction(data);
            setMessages((items) => [
                ...items,
                { sender: 'system', text: `Prediction: ${data.disease} (${Number(data.confidence).toFixed(1)}% confidence)` },
            ]);
        } catch (err) {
            setError(err?.response?.data?.detail || err.message || 'Prediction failed.');
        } finally {
            setLoadingPrediction(false);
        }
    };

    const handleDrop = (event) => {
        event.preventDefault();
        handleImageFile(event.dataTransfer.files?.[0]);
    };

    const handleRecord = async () => {
        if (recording) {
            mediaRecorderRef.current?.stop();
            return;
        }

        if (!navigator.mediaDevices?.getUserMedia) {
            setError('Voice recording is not supported in this browser.');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            recordedChunksRef.current = [];

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunksRef.current.push(event.data);
                }
            };

            recorder.onstop = async () => {
                stream.getTracks().forEach((track) => track.stop());
                setRecording(false);
                const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
                const file = new File([blob], 'voice-report.webm', { type: 'audio/webm' });
                await handleAudioFile(file);
            };

            mediaRecorderRef.current = recorder;
            recorder.start();
            setRecording(true);
        } catch (err) {
            setError(err.message || 'Could not start voice recording.');
        }
    };

    const handleAudioFile = async (file) => {
        if (!file) return;
        setLoadingAudio(true);
        setError('');

        try {
            const data = await transcribeAudio(file, language);
            setChatInput(data.text);
            setMessages((items) => [...items, { sender: 'system', text: `Voice text: ${data.text}` }]);
        } catch (err) {
            setError(err?.response?.data?.detail || err.message || 'Transcription failed.');
        } finally {
            setLoadingAudio(false);
        }
    };

    const handleSend = async (event) => {
        event.preventDefault();
        const text = chatInput.trim();
        if (!text && !prediction) {
            setError('Enter a message, record voice, or upload a plant image first.');
            return;
        }

        setLoadingChat(true);
        setError('');
        setMessages((items) => [...items, { sender: 'farmer', text: text || 'Please advise based on the uploaded image.' }]);
        setChatInput('');

        try {
            const data = await sendChatMessage({
                message: text,
                disease: prediction?.disease,
                confidence: prediction?.confidence,
                language,
            });
            setMessages((items) => [...items, { sender: 'ai', text: data.ai_response, details: data }]);
        } catch (err) {
            setError(err?.response?.data?.detail || err.message || 'Chat request failed.');
        } finally {
            setLoadingChat(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <main className="page shell">
            <motion.section className="card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
                <div className="card-header">
                    <div>
                        <p className="eyebrow">Farmer dashboard</p>
                        <h1>AI crop chat</h1>
                        <p className="subtitle">Language: {language}</p>
                    </div>
                    <div className="action-group">
                        <button className="button secondary" type="button" onClick={() => navigate('/report')}>Reports</button>
                        <button className="button secondary" type="button" onClick={handleLogout}>Logout</button>
                    </div>
                </div>

                <div
                    className="drop-zone"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={handleDrop}
                >
                    <FaImage className="drop-icon" />
                    <strong>{imageFile ? imageFile.name : 'Drop plant image here'}</strong>
                    <span>or choose an image from your device</span>
                    <input type="file" accept="image/*" onChange={(event) => handleImageFile(event.target.files?.[0])} />
                    {loadingPrediction && <p>Predicting disease...</p>}
                </div>

                {prediction && (
                    <div className="result-card">
                        <h2>Prediction result</h2>
                        <p><strong>Disease:</strong> {prediction.disease}</p>
                        <p><strong>Confidence:</strong> {Number(prediction.confidence).toFixed(1)}%</p>
                    </div>
                )}

                <div className="chat-window">
                    {messages.map((message, index) => (
                        <article className={`chat-bubble ${message.sender}`} key={`${message.sender}-${index}`}>
                            <p>{message.text}</p>
                            {message.details && (
                                <div className="advice-grid">
                                    <p><strong>Medicine:</strong> {message.details.medicine_recommendation}</p>
                                    <p><strong>Treatment:</strong> {message.details.treatment_steps.join(' ')}</p>
                                    <p><strong>Precautions:</strong> {message.details.precautions.join(' ')}</p>
                                </div>
                            )}
                        </article>
                    ))}
                </div>

                <form className="chat-form" onSubmit={handleSend}>
                    <button className="icon-button" type="button" onClick={handleRecord} disabled={loadingAudio} title="Record voice">
                        {recording ? <FaStop /> : <FaMicrophone />}
                    </button>
                    <input
                        value={chatInput}
                        onChange={(event) => setChatInput(event.target.value)}
                        placeholder={loadingAudio ? 'Transcribing voice...' : 'Type crop question or use voice'}
                    />
                    <button className="icon-button primary-icon" type="submit" disabled={loadingChat} title="Send message">
                        <FaPaperPlane />
                    </button>
                </form>

                {error && <div className="notice error">{error}</div>}
            </motion.section>
        </main>
    );
}
