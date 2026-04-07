# Sidekick React PWA

This directory contains the main SideKick web app.

For the full project guide, start with the root README:

- [README.md](/Users/turtleclaw/Desktop/hhssidekick/README.md)

Most important docs:

- [OLLAMA_SETUP.md](/Users/turtleclaw/Desktop/hhssidekick/OLLAMA_SETUP.md)
- [AGENT_CAPABILITY_ROADMAP.md](/Users/turtleclaw/Desktop/hhssidekick/AGENT_CAPABILITY_ROADMAP.md)

## App Quick Start

```bash
cd sidekick-react-pwa
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Key Areas

- frontend routes: `src/pages/`
- chat and agent UX: `src/ChatPage.tsx`, `src/agents/`
- LLM config: `src/pages/LLMConfigPage.tsx`
- integrations: `src/pages/IntegrationsPage.tsx`
- approval flow: `src/services/actions.ts`, `src/pages/settings/SettingsPage.tsx`
- runner and capabilities: `supabase/functions/`

## Ollama Note

If the app is hosted on Netlify and Ollama runs on another machine, browser access requires:

- reachable host, such as a Tailscale IP or DNS name
- `OLLAMA_HOST` configured so Ollama listens externally
- `OLLAMA_ORIGINS` configured to allow the hosted web origin

Example:

```bash
OLLAMA_HOST=0.0.0.0:11434 OLLAMA_ORIGINS=https://skhhs.netlify.app ollama serve
```
