import { callLLM } from '../ai/llm-client';
import type { AgentActionProposal, ApprovalActionType } from '../../types/agents';

interface DraftActionProposalInput {
  userMessage: string;
  assistantResponse: string;
  timeZone: string;
}

interface DraftActionProposalResult {
  proposals: AgentActionProposal[];
}

interface RawProposal {
  kind?: string;
  actionType?: unknown;
  params?: unknown;
  summary?: unknown;
}

const ACTION_PROPOSAL_SYSTEM_PROMPT = `You extract draft approval actions from chat.

Only draft actions when the user is clearly asking SideKick to do the action, not when they are only asking for advice or brainstorming.

Supported actions:
- gmail.send
- calendar.create

Return JSON only with this shape:
{
  "proposals": [
    {
      "kind": "action_request",
      "actionType": "gmail.send" | "calendar.create",
      "summary": "short user-facing summary",
      "params": { ... }
    }
  ]
}

Rules:
- Use an empty array when there is no actionable draft.
- For gmail.send params include: to, subject, body.
- "to" may be a person's name if no email address is available yet. This is a draft request, not final execution.
- Keep subject concise.
- Make body useful and ready for user approval.
- For calendar.create params include: summary, start, end, and optional addMeet.
- start and end must be objects with dateTime and timeZone.
- If date or time is missing or ambiguous, do not create a calendar draft.
- Never include markdown fences or extra commentary.`;

export async function draftActionProposals(
  input: DraftActionProposalInput
): Promise<DraftActionProposalResult> {
  const extractionPrompt = [
    `User message: ${input.userMessage}`,
    '',
    `Assistant response: ${input.assistantResponse}`,
    '',
    `Preferred time zone: ${input.timeZone}`,
  ].join('\n');

  try {
    const response = await callLLM({
      systemPrompt: ACTION_PROPOSAL_SYSTEM_PROMPT,
      userMessage: extractionPrompt,
      agentType: 'orchestrator',
      behavioralMode: 'execution',
      temperature: 0.1,
      maxTokens: 700,
    });

    const parsed = parseJsonObject(response.content);
    const proposals = Array.isArray(parsed?.proposals)
      ? parsed.proposals
          .map(normalizeProposal)
          .filter((proposal): proposal is AgentActionProposal => proposal !== null)
      : [];

    return { proposals };
  } catch (error) {
    console.warn('Action proposal drafting failed:', error);
    return { proposals: [] };
  }
}

function normalizeProposal(value: unknown): AgentActionProposal | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const raw = value as RawProposal;
  if (raw.kind !== 'action_request') {
    return null;
  }

  if (raw.actionType !== 'gmail.send' && raw.actionType !== 'calendar.create') {
    return null;
  }

  const params = raw.params;
  if (!params || typeof params !== 'object' || Array.isArray(params)) {
    return null;
  }

  const actionType = raw.actionType as ApprovalActionType;
  if (!isValidParams(actionType, params as Record<string, unknown>)) {
    return null;
  }

  return {
    kind: 'action_request',
    actionType,
    params: params as Record<string, unknown>,
    approvalRequired: true,
    summary: typeof raw.summary === 'string' && raw.summary.trim()
      ? raw.summary.trim()
      : defaultSummary(actionType, params as Record<string, unknown>),
  };
}

function isValidParams(
  actionType: ApprovalActionType,
  params: Record<string, unknown>
): boolean {
  if (actionType === 'gmail.send') {
    return hasText(params.to) && hasText(params.subject) && hasText(params.body);
  }

  const start = params.start;
  const end = params.end;
  return (
    hasText(params.summary) &&
    !!start &&
    typeof start === 'object' &&
    !Array.isArray(start) &&
    hasText((start as Record<string, unknown>).dateTime) &&
    hasText((start as Record<string, unknown>).timeZone) &&
    !!end &&
    typeof end === 'object' &&
    !Array.isArray(end) &&
    hasText((end as Record<string, unknown>).dateTime) &&
    hasText((end as Record<string, unknown>).timeZone)
  );
}

function defaultSummary(
  actionType: ApprovalActionType,
  params: Record<string, unknown>
): string {
  if (actionType === 'gmail.send') {
    return `Send email to ${String(params.to || 'recipient')}`;
  }

  return `Create calendar event "${String(params.summary || 'Untitled event')}"`;
}

function hasText(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function parseJsonObject(value: string): { proposals?: unknown } | null {
  const trimmed = value.trim();

  try {
    return JSON.parse(trimmed) as { proposals?: unknown };
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) {
      return null;
    }

    try {
      return JSON.parse(match[0]) as { proposals?: unknown };
    } catch {
      return null;
    }
  }
}
