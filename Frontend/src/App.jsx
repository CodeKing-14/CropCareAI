import { BrowserRouter, Route, Routes } from 'react-router-dom';
import SplashScreen from './pages/SplashScreen';
import LanguageSelection from './pages/LanguageSelection';
import RoleSelection from './pages/RoleSelection';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import ExpertChatPage from './pages/ExpertChatPage';
import ReportPage from './pages/ReportPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/language" element={<LanguageSelection />} />
        <Route path="/role" element={<RoleSelection />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/expert-chat" element={<ExpertChatPage />} />
        <Route path="/report" element={<ReportPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
