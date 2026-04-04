# Agent Execution Plan

## Target

Build a Sidekick agent that can:

- reason over user requests
- execute approved tasks against connected tools
- use OAuth accounts where possible
- use API keys where OAuth is not available or not worth the friction
- operate on Rivryn projects and code workspaces through the same capability model

## Architecture

### 1. Agent Brain

- Chat agent remains the primary reasoning surface
- Queue worker handles asynchronous runs
- Planner produces structured steps: think, read, write, execute, ask for approval

### 2. Capability Layer

Every external action is exposed as a capability with:

- `id`
- `provider`
- `authKind`: `oauth`, `api_key`, or `local`
- `status`
- `requiredScopes`
- `actions`

Examples:

- Google Gmail send
- Google Calendar create
- GitHub repo read/write
- Rivryn project read/write
- Local code runner

### 3. Access Model

- OAuth connectors store encrypted refresh/access tokens
- API-key connectors store encrypted secrets per user/provider
- Local capabilities are only available on trusted worker environments

### 4. Execution Model

- Agent selects a capability
- Runtime resolves access for the user
- If approval is required, Sidekick creates an approval request
- Worker executes and stores audit logs/results

### 5. UX Direction

- One Integrations page backed by the capability registry
- “Connect account” for OAuth providers
- “Paste API key” for API-key providers
- “Available on this workspace” for local code tools
- No provider-specific setup page unless the provider truly needs one

## Delivery Order

### Phase 1

- Add capability registry
- Add encrypted API-key storage
- Add capability status endpoint
- Add UI for API-key-backed providers

### Phase 2

- Replace queued worker stub with real capability execution
- Support Google actions through capability resolution
- Support GitHub actions through API key or OAuth

### Phase 3

- Add Rivryn provider
- Add local code runner capability with strict approval boundaries
- Add execution logs and resumable job steps

### Phase 4

- Add planner/executor loop
- Add memory-backed task continuation
- Add richer approvals and audit trails
