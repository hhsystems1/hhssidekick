import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import { Toaster } from 'react-hot-toast';
import { SidekickHome } from './SidekickHome';
import { AgentsPage } from './pages/AgentsPage';
import { TrainingPage } from './pages/TrainingPage';
import { ChatPage } from './ChatPage';
import { Layout } from './Layout';
import SettingsPage from './pages/settings/SettingsPage';
import { AuthProvider } from './context/AuthContext';
import { TasksPage } from './pages/TasksPage';
import { FilesPage } from './pages/FilesPage';
import { SkillsPage } from './pages/SkillsPage';
import { LLMConfigPage } from './pages/LLMConfigPage';
import { IntegrationsPage } from './pages/IntegrationsPage';
import { AppBuilderPage } from './pages/AppBuilderPage';

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
            <Route path="tasks" element={<TasksPage />} />
            <Route path="files" element={<FilesPage />} />
            <Route path="skills" element={<SkillsPage />} />
            <Route path="llm-config" element={<LLMConfigPage />} />
            <Route path="integrations" element={<IntegrationsPage />} />
            <Route path="app-builder" element={<AppBuilderPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
