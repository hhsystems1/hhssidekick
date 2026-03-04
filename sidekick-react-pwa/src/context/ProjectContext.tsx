import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';

interface ProjectContextValue {
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const storageKey = useMemo(() => (user?.id ? `sidekick.activeProject.${user.id}` : null), [user?.id]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  useEffect(() => {
    if (!storageKey) {
      setActiveProjectId(null);
      return;
    }
    try {
      const saved = localStorage.getItem(storageKey);
      setActiveProjectId(saved || null);
    } catch {
      setActiveProjectId(null);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) return;
    try {
      if (activeProjectId) {
        localStorage.setItem(storageKey, activeProjectId);
      } else {
        localStorage.removeItem(storageKey);
      }
    } catch {
      // ignore storage errors
    }
  }, [activeProjectId, storageKey]);

  return (
    <ProjectContext.Provider value={{ activeProjectId, setActiveProjectId }}>
      {children}
    </ProjectContext.Provider>
  );
};

export function useProjectContext() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProjectContext must be used within ProjectProvider');
  return ctx;
}
