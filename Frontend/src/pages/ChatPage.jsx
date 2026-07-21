import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaImage, FaMicrophone, FaPaperPlane, FaStop, FaUserMd } from 'react-icons/fa';
import { getLanguage, getRole, isAuthenticated, logout } from '../utils/appState';
import { predictImage, sendChatMessage, transcribeAudio } from '../services/api';
import { t } from '../utils/i18n';
import './Page.css';

export default function ChatPage() {
    const navigate = useNavigate();
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);
    const chatEndRef = useRef(null);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [prediction, setPrediction] = useState(null);
    const [chatInput, setChatInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [recording, setRecording] = useState(false);
    const [dragActive, setDragActive] = useState(false);
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

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        return () => {
            if (imagePreview) URL.revokeObjectURL(imagePreview);
        };
    }, [imagePreview]);

    const handleImageFile = async (file) => {
        if (!file) return;
        setImageFile(file);
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImagePreview(URL.createObjectURL(file));
        setLoadingPrediction(true);
        setError('');
        setPrediction(null);

        try {
            const data = await predictImage(file);
            setPrediction(data);
            setMessages((items) => [
                ...items,
                {
                    sender: 'system',
                    text: `${t('predictionResult')}: ${data.disease} (${Number(data.confidence).toFixed(1)}% ${t('confidenceLabel')})`,
                },
            ]);
        } catch (err) {
            setError(err?.response?.data?.detail || err.message || t('failedPrediction'));
        } finally {
            setLoadingPrediction(false);
        }
    };

    const handleDrop = (event) => {
        event.preventDefault();
        setDragActive(false);
        handleImageFile(event.dataTransfer.files?.[0]);
    };

    const handleRecord = async () => {
        if (recording) {
            mediaRecorderRef.current?.stop();
            return;
        }

        if (!navigator.mediaDevices?.getUserMedia) {
            setError(t('voiceUnsupported'));
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
            setError(err.message || t('voiceUnsupported'));
        }
    };

    const handleAudioFile = async (file) => {
        if (!file) return;
        setLoadingAudio(true);
        setError('');

        try {
            const data = await transcribeAudio(file, language);
            setChatInput(data.text);
            setMessages((items) => [...items, { sender: 'system', text: data.text }]);
        } catch (err) {
            setError(err?.response?.data?.detail || err.message || t('failedTranscription'));
        } finally {
            setLoadingAudio(false);
        }
    };

    const handleSend = async (event) => {
        event.preventDefault();
        const text = chatInput.trim();
        if (!text && !prediction) {
            setError(t('enterMessage'));
            return;
        }

        setLoadingChat(true);
        setError('');
        setMessages((items) => [...items, { sender: 'farmer', text: text || t('typeQuestion') }]);
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
            setError(err?.response?.data?.detail || err.message || t('failedChat'));
        } finally {
            setLoadingChat(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <main className="page shell-wide">
            <motion.section
                className="card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
            >
                <div className="card-header">
                    <div>
                        <p className="eyebrow">{t('farmerDashboard')}</p>
                        <h1>{t('aiCropChat')}</h1>
                        <p className="subtitle">{t('language')}: {language}</p>
                    </div>
                    <div className="action-group">
                        <button className="button secondary" type="button" onClick={() => navigate('/expert-chat')}>
                            <FaUserMd /> {t('contactExpert')}
                        </button>
                        <button className="button secondary" type="button" onClick={() => navigate('/report')}>
                            {t('reports')}
                        </button>
                        <button className="button secondary" type="button" onClick={handleLogout}>
                            {t('logout')}
                        </button>
                    </div>
                </div>

                <div
                    className={`drop-zone ${dragActive ? 'drag-active' : ''}`}
                    onDragOver={(event) => { event.preventDefault(); setDragActive(true); }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={handleDrop}
                >
                    <FaImage className="drop-icon" />
                    <strong>{dragActive ? t('dragActive') : imageFile ? imageFile.name : t('dropImage')}</strong>
                    <span>{t('chooseImage')}</span>
                    <input type="file" accept="image/*" onChange={(event) => handleImageFile(event.target.files?.[0])} />
                    {imagePreview && <img className="image-preview" src={imagePreview} alt="Uploaded plant" />}
                    {loadingPrediction && <div className="loading-spinner">{t('predictingDisease')}</div>}
                </div>

                {prediction && (
                    <motion.div
                        className="result-card"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h2>{t('predictionResult')}</h2>
                        <p><strong>{t('disease')}:</strong> {prediction.disease}</p>
                        <p><strong>{t('confidence')}:</strong> {Number(prediction.confidence).toFixed(1)}%</p>
                        <div className="confidence-bar">
                            <div className="confidence-fill" style={{ width: `${Math.min(prediction.confidence, 100)}%` }} />
                        </div>
                    </motion.div>
                )}

                <div className="chat-window">
                    {messages.length === 0 && (
                        <div className="empty-state">
                            <FaImage />
                            <p>{t('dropImage')}</p>
                        </div>
                    )}
                    {messages.map((message, index) => (
                        <article className={`chat-bubble ${message.sender}`} key={`${message.sender}-${index}`}>
                            {message.sender === 'ai' && <span className="bubble-meta">{t('aiAssistant')}</span>}
                            {message.sender === 'farmer' && <span className="bubble-meta">{t('you')}</span>}
                            <p>{message.text}</p>
                            {message.details && (
                                <div className="advice-grid">
                                    <div className="advice-item">
                                        <strong>{t('medicine')}</strong>
                                        <p>{message.details.medicine_recommendation}</p>
                                    </div>
                                    <div className="advice-item">
                                        <strong>{t('treatment')}</strong>
                                        <ol>
                                            {message.details.treatment_steps.map((step) => (
                                                <li key={step}>{step}</li>
                                            ))}
                                        </ol>
                                    </div>
                                    <div className="advice-item">
                                        <strong>{t('precautions')}</strong>
                                        <ol>
                                            {message.details.precautions.map((item) => (
                                                <li key={item}>{item}</li>
                                            ))}
                                        </ol>
                                    </div>
                                    {message.details.recovery_advice && (
                                        <div className="advice-item">
                                            <strong>{t('recovery')}</strong>
                                            <p>{message.details.recovery_advice}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </article>
                    ))}
                    <div ref={chatEndRef} />
                </div>

                <form className="chat-form" onSubmit={handleSend}>
                    <button
                        className={`icon-button ${recording ? 'recording' : ''}`}
                        type="button"
                        onClick={handleRecord}
                        disabled={loadingAudio}
                        title={recording ? t('stopRecording') : t('recordVoice')}
                    >
                        {recording ? <FaStop /> : <FaMicrophone />}
                    </button>
                    <input
                        value={chatInput}
                        onChange={(event) => setChatInput(event.target.value)}
                        placeholder={loadingAudio ? t('transcribingVoice') : recording ? t('recording') : t('typeQuestion')}
                        disabled={loadingAudio}
                    />
                    <button className="icon-button primary-icon" type="submit" disabled={loadingChat} title={t('sendMessage')}>
                        <FaPaperPlane />
                    </button>
                </form>

                {error && <div className="notice error">{error}</div>}
            </motion.section>
        </main>
    );
}
