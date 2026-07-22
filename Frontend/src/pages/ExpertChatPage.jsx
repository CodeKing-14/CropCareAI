import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaImage, FaMicrophone, FaPaperPlane, FaStop, FaSync, FaComments } from 'react-icons/fa';
import { MdArrowBack } from 'react-icons/md';
import {
    getLanguage,
    getMobile,
    getRole,
    isAuthenticated,
    logout,
} from '../utils/appState';
import {
    getExpertMessages,
    sendExpertImage,
    sendExpertMessage,
    sendExpertVoice,
    transcribeAudio,
} from '../services/api';
import { t } from '../utils/i18n';
import './Page.css';

export default function ExpertChatPage() {
    const navigate = useNavigate();
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);
    const chatEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const [messages, setMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [selectedFarmer, setSelectedFarmer] = useState(null);
    const [recording, setRecording] = useState(false);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [loadingAudio, setLoadingAudio] = useState(false);
    const [error, setError] = useState('');

    const language = getLanguage();
    const role = getRole();
    const mobile = getMobile();

    const loadMessages = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await getExpertMessages();
            setMessages(data);
        } catch (err) {
            setError(err?.response?.data?.detail || err.message || t('failedMessages'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!isAuthenticated()) {
            navigate('/login');
            return;
        }
        loadMessages();
        const interval = window.setInterval(loadMessages, 15000);
        return () => window.clearInterval(interval);
    }, [navigate, loadMessages]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendText = async (event) => {
        event.preventDefault();
        const text = chatInput.trim();
        if (!text) return;

        setSending(true);
        setError('');
        try {
            const message = await sendExpertMessage({
                sender_role: role,
                sender_mobile: mobile,
                recipient_mobile: role === 'expert' ? selectedFarmer : null,
                content: text,
            });
            setMessages((items) => [...items, message]);
            setChatInput('');
        } catch (err) {
            setError(err?.response?.data?.detail || err.message || t('failedSend'));
        } finally {
            setSending(false);
        }
    };

    const handleImageUpload = async (file) => {
        if (!file) return;
        setSending(true);
        setError('');
        try {
            const message = await sendExpertImage(role, mobile, file);
            setMessages((items) => [...items, message]);
        } catch (err) {
            setError(err?.response?.data?.detail || err.message || t('failedSend'));
        } finally {
            setSending(false);
        }
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
                if (event.data.size > 0) recordedChunksRef.current.push(event.data);
            };

            recorder.onstop = async () => {
                stream.getTracks().forEach((track) => track.stop());
                setRecording(false);
                const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
                const file = new File([blob], 'voice-message.webm', { type: 'audio/webm' });

                setLoadingAudio(true);
                setError('');
                try {
                    let transcription = '';
                    try {
                        const data = await transcribeAudio(file, language);
                        transcription = data.text;
                        setChatInput(data.text);
                    } catch {
                        transcription = '';
                    }
                    const message = await sendExpertVoice(role, mobile, file, transcription);
                    setMessages((items) => [...items, message]);
                } catch (err) {
                    setError(err?.response?.data?.detail || err.message || t('failedSend'));
                } finally {
                    setLoadingAudio(false);
                }
            };

            mediaRecorderRef.current = recorder;
            recorder.start();
            setRecording(true);
        } catch (err) {
            setError(err.message || t('voiceUnsupported'));
        }
    };

    const renderMessageContent = (message) => {
        if (message.message_type === 'image') {
            const filename = message.content.split(/[/\\]/).pop();
            return (
                <div>
                    <span className="bubble-meta">{t('imageSharing')}</span>
                    <p>{t('imageUploaded')}: {filename}</p>
                </div>
            );
        }
        if (message.message_type === 'voice') {
            return (
                <div>
                    <span className="bubble-meta">{t('voiceMessage')}</span>
                    <p>{message.content}</p>
                </div>
            );
        }
        return <p>{message.content}</p>;
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
                        <p className="eyebrow">{role === 'expert' ? t('expertDashboard') : t('farmerDashboard')}</p>
                        <h1>{t('expertSupport')}</h1>
                        <p className="subtitle">{t('expertSubtitle')}</p>
                    </div>
                    <div className="action-group">
                        {role === 'farmer' && (
                            <button className="button secondary" type="button" onClick={() => navigate('/chat')}>
                                <MdArrowBack /> {t('backToAi')}
                            </button>
                        )}
                        <button className="button secondary" type="button" onClick={loadMessages} disabled={loading}>
                            <FaSync /> {t('refresh')}
                        </button>
                        <button className="button secondary" type="button" onClick={() => navigate('/report')}>
                            {t('reports')}
                        </button>
                        <button className="button secondary" type="button" onClick={() => { logout(); navigate('/'); }}>
                            {t('logout')}
                        </button>
                    </div>
                </div>

                <div className="feature-pills">
                    <span className="feature-pill"><FaComments /> {t('textMessaging')}</span>
                    <span className="feature-pill"><FaImage /> {t('imageSharing')}</span>
                    <span className="feature-pill"><FaMicrophone /> {t('voiceRecording')}</span>
                </div>

                <p className="subtitle">{t('readyExpert')}</p>

                {role === 'expert' && (
                    <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', overflowX: 'auto' }}>
                        {[...new Set(messages.map(m => m.sender_role === 'farmer' ? m.sender_mobile : m.recipient_mobile).filter(Boolean))].map(farmerMobile => (
                            <button 
                                key={farmerMobile}
                                className={`button ${selectedFarmer === farmerMobile ? 'primary' : 'secondary'}`}
                                onClick={() => setSelectedFarmer(farmerMobile)}
                                type="button"
                                style={{ padding: '6px 12px', borderRadius: '16px' }}
                            >
                                Farmer: {farmerMobile}
                            </button>
                        ))}
                    </div>
                )}

                <div className="chat-window">
                    {loading && messages.length === 0 && (
                        <div className="loading-spinner">{t('loadingMessages')}</div>
                    )}
                    {!loading && messages.length === 0 && (
                        <div className="empty-state">
                            <FaComments />
                            <p>{t('noMessages')}</p>
                        </div>
                    )}
                    {messages
                        .filter(m => role === 'farmer' || !selectedFarmer || m.sender_mobile === selectedFarmer || m.recipient_mobile === selectedFarmer)
                        .map((message) => (
                        <article
                            className={`chat-bubble ${message.sender_role === role ? 'user' : message.sender_role}`}
                            key={message.id}
                        >
                            <span className="bubble-meta">
                                {message.sender_role === 'farmer' ? t('farmer') : t('expert')} · {message.sender_mobile}
                            </span>
                            {renderMessageContent(message)}
                        </article>
                    ))}
                    <div ref={chatEndRef} />
                </div>

                <form className="chat-form" onSubmit={handleSendText}>
                    <button
                        className="icon-button"
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={sending}
                        title={t('sendImage')}
                    >
                        <FaImage />
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(event) => {
                            handleImageUpload(event.target.files?.[0]);
                            event.target.value = '';
                        }}
                    />
                    <button
                        className={`icon-button ${recording ? 'recording' : ''}`}
                        type="button"
                        onClick={handleRecord}
                        disabled={loadingAudio || sending}
                        title={recording ? t('stopRecording') : t('recordVoice')}
                    >
                        {recording ? <FaStop /> : <FaMicrophone />}
                    </button>
                    <input
                        value={chatInput}
                        onChange={(event) => setChatInput(event.target.value)}
                        placeholder={loadingAudio ? t('transcribingVoice') : t('expertPlaceholder')}
                        disabled={loadingAudio}
                    />
                    <button 
                        className="icon-button primary-icon" 
                        type="submit" 
                        disabled={sending || !chatInput.trim() || (role === 'expert' && !selectedFarmer)} 
                        title={t('sendMessage')}
                    >
                        <FaPaperPlane />
                    </button>
                </form>

                {error && <div className="notice error">{error}</div>}
            </motion.section>
        </main>
    );
}
