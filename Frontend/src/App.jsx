import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import SplashScreen from './pages/SplashScreen';
import LanguageSelection from './pages/LanguageSelection';
import RoleSelection from './pages/RoleSelection';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import ExpertChatPage from './pages/ExpertChatPage';
import ReportPage from './pages/ReportPage';
import './App.css';

function AnimatedRoutes() {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
                <Routes location={location}>
                    <Route path="/" element={<SplashScreen />} />
                    <Route path="/language" element={<LanguageSelection />} />
                    <Route path="/role" element={<RoleSelection />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/chat" element={<ChatPage />} />
                    <Route path="/expert-chat" element={<ExpertChatPage />} />
                    <Route path="/report" element={<ReportPage />} />
                </Routes>
            </motion.div>
        </AnimatePresence>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AnimatedRoutes />
        </BrowserRouter>
    );
}

export default App;
