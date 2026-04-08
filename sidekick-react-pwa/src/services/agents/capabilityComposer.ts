export type JobActionType =
  | 'github.repo.read'
  | 'github.repo.write'
  | 'gmail.send'
  | 'calendar.create'
  | 'rivryn.project.read'
  | 'code.exec';

export interface NormalizedCapabilityRequest {
  action: JobActionType;
  params: Record<string, unknown>;
  approvalRequired: boolean;
  summary: string;
}

export interface NormalizationResult {
  ok: true;
  value: NormalizedCapabilityRequest;
}

export interface NormalizationError {
  ok: false;
  error: string;
}

type KeyValueMap = Record<string, string>;

export function normalizeCapabilityInstruction(
  action: JobActionType,
  instruction: string,
  fallbackTimeZone: string = 'UTC'
): NormalizationResult | NormalizationError {
  const trimmed = instruction.trim();
  if (!trimmed) {
    return { ok: false, error: 'Add an instruction before queueing the job.' };
  }

  const jsonParams = tryParseJsonObject(trimmed);
  if (jsonParams) {
    return {
      ok: true,
      value: {
        action,
        params: jsonParams,
        approvalRequired: requiresApproval(action),
        summary: buildSummary(action, jsonParams),
      },
    };
  }

  const fields = parseKeyValueBlocks(trimmed);

  try {
    const params = normalizeParams(action, trimmed, fields, fallbackTimeZone);
    return {
      ok: true,
      value: {
        action,
        params,
        approvalRequired: requiresApproval(action),
        summary: buildSummary(action, params),
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to understand that instruction.',
    };
  }
}

function normalizeParams(
  action: JobActionType,
  instruction: string,
  fields: KeyValueMap,
  fallbackTimeZone: string
): Record<string, unknown> {
  switch (action) {
    case 'github.repo.read':
      return normalizeGitHubRead(instruction, fields);
    case 'github.repo.write':
      return normalizeGitHubWrite(instruction, fields);
    case 'gmail.send':
      return normalizeGmail(instruction, fields);
    case 'calendar.create':
      return normalizeCalendar(instruction, fields, fallbackTimeZone);
    case 'rivryn.project.read':
      return normalizeRivryn(instruction, fields);
    case 'code.exec':
      return normalizeCodeExec(instruction, fields);
    default:
      throw new Error('Unsupported action');
  }
}

function normalizeGitHubRead(instruction: string, fields: KeyValueMap) {
  const repoRef =
    firstField(fields, ['repo', 'repository']) || findRepoReference(instruction) || '';
  const { owner, repo } = parseRepoRef(repoRef);
  const path =
    firstField(fields, ['path', 'file']) || findLabeledText(instruction, /(path|file)\s+([^\n]+)/i);
  const ref = firstField(fields, ['ref', 'branch']);

  if (!owner || !repo) {
    throw new Error('GitHub read needs a repository like "repo: owner/name".');
  }

  return compactObject({
    owner,
    repo,
    path,
    ref,
  });
}

function normalizeGitHubWrite(instruction: string, fields: KeyValueMap) {
  const repoRef = firstField(fields, ['repo', 'repository']) || findRepoReference(instruction) || '';
  const { owner, repo } = parseRepoRef(repoRef);
  const path = firstField(fields, ['path', 'file']);
  const message = firstField(fields, ['message', 'commit']) || 'Update via RivRyn SideKick';
  const content = firstField(fields, ['content', 'body', 'text']);
  const branch = firstField(fields, ['branch', 'ref']);

  if (!owner || !repo || !path || !content) {
    throw new Error(
      'GitHub write needs repo, path, and content. Example: "repo: owner/name", "path: notes.txt", "content: hello".'
    );
  }

  return compactObject({
    owner,
    repo,
    path,
    message,
    content,
    branch,
  });
}

function normalizeGmail(instruction: string, fields: KeyValueMap) {
  const to =
    firstField(fields, ['to', 'recipient']) || instruction.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  const subject =
    firstField(fields, ['subject', 'title']) ||
    findLabeledText(instruction, /subject\s+["“]?([^"\n”]+)["”]?/i);
  const body = firstField(fields, ['body', 'message', 'content']);

  if (!to || !subject || !body) {
    throw new Error('Email needs `to`, `subject`, and `body` in plain text or pasted JSON.');
  }

  return { to, subject, body };
}

function normalizeCalendar(instruction: string, fields: KeyValueMap, fallbackTimeZone: string) {
  const summary =
    firstField(fields, ['summary', 'title']) ||
    findLabeledText(instruction, /(meeting|event|schedule)\s+["“]?([^"\n”]+)["”]?/i, 2);
  const startRaw = firstField(fields, ['start', 'starts']);
  const endRaw = firstField(fields, ['end', 'ends']);
  const date = firstField(fields, ['date']);
  const startTime = firstField(fields, ['start_time', 'start time']);
  const endTime = firstField(fields, ['end_time', 'end time']);
  const timeZone = firstField(fields, ['timezone', 'time_zone', 'tz']) || fallbackTimeZone;
  const addMeet = parseBoolean(firstField(fields, ['add_meet', 'meet', 'google_meet'])) || /\b(add meet|google meet|meet link|video call)\b/i.test(instruction);

  const startDateTime = startRaw || combineDateTime(date, startTime);
  const endDateTime = endRaw || combineDateTime(date, endTime);

  if (!summary || !startDateTime || !endDateTime) {
    throw new Error(
      'Calendar events need a title plus start and end times. Example: "title: Sprint review", "date: 2026-04-09", "start time: 10:00", "end time: 10:30".'
    );
  }

  return {
    summary,
    start: { dateTime: startDateTime, timeZone },
    end: { dateTime: endDateTime, timeZone },
    addMeet,
  };
}

function normalizeRivryn(instruction: string, fields: KeyValueMap) {
  const endpoint =
    firstField(fields, ['endpoint', 'path']) ||
    findLabeledText(instruction, /(endpoint|path)\s+([^\s\n]+)/i, 2);
  const method = (firstField(fields, ['method']) || 'GET').toUpperCase();
  const bodyText = firstField(fields, ['body']);
  const body = bodyText ? tryParseJsonObject(bodyText) || bodyText : undefined;

  if (!endpoint) {
    throw new Error('Rivryn API calls need an endpoint, for example "endpoint: projects".');
  }

  return compactObject({
    endpoint,
    method,
    body,
  });
}

function normalizeCodeExec(instruction: string, fields: KeyValueMap) {
  const commandLine = firstField(fields, ['command', 'cmd']) || instruction.split('\n')[0].trim();
  const cwd = firstField(fields, ['cwd', 'directory', 'path']);
  const timeoutMs = firstField(fields, ['timeout', 'timeout_ms']);
  const parts = splitCommandLine(commandLine);
  const [command, ...args] = parts;

  if (!command) {
    throw new Error('Code jobs need a command, for example "npm run build".');
  }

  return compactObject({
    command,
    args,
    cwd,
    timeoutMs: timeoutMs ? Number(timeoutMs) : undefined,
  });
}

function requiresApproval(action: JobActionType) {
  return action === 'gmail.send' || action === 'calendar.create';
}

function buildSummary(action: JobActionType, params: Record<string, unknown>) {
  switch (action) {
    case 'github.repo.read':
      return `Read ${params.owner}/${params.repo}${params.path ? `:${params.path}` : ''}`;
    case 'github.repo.write':
      return `Write ${params.path} in ${params.owner}/${params.repo}`;
    case 'gmail.send':
      return `Send email to ${params.to}`;
    case 'calendar.create':
      return `Create calendar event "${params.summary}"`;
    case 'rivryn.project.read':
      return `${params.method || 'GET'} ${params.endpoint}`;
    case 'code.exec':
      return `Run ${[params.command, ...(Array.isArray(params.args) ? params.args : [])].filter(Boolean).join(' ')}`;
    default:
      return action;
  }
}

function tryParseJsonObject(value: string) {
  if (!/^\s*\{[\s\S]*\}\s*$/.test(value)) {
    return null;
  }

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function parseKeyValueBlocks(input: string): KeyValueMap {
  const result: KeyValueMap = {};
  const lines = input.split('\n');
  let currentKey: string | null = null;

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, '');
    const match = line.match(/^\s*([A-Za-z][A-Za-z0-9 _-]{1,40})\s*:\s*(.*)$/);

    if (match) {
      currentKey = normalizeKey(match[1]);
      result[currentKey] = match[2].trim();
      continue;
    }

    if (currentKey) {
      result[currentKey] = [result[currentKey], line].filter(Boolean).join('\n').trim();
    }
  }

  return result;
}

function firstField(fields: KeyValueMap, keys: string[]) {
  for (const key of keys.map(normalizeKey)) {
    const value = fields[key];
    if (value) return stripWrappingQuotes(value.trim());
  }
  return '';
}

function normalizeKey(key: string) {
  return key.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
}

function stripWrappingQuotes(value: string) {
  return value.replace(/^["“](.*)["”]$/s, '$1').trim();
}

function findRepoReference(input: string) {
  return input.match(/\b([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)\b/)?.[1] || '';
}

function parseRepoRef(value: string) {
  const match = value.trim().match(/^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/);
  return {
    owner: match?.[1] || '',
    repo: match?.[2] || '',
  };
}

function findLabeledText(input: string, pattern: RegExp, group = 2) {
  const match = input.match(pattern);
  return match?.[group] ? stripWrappingQuotes(match[group]) : '';
}

function combineDateTime(date?: string, time?: string) {
  if (!date || !time) return '';
  return `${date}T${time}:00`;
}

function parseBoolean(value: string) {
  if (!value) return false;
  return ['true', 'yes', 'y', '1'].includes(value.trim().toLowerCase());
}

function splitCommandLine(commandLine: string) {
  const parts = commandLine.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
  return parts.map((part) => part.replace(/^"(.*)"$/, '$1'));
}

function compactObject<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== ''));
}
