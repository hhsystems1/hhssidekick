import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import { Toaster } from 'react-hot-toast';
import { SidekickHome } from './SidekickHome';
import { TestPage } from './TestPage';
import { AgentsPage } from './pages/AgentsPage';
import { TrainingPage } from './pages/TrainingPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { ProfilePage } from './pages/ProfilePage';
import { ChatPage } from './ChatPage';
import { Layout } from './Layout';
import SchedulePage from './pages/schedule/SchedulePage';
import SettingsPage from './pages/settings/SettingsPage';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1f2937',
            color: '#f3f4f6',
            border: '1px solid #374151',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#f3f4f6',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#f3f4f6',
            },
          },
        }}
      />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<SidekickHome />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="agents" element={<AgentsPage />} />
            <Route path="training" element={<TrainingPage />} />
            <Route path="marketplace" element={<MarketplacePage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="test" element={<TestPage />} />
            <Route path="schedule" element={<SchedulePage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
