# HHSSidekick

RivRyn SideKick is a React + Vite app for chat-driven agents, task execution, approvals, integrations, and local or cloud LLM routing.

This README is the main operator and developer guide for the repo. It is intentionally detailed so a new person, or a future agent, can get the project running without rediscovering the setup.

## Repo Layout

- `sidekick-react-pwa/`: main frontend app, Supabase edge functions, worker scripts, database SQL
- `database/`: legacy or shared SQL at repo root
- `AGENT_CAPABILITY_ROADMAP.md`: current execution roadmap for agent capabilities
- `AGENT_EXECUTION_PLAN.md`: higher-level execution architecture plan
- `OLLAMA_SETUP.md`: detailed Ollama setup guide

## What This App Does

SideKick currently supports:

- chat with specialist agents
- per-user LLM preferences
- local Ollama support
- Google integrations for Gmail and Calendar
- capability-driven agent execution
- approval-gated actions
- async job queue for runner tasks
- local workspace execution via a trusted worker

## Current Architecture

### Frontend

Main app:

- `sidekick-react-pwa/src/App.tsx`
- `sidekick-react-pwa/src/ChatPage.tsx`
- `sidekick-react-pwa/src/pages/IntegrationsPage.tsx`
- `sidekick-react-pwa/src/pages/LLMConfigPage.tsx`
- `sidekick-react-pwa/src/pages/AgentsPage.tsx`
- `sidekick-react-pwa/src/pages/settings/SettingsPage.tsx`

### LLM routing

The app supports:

- `groq`
- `ollama`
- `openai`
- `anthropic`

Routing and model selection live in:

- `sidekick-react-pwa/src/config/ai-models.ts`
- `sidekick-react-pwa/src/config/llm-runtime.ts`
- `sidekick-react-pwa/src/context/LlmSettingsContext.tsx`
- `sidekick-react-pwa/src/services/ai/llm-client.ts`

### Agent execution

The execution path is:

1. agent or UI requests an action
2. action enters `action_requests`
3. user approves it
4. action is queued in `agent_jobs`
5. `agent-runner` executes the capability
6. result is stored on the job

Relevant files:

- `sidekick-react-pwa/src/services/actions.ts`
- `sidekick-react-pwa/src/services/agents/runner.ts`
- `sidekick-react-pwa/supabase/functions/action-request/index.ts`
- `sidekick-react-pwa/supabase/functions/action-approve/index.ts`
- `sidekick-react-pwa/supabase/functions/action-execute/index.ts`
- `sidekick-react-pwa/supabase/functions/agent-enqueue/index.ts`
- `sidekick-react-pwa/supabase/functions/agent-runner/index.ts`
- `sidekick-react-pwa/supabase/functions/_shared/capability-executor.ts`

## Local Development

### Prerequisites

- Node.js 20+
- npm
- Supabase project
- optional: Ollama
- optional: Google OAuth credentials

### Install

```bash
cd sidekick-react-pwa
npm install
```

### Run

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Database Setup

These SQL files matter for the current app:

- `sidekick-react-pwa/database/create_core_tables.sql`
- `sidekick-react-pwa/database/create_profiles.sql`
- `sidekick-react-pwa/database/add_profile_llm_settings.sql`
- `sidekick-react-pwa/database/create_connectors.sql`
- `sidekick-react-pwa/database/create_tool_credentials.sql`
- `sidekick-react-pwa/database/create_actions.sql`
- `sidekick-react-pwa/database/create_agent_jobs.sql`
- `sidekick-react-pwa/database/create_projects.sql`
- `sidekick-react-pwa/database/create_memory.sql`

If profile-based LLM settings fail to save, make sure `add_profile_llm_settings.sql` has been run.

## Supabase Functions

Current function groups:

### Google integrations

- `google-connect`
- `google-callback`
- `google-status`
- `google-disconnect`

### Capability and credential layer

- `tool-capabilities`
- `tool-credential-upsert`

### Action approval flow

- `action-request`
- `action-approve`
- `action-reject`
- `action-execute`

### Agent runner

- `agent-enqueue`
- `agent-runner`

## LLM Setup Philosophy

For consumers, the app should not require editing `.env` files or changing code just to use Ollama.

The intended UX is:

1. sign in
2. open `LLM Config`
3. choose `Use this device` or `Use remote Ollama`
4. detect installed models
5. pick a model
6. save to account

The app now stores:

- preferred provider
- Ollama host
- default Ollama model

inside `profiles.llm_settings`.

That means Ollama setup is per user and does not need a rebuild.

## Ollama Setup

Use `OLLAMA_SETUP.md` for the full guide.

Short version:

1. install Ollama on the machine running inference
2. start the Ollama server
3. pull at least one model
4. open SideKick `LLM Config`
5. point SideKick at the correct Ollama host
6. detect models
7. save settings

## Important: Using Ollama On A PC Over Tailscale

This is the supported remote-machine pattern you said you will use.

Your setup is:

- SideKick frontend hosted on `https://skhhs.netlify.app`
- Ollama running on your PC
- your phone or another device reaching that PC over Tailscale

### What must be true

1. the browser must be able to reach the PC over Tailscale
2. Ollama must listen on an address reachable from Tailscale
3. Ollama must allow your Netlify origin via CORS

### Why the CORS error happens

When the browser on `https://skhhs.netlify.app` calls your Ollama server directly, Ollama must explicitly allow that website origin. If not, the browser blocks the request before the app can read the response.

### Required Ollama startup for this project

On the PC running Ollama, use:

```bash
OLLAMA_HOST=0.0.0.0:11434 OLLAMA_ORIGINS=https://skhhs.netlify.app ollama serve
```

If you also want localhost dev allowed:

```bash
OLLAMA_HOST=0.0.0.0:11434 OLLAMA_ORIGINS=https://skhhs.netlify.app,http://localhost:5173 ollama serve
```

### What to put in SideKick

In `LLM Config`, use either:

- `http://YOUR-PC-TAILSCALE-IP:11434`
- `http://YOUR-PC-TAILSCALE-DNS-NAME:11434`

Example:

```text
http://100.88.10.24:11434
```

### Reality check

`http://localhost:11434` only works when Ollama is on the same device as the browser.

If you are using your PC over Tailscale from a phone or another machine, `localhost` is wrong. You must use the PC’s Tailscale address or Tailscale DNS name.

### Recommended operator checklist

On the PC:

1. install Tailscale
2. install Ollama
3. pull the model you want
4. start Ollama with `OLLAMA_HOST` and `OLLAMA_ORIGINS`
5. verify from the PC:
   `curl http://127.0.0.1:11434/api/tags`

On the phone or second device:

1. connect to Tailscale
2. open SideKick
3. set Ollama host to the PC’s Tailscale address
4. click `Detect models`

If model detection fails with CORS:

- your `OLLAMA_ORIGINS` is wrong or missing

If model detection fails with connection timeout:

- your browser cannot reach the PC over Tailscale
- Ollama is not listening on `0.0.0.0:11434`
- the host or port is wrong

## Environment Variables

The app still supports build-time envs, mainly for cloud providers or defaults.

Common ones:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_AI_PROVIDER=
VITE_OLLAMA_URL=
VITE_GROQ_API_KEY=
VITE_OPENAI_API_KEY=
VITE_ANTHROPIC_API_KEY=
```

Important:

- consumers should not need `VITE_OLLAMA_URL` if they use the account-level LLM config UI
- `VITE_OLLAMA_URL` is now mainly a fallback/default

## Consumer UX Direction

The product should move toward:

- zero file editing
- zero code editing
- one-page model setup
- guided error messages
- auto-detection where possible

The next product-grade step after the current UI is a lightweight local connector app so users do not need to know about:

- CORS
- ports
- Tailscale IPs
- `OLLAMA_HOST`
- `OLLAMA_ORIGINS`

Until that connector exists, the Tailscale instructions above are the supported remote setup.

## Documentation Index

- [OLLAMA_SETUP.md](/Users/turtleclaw/Desktop/hhssidekick/OLLAMA_SETUP.md)
- [AGENT_CAPABILITY_ROADMAP.md](/Users/turtleclaw/Desktop/hhssidekick/AGENT_CAPABILITY_ROADMAP.md)
- [AGENT_EXECUTION_PLAN.md](/Users/turtleclaw/Desktop/hhssidekick/AGENT_EXECUTION_PLAN.md)
- [SETUP.md](/Users/turtleclaw/Desktop/hhssidekick/SETUP.md)
- [DEPLOYMENT.md](/Users/turtleclaw/Desktop/hhssidekick/DEPLOYMENT.md)

## Current Priorities

- finish real Gmail action flow end-to-end
- improve pending action UX and result visibility
- keep Ollama setup consumer-friendly
- add Twilio capability after email is stable

## Notes For Future Agents

If you are resuming work:

1. read this README
2. read `AGENT_CAPABILITY_ROADMAP.md`
3. inspect `LLMConfigPage.tsx`, `actions.ts`, `SettingsPage.tsx`, and `capability-executor.ts`
4. do not assume Ollama browser access works across origins without `OLLAMA_ORIGINS`
