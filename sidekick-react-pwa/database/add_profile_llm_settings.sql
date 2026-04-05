-- Per-account LLM preferences (Ollama host for Tailscale/LAN, provider override, default model).
-- Example llm_settings JSON:
-- {"ollama_host":"http://100.x.x.x:11434","ollama_model_default":"llama3.2:latest","preferred_provider":"ollama"}

alter table public.profiles
  add column if not exists llm_settings jsonb not null default '{}'::jsonb;

comment on column public.profiles.llm_settings is 'RivRyn SideKick: ollama_host, ollama_model_default, preferred_provider';
