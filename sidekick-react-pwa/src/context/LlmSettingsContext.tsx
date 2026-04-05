import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { applyUserLlmSettings } from '../config/llm-runtime';
import { getProfile } from '../services/database/profiles';
import { useAuth } from './AuthContext';

type LlmSettingsContextValue = {
  /** Reload profile llm_settings into runtime (after save on LLM page). */
  refreshFromProfile: () => Promise<void>;
  refreshing: boolean;
};

const LlmSettingsContext = createContext<LlmSettingsContextValue | undefined>(undefined);

export function LlmSettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const refreshFromProfile = useCallback(async () => {
    if (!user?.id) {
      applyUserLlmSettings(null);
      return;
    }
    setRefreshing(true);
    try {
      const profile = await getProfile(user.id);
      applyUserLlmSettings((profile?.llm_settings as Record<string, unknown>) || null);
    } catch {
      applyUserLlmSettings(null);
    } finally {
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    let cancelled = false;
    if (!user?.id) {
      applyUserLlmSettings(null);
      return;
    }
    void getProfile(user.id).then((profile) => {
      if (cancelled) return;
      applyUserLlmSettings((profile?.llm_settings as Record<string, unknown>) || null);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const value: LlmSettingsContextValue = {
    refreshFromProfile,
    refreshing,
  };

  return <LlmSettingsContext.Provider value={value}>{children}</LlmSettingsContext.Provider>;
}

export function useLlmSettingsSync(): LlmSettingsContextValue {
  const ctx = useContext(LlmSettingsContext);
  if (!ctx) {
    throw new Error('useLlmSettingsSync must be used within LlmSettingsProvider');
  }
  return ctx;
}
