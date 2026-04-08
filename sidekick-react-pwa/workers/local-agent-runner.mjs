import 'dotenv/config';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createClient } from '@supabase/supabase-js';

const execFileAsync = promisify(execFile);
const POLL_MS = Number(process.env.SIDEKICK_LOCAL_POLL_MS || 4000);
const MAX_JOBS = Number(process.env.SIDEKICK_LOCAL_MAX_JOBS || 3);
const WORKSPACE_ROOT = process.env.SIDEKICK_WORKSPACE_ROOT || process.cwd();

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

const SAFE_COMMANDS = {
  npm: ['run', 'test', 'build', 'lint', 'install'],
  git: ['status', 'diff', 'log', 'show', 'branch'],
  rg: null,
  ls: null,
  cat: null,
};

function isAllowedCommand(command, args) {
  const allowedArgs = SAFE_COMMANDS[command];
  if (allowedArgs === undefined) return false;
  if (allowedArgs === null) return true;
  return args.length > 0 && allowedArgs.includes(args[0]);
}

function normalizeLocalPayload(payload = {}) {
  if (payload.params && typeof payload.params === 'object') {
    return payload;
  }

  const action = typeof payload.capability_action === 'string' ? payload.capability_action : null;
  const instruction =
    typeof payload.capability_instruction === 'string' ? payload.capability_instruction.trim() : '';

  if (action !== 'code.exec' || !instruction) {
    return payload;
  }

  const lines = instruction.split('\n');
  const commandLine = lines[0]?.trim() || '';
  const cwdLine = lines.find((line) => /^\s*(cwd|directory|path)\s*:/i.test(line));
  const timeoutLine = lines.find((line) => /^\s*(timeout|timeout_ms)\s*:/i.test(line));
  const parts = commandLine.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
  const [command, ...args] = parts.map((part) => part.replace(/^"(.*)"$/, '$1'));

  return {
    ...payload,
    params: {
      command,
      args,
      cwd: cwdLine ? cwdLine.replace(/^[^:]+:\s*/, '').trim() : undefined,
      timeoutMs: timeoutLine ? Number(timeoutLine.replace(/^[^:]+:\s*/, '').trim()) : undefined,
    },
    normalized_from_instruction: true,
  };
}

async function claimQueuedJobs() {
  const { data, error } = await supabase
    .from('agent_jobs')
    .select('*')
    .eq('status', 'queued')
    .order('scheduled_at', { ascending: true })
    .limit(MAX_JOBS);

  if (error) throw error;

  return (data || []).filter((job) => {
    const action = job.payload?.capability_action;
    return typeof action === 'string' && action.startsWith('code.');
  });
}

async function markRunning(jobId) {
  await supabase
    .from('agent_jobs')
    .update({
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .eq('status', 'queued');
}

async function markCompleted(jobId, result) {
  await supabase
    .from('agent_jobs')
    .update({
      status: 'completed',
      finished_at: new Date().toISOString(),
      result,
      error: null,
    })
    .eq('id', jobId);
}

async function markFailed(jobId, error) {
  await supabase
    .from('agent_jobs')
    .update({
      status: 'failed',
      finished_at: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
    })
    .eq('id', jobId);
}

async function handleCodeRead(payload) {
  return {
    message: 'Use rg/ls/cat jobs for direct file inspection in the local worker.',
    path: payload.params?.path || null,
  };
}

async function handleCodeExec(payload) {
  const command = String(payload.params?.command || '');
  const args = Array.isArray(payload.params?.args)
    ? payload.params.args.map((value) => String(value))
    : [];
  const cwd = payload.params?.cwd ? String(payload.params.cwd) : WORKSPACE_ROOT;

  if (!command) {
    throw new Error('params.command is required');
  }

  if (!isAllowedCommand(command, args)) {
    throw new Error(`Command not allowed: ${command} ${args.join(' ')}`.trim());
  }

  const { stdout, stderr } = await execFileAsync(command, args, {
    cwd,
    timeout: Number(payload.params?.timeoutMs || 120000),
    maxBuffer: 1024 * 1024,
  });

  return {
    command,
    args,
    cwd,
    stdout,
    stderr,
  };
}

async function processJob(job) {
  const payload = normalizeLocalPayload(job.payload || {});
  const action = payload.capability_action;
  if (action === 'code.read') {
    return await handleCodeRead(payload);
  }
  if (action === 'code.exec') {
    return await handleCodeExec(payload);
  }
  throw new Error(`Unsupported local action: ${action}`);
}

async function runLoop() {
  for (;;) {
    try {
      const jobs = await claimQueuedJobs();
      for (const job of jobs) {
        await markRunning(job.id);
        try {
          const result = await processJob(job);
          await markCompleted(job.id, {
            runtime: 'local-worker',
            ...result,
          });
        } catch (error) {
          await markFailed(job.id, error);
        }
      }
    } catch (error) {
      console.error('[local-agent-runner] poll failed:', error);
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }
}

console.log('[local-agent-runner] starting', {
  pollMs: POLL_MS,
  workspaceRoot: WORKSPACE_ROOT,
});

runLoop().catch((error) => {
  console.error('[local-agent-runner] fatal', error);
  process.exit(1);
});
