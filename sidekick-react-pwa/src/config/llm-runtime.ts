/**
 * Per-user LLM overrides loaded from Supabase profiles.llm_settings.
 * Keeps ai-models free of React; sync from LlmSettingsProvider after profile load.
 */

export type LlmUserSettings = {
  ollama_host?: string;
  ollama_model_default?: string;
  preferred_provider?: string;
};

const PROVIDERS = new Set(['groq', 'ollama', 'openai', 'anthropic']);

let active: LlmUserSettings = {};

export function applyUserLlmSettings(raw: Record<string, unknown> | null | undefined) {
  if (!raw || typeof raw !== 'object') {
    active = {};
    return;
  }
  const ollama_host =
    typeof raw.ollama_host === 'string' ? raw.ollama_host : undefined;
  const ollama_model_default =
    typeof raw.ollama_model_default === 'string' ? raw.ollama_model_default : undefined;
  const preferred_provider =
    typeof raw.preferred_provider === 'string' ? raw.preferred_provider.toLowerCase() : undefined;

  active = {
    ollama_host,
    ollama_model_default,
    preferred_provider: preferred_provider && PROVIDERS.has(preferred_provider) ? preferred_provider : undefined,
  };
}

export function getUserLlmOllamaHost(): string | undefined {
  const h = active.ollama_host?.trim();
  return h || undefined;
}

export function getUserPreferredProvider(): string | undefined {
  return active.preferred_provider;
}

export function getUserOllamaModelDefault(): string | undefined {
  const m = active.ollama_model_default?.trim();
  return m || undefined;
}
