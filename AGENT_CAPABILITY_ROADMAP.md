# Agent Capability Roadmap

## Purpose

This document is the working handoff for getting SideKick runner tasks to perform real external actions instead of stopping at planning or placeholder behavior.

Primary near-term goal:

- let an agent send a real email through the existing approval + queue system

Secondary goal:

- add a phone/SMS provider cleanly, most likely Twilio, using the same capability model

This file is meant to be durable context for future agents so work can resume without re-discovery.

## Current State

### What already exists

- Capability registry exists in `sidekick-react-pwa/supabase/functions/_shared/capabilities.ts`
- Capability execution exists in `sidekick-react-pwa/supabase/functions/_shared/capability-executor.ts`
- Async queue runner exists in `sidekick-react-pwa/supabase/functions/agent-runner/index.ts`
- Agent enqueue path exists in `sidekick-react-pwa/src/services/agents/runner.ts`
- Approval records exist via `sidekick-react-pwa/database/create_actions.sql`
- Connector tables exist via `sidekick-react-pwa/database/create_connectors.sql`
- Encrypted API-key storage exists via `sidekick-react-pwa/database/create_tool_credentials.sql`
- Job queue table exists via `sidekick-react-pwa/database/create_agent_jobs.sql`
- Local workspace worker exists in `sidekick-react-pwa/workers/local-agent-runner.mjs`
- Integrations UI exists in `sidekick-react-pwa/src/pages/IntegrationsPage.tsx`

### What is actually working already

- `gmail.send` is registered as a capability
- `calendar.create` is registered as a capability
- Gmail execution code is real, not mock
- Calendar execution code is real, not mock
- GitHub API-key execution path exists
- Rivryn API-key execution path exists
- Queue jobs can execute approved capability actions

### What is still incomplete

- agent-to-approval UI flow is not fully stitched together end-to-end
- there is no durable agent planner/executor contract that says "create action request" vs "execute now"
- there is no visible pending-actions workflow in the current UI path verified in this repo pass
- there is no Twilio capability yet
- there are no delivery-status webhooks for outbound communications
- there is not yet a hardened audit trail around outbound email/phone usage
- local code worker supports only a narrow command set and is separate from hosted runner flow

## Architecture Summary

### Hosted capabilities

Hosted capabilities run in Supabase Edge Functions.

Flow:

1. Agent decides an external action is needed.
2. SideKick creates an `action_requests` row with `pending` status.
3. User approves the action.
4. SideKick enqueues an `agent_jobs` row pointing at that action.
5. `agent-runner` picks up the job.
6. `capability-executor` performs the provider-specific API call.
7. Result is stored on the job and the action is marked `executed` or `failed`.

Relevant files:

- `sidekick-react-pwa/supabase/functions/action-request/index.ts`
- `sidekick-react-pwa/supabase/functions/action-approve/index.ts`
- `sidekick-react-pwa/supabase/functions/action-execute/index.ts`
- `sidekick-react-pwa/supabase/functions/agent-enqueue/index.ts`
- `sidekick-react-pwa/supabase/functions/agent-runner/index.ts`
- `sidekick-react-pwa/supabase/functions/_shared/capability-executor.ts`

### Local workspace capabilities

Local code actions are intentionally not executed by the hosted runner. Hosted runner skips `code.*` jobs and expects the local worker to handle them.

Relevant file:

- `sidekick-react-pwa/workers/local-agent-runner.mjs`

## Recommended Delivery Order

### Phase 1: Finish Real Email Sending

Goal:

- user approves an email and the agent sends it through Gmail

Tasks:

- verify all required SQL has been applied:
  - `sidekick-react-pwa/database/create_connectors.sql`
  - `sidekick-react-pwa/database/create_tool_credentials.sql`
  - `sidekick-react-pwa/database/create_actions.sql`
  - `sidekick-react-pwa/database/create_agent_jobs.sql`
- verify Supabase function secrets are set:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_ANON_KEY`
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `GOOGLE_REDIRECT_URL`
  - `CONNECTOR_ENCRYPTION_KEY`
- deploy these functions:
  - `google-connect`
  - `google-callback`
  - `google-status`
  - `google-disconnect`
  - `tool-capabilities`
  - `tool-credential-upsert`
  - `action-request`
  - `action-approve`
  - `action-reject`
  - `action-execute`
  - `agent-enqueue`
  - `agent-runner`
- add or verify a UI for pending action approval
- wire agent output so "send email" creates an `action_request` with:
  - `action_type: gmail.send`
  - `params.to`
  - `params.subject`
  - `params.body`
- after approval, enqueue the action for async execution instead of leaving it pending
- show success/failure result back in chat or agent status UI

Exit criteria:

- a signed-in user can connect Google on `/integrations`
- agent creates an approval request for email
- user approves the request
- queue processes the request
- Gmail sends successfully
- result is visible in app state or logs

### Phase 2: Harden Email for Production Use

Goal:

- make outbound email safe, explainable, and supportable

Tasks:

- validate required fields before create/execute
- normalize and validate recipient email addresses
- store a minimal audit record for each outbound email
- add sender identity rules if needed
- add rate limiting or quotas per user
- add better error messages for:
  - missing Google scopes
  - expired token
  - Gmail API rejection
- support plain text first, then optionally HTML/multipart

Exit criteria:

- email actions fail predictably and visibly
- user can reconnect Google when scopes are missing
- outbound email activity is auditable

### Phase 3: Add Twilio SMS Capability

Goal:

- agent can send approved SMS messages through Twilio

Why Twilio:

- fits the current API-key capability model well
- supports SMS and voice in one provider
- is the more straightforward choice for programmable calling

Tasks:

- add Twilio capability definitions to `capabilities.ts`
- suggested actions:
  - `twilio.sms.send`
  - `twilio.voice.call`
- store encrypted Twilio credentials in `tool_credentials`
- expected config fields:
  - `accountSid`
  - `fromNumber`
  - optional `messagingServiceSid`
- extend `capability-executor.ts` with a Twilio executor
- add Twilio integration card to `/integrations`
- create approval payload shape for SMS:
  - `to`
  - `body`
  - optional `mediaUrl`
- enqueue and execute SMS through the same `action_requests` + `agent_jobs` flow
- add delivery-status webhook endpoint

Exit criteria:

- user can save Twilio credentials
- agent can create an approved SMS action
- Twilio sends the message
- delivery result is recorded

### Phase 4: Add Twilio Voice Calling

Goal:

- agent can place approved outbound calls

Tasks:

- define `twilio.voice.call`
- approval payload should include:
  - `to`
  - `from`
  - `purpose`
  - either `twiml`, `url`, or generated script content
- decide whether MVP is:
  - simple outbound dial with static TwiML
  - AI-generated script read by TTS
  - transfer/bridge workflow
- add call status webhook endpoint
- add safeguards:
  - explicit user approval per call
  - business-hours rules
  - call recording consent rules if ever enabled

Exit criteria:

- approved outbound calls can be initiated
- call lifecycle statuses are captured
- failure states are visible

## Decision Log

### Recommendation: do Gmail before Twilio

Reason:

- Gmail path is already mostly implemented
- it proves the approval and queue architecture end-to-end
- it reduces uncertainty before adding another provider

### Recommendation: use Twilio for phone/SMS

Reason:

- one provider can cover SMS and voice
- matches current encrypted API-key pattern
- easier to model than building around a more limited messaging-first provider

### Compliance note

US A2P SMS is not just a coding task. If SideKick sends application-generated SMS to US numbers, Twilio A2P 10DLC registration is likely required before real production traffic.

This must be treated as launch work, not just implementation work.

## Handoff Checklist For Any Future Agent

Before changing code:

- read this file
- inspect current state of:
  - `sidekick-react-pwa/supabase/functions/_shared/capabilities.ts`
  - `sidekick-react-pwa/supabase/functions/_shared/capability-executor.ts`
  - `sidekick-react-pwa/supabase/functions/agent-runner/index.ts`
  - `sidekick-react-pwa/src/pages/IntegrationsPage.tsx`
- verify whether pending actions UI already exists and is wired
- verify whether `agent-enqueue` currently receives `action_id` from any UI path

If working on email:

- do not redesign the capability model
- keep using `gmail.send`
- preserve approval before execution

If working on Twilio:

- follow existing provider pattern
- keep credentials in `tool_credentials`
- do not bypass approval
- add delivery/call status callbacks before calling it complete

## Concrete Next Task

The next highest-value implementation task is:

- harden the agent/runtime production path page by page, starting with queue execution, provider health, and approval/error states

After that:

- finish the agent-created `gmail.send` action flow end to end
- add or verify a visible pending-actions screen
- then test a real Gmail send

## Status Snapshot

As of 2026-04-04:

- Gmail backend capability exists
- Google integration UI exists
- action approval tables/functions exist
- queue runner exists
- local code runner exists
- Twilio/phone capability does not exist yet
- the end-to-end agent-triggered email flow still needs to be stitched together

As of 2026-04-07:

- `AgentsPage` no longer requires raw JSON for queued capability jobs
- capability jobs now accept natural-language or `field: value` instructions in the UI
- frontend compatibility parser exists at `sidekick-react-pwa/src/services/agents/capabilityComposer.ts`
- `agent-enqueue` now normalizes `payload.capability_instruction` into `payload.params`
- `agent-runner` also normalizes `payload.capability_instruction` at execution time as a fallback
- local worker can normalize raw `code.exec` instructions before running allowed commands
- `gmail.send` and `calendar.create` approval flow is unchanged
- idle agent toggle icon on `AgentsPage` was changed from the Rivryn logo to a proper play/start icon

## 2026-04-07 Handoff

What changed today:

- replaced the `AgentsPage` job composer JSON textarea with an instruction composer plus parsed-preview UI
- preserved pasted JSON support for backward compatibility
- moved capability-instruction normalization into runtime code so queue execution does not depend on frontend-only shaping
- kept approval-required actions (`gmail.send`, `calendar.create`) on the existing request/approve path

Files changed today:

- `sidekick-react-pwa/src/pages/AgentsPage.tsx`
- `sidekick-react-pwa/src/services/agents/capabilityComposer.ts`
- `sidekick-react-pwa/supabase/functions/_shared/capability-instruction.ts`
- `sidekick-react-pwa/supabase/functions/agent-enqueue/index.ts`
- `sidekick-react-pwa/supabase/functions/agent-runner/index.ts`
- `sidekick-react-pwa/workers/local-agent-runner.mjs`

What still needs to happen before this is live:

- deploy updated Supabase functions:
  - `agent-enqueue`
  - `agent-runner`
- restart the local worker if it is already running and you want `code.exec` instruction parsing to be live
- verify one hosted queue job and one local `code.exec` job from `AgentsPage`

Suggested first task tomorrow:

- do a production page audit starting with agents/chat/settings:
  - remove remaining placeholder/demo behaviors
  - verify empty states and failure states
  - tighten provider-health and auth-edge-case messaging

Suggested agent/runtime follow-up:

- wire the chat agent path to create real action requests from natural prompts instead of only returning plain text
- extract and persist suggested actions from agent responses if that contract is still needed
