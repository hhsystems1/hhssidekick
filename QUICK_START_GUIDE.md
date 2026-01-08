# SIDEKICK AGENT SYSTEM - QUICK START GUIDE

**Last Updated:** 2026-01-08

This guide gets you from prototype to working agent system in the fastest path possible.

---

## PREREQUISITES

Before you start:

```bash
# 1. Install dependencies (if not already done)
cd sidekick-react-pwa
npm install @anthropic-ai/sdk

# 2. Environment variables needed
# Create .env file with:
VITE_ANTHROPIC_API_KEY=your_api_key_here
VITE_SUPABASE_URL=https://zefcnmjqebpcnprhbmkc.supabase.co
VITE_SUPABASE_ANON_KEY=your_existing_key

# 3. Verify Supabase connection
# Your supabaseClient.ts is already set up
```

---

## PHASE 1: GET FIRST AGENT WORKING (2-3 days)

### Step 1: Database Schema (2 hours)

Create file: `supabase/migrations/001_initial_schema.sql`

```sql
-- Copy the full schema from AGENT_ARCHITECTURE_PLAN.md Section 2.1
-- Then run it in Supabase SQL Editor or via CLI
```

**Verify:** Run `SELECT * FROM users LIMIT 1;` in Supabase SQL editor

---

### Step 2: TypeScript Types (1 hour)

Create: `src/types/agents.ts`

```typescript
export type AgentType = 'orchestrator' | 'strategy' | 'systems' | 'technical' | 'creative' | 'reflection';
export type BehavioralMode = 'mirror' | 'structuring' | 'strategic' | 'execution';

export interface UserContext {
  userId: string;
  recentMessages: any[];
  activeProjects: any[];
  activeBusiness: any[];
  preferences: Record<string, any>;
  patterns: any[];
  currentDomain?: string;
}

export interface AgentRequest {
  messageContent: string;
  userContext: UserContext;
  conversationId: string;
  messageHistory: any[];
}

export interface AgentResponse {
  content: string;
  agentType: AgentType;
  behavioralMode: BehavioralMode;
  routingReason?: string;
  extractedEntities: any[];
  suggestedActions?: any[];
  metadata: {
    tokensUsed: number;
    executionTimeMs: number;
    confidence: number;
  };
}
```

---

### Step 3: Claude API Client (30 minutes)

Create: `src/services/ai/claude.ts`

```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY
});

export interface ClaudeRequest {
  systemPrompt: string;
  userMessage: string;
  maxTokens?: number;
  temperature?: number;
}

export async function callClaude(request: ClaudeRequest): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: request.maxTokens || 1500,
    temperature: request.temperature || 0.5,
    system: request.systemPrompt,
    messages: [{ role: 'user', content: request.userMessage }]
  });

  const content = response.content[0];
  if (content.type === 'text') {
    return content.text;
  }

  throw new Error('Unexpected response type');
}
```

**Test:**

```typescript
// Run this in a test file or console
const response = await callClaude({
  systemPrompt: 'You are a helpful assistant.',
  userMessage: 'Say hello!'
});
console.log(response);
```

---

### Step 4: System Prompts (30 minutes)

Create: `src/config/systemPrompts.ts`

```typescript
export const MASTER_CONTEXT_PROFILE = `You are Sidekick, a thinking partner designed to reduce cognitive load and help users think clearly.

CORE PHILOSOPHY:
1. Clarify before optimizing
2. Structure without constraining
3. Progress over perfection
4. Context persistence matters more than clever answers
5. Ask better questions than the user is asking themselves

COMMUNICATION STYLE:
- Be calm, grounded, analytical, collaborative
- Avoid: hype language, motivational clichés
- Prefer: "Here's how I'm seeing it...", "Let me reflect this back..."

You do NOT replace the user's judgment. You augment it.`;

export const REFLECTION_SYSTEM_PROMPT = `${MASTER_CONTEXT_PROFILE}

You are the REFLECTION specialist within Sidekick.
Your role: Help the user think clearly, surface assumptions, provide perspective.
You are the generalist thinking partner.`;
```

---

### Step 5: Base Specialist (1 hour)

Create: `src/agents/specialists/base.ts`

```typescript
import { AgentRequest, AgentResponse, AgentType, BehavioralMode } from '@/types/agents';
import { callClaude } from '@/services/ai/claude';

export abstract class BaseSpecialist {
  abstract readonly type: AgentType;
  abstract readonly domain: string;

  async process(request: AgentRequest, mode: BehavioralMode): Promise<AgentResponse> {
    const startTime = Date.now();

    const prompt = this.buildPrompt(request, mode);
    const rawResponse = await callClaude({
      systemPrompt: prompt.system,
      userMessage: prompt.user,
      maxTokens: 1500,
      temperature: 0.5
    });

    return {
      content: rawResponse,
      agentType: this.type,
      behavioralMode: mode,
      extractedEntities: [],
      metadata: {
        tokensUsed: 0,
        executionTimeMs: Date.now() - startTime,
        confidence: 0.8
      }
    };
  }

  protected abstract buildPrompt(
    request: AgentRequest,
    mode: BehavioralMode
  ): { system: string; user: string };
}
```

---

### Step 6: Reflection Agent (1 hour)

Create: `src/agents/specialists/reflection.ts`

```typescript
import { BaseSpecialist } from './base';
import { AgentRequest, AgentType, BehavioralMode } from '@/types/agents';
import { REFLECTION_SYSTEM_PROMPT } from '@/config/systemPrompts';

export class ReflectionAgent extends BaseSpecialist {
  readonly type: AgentType = 'reflection';
  readonly domain = 'Clarity, Thinking, Perspective';

  protected buildPrompt(
    request: AgentRequest,
    mode: BehavioralMode
  ): { system: string; user: string } {

    const system = `${REFLECTION_SYSTEM_PROMPT}

CURRENT BEHAVIORAL MODE: ${mode}

${this.getModeInstructions(mode)}`;

    const conversationHistory = request.messageHistory
      .slice(-5)
      .map(m => `${m.sender}: ${m.content}`)
      .join('\n');

    const user = `CONVERSATION HISTORY:
${conversationHistory}

CURRENT MESSAGE:
${request.messageContent}

Respond in ${mode} mode. Be calm, grounded, and help the user think clearly.`;

    return { system, user };
  }

  private getModeInstructions(mode: BehavioralMode): string {
    switch (mode) {
      case 'mirror':
        return 'Mirror mode: Reflect their thinking back in clearer language.';
      case 'structuring':
        return 'Structuring mode: Help organize their thoughts into frameworks.';
      case 'strategic':
        return 'Strategic mode: Pressure-test ideas, highlight tradeoffs.';
      case 'execution':
        return 'Execution mode: Break into concrete next steps.';
      default:
        return '';
    }
  }
}
```

---

### Step 7: Simple Agent Entry Point (30 minutes)

Create: `src/agents/index.ts`

```typescript
import { AgentRequest, AgentResponse } from '@/types/agents';
import { ReflectionAgent } from './specialists/reflection';

const reflectionAgent = new ReflectionAgent();

export async function processWithAgents(
  request: AgentRequest
): Promise<AgentResponse> {
  try {
    // For now, always use reflection agent in mirror mode
    // We'll add orchestration later
    const response = await reflectionAgent.process(request, 'mirror');

    console.log('🤖 Agent response:', response.content.substring(0, 100) + '...');

    return response;
  } catch (error) {
    console.error('Agent processing error:', error);
    throw error;
  }
}
```

---

### Step 8: Wire Up to UI (1 hour)

Update: `src/App.tsx`

Find the form submit handler (line 186) and replace the webhook call:

```typescript
// BEFORE (lines 204-232):
// const res = await fetch(WEBHOOK_URL, ...

// AFTER:
import { processWithAgents } from './agents';

// Inside the form onSubmit handler:
setIsSending(true);
try {
  // Build minimal context
  const userContext = {
    userId: 'demo-user', // Replace with real auth later
    recentMessages: [],
    activeProjects: [],
    activeBusiness: [],
    preferences: {},
    patterns: []
  };

  // Call agent system
  const agentResponse = await processWithAgents({
    messageContent: text,
    userContext,
    conversationId: activeChat,
    messageHistory: activeMessages
  });

  // Display agent response
  const botMsg: Message = {
    id: (Date.now() + 1).toString(),
    text: agentResponse.content,
    sender: 'bot',
    timestamp: new Date(),
  };

  setChats((prev) =>
    prev.map((c) =>
      c.id === activeChat
        ? { ...c, messages: [...c.messages, botMsg], lastMessage: agentResponse.content }
        : c
    )
  );
} catch (err: any) {
  setError('Agent processing failed: ' + err.message);
} finally {
  setIsSending(false);
}
```

---

### Step 9: Test First Agent (15 minutes)

```bash
# Start dev server
npm run dev

# Open browser, go to Chat view
# Send message: "I'm thinking about starting a solar business"
# Should get response from Reflection agent
```

**What to verify:**
- Message sends without errors
- Response appears in chat
- Response tone matches "calm, grounded, analytical"
- Console shows `🤖 Agent response:...`

---

## PHASE 2: ADD PERSISTENCE (1-2 days)

### Step 10: Message Storage (2 hours)

Create: `src/services/memory/conversationStore.ts`

```typescript
import { supabase } from '@/lib/supabaseClient';

export async function saveMessage(params: {
  conversationId: string;
  sender: 'user' | 'assistant';
  content: string;
  agentType?: string;
  behavioralMode?: string;
}) {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: params.conversationId,
      sender: params.sender,
      content: params.content,
      agent_type: params.agentType,
      behavioral_mode: params.behavioralMode
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getConversationMessages(conversationId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}
```

Update App.tsx to save messages:

```typescript
// After user sends message
await saveMessage({
  conversationId: activeChat,
  sender: 'user',
  content: text
});

// After agent responds
await saveMessage({
  conversationId: activeChat,
  sender: 'assistant',
  content: agentResponse.content,
  agentType: agentResponse.agentType,
  behavioralMode: agentResponse.behavioralMode
});
```

### Step 11: Load Messages on Mount (1 hour)

Update App.tsx `useEffect`:

```typescript
useEffect(() => {
  async function loadConversations() {
    // For now, use hardcoded conversation IDs
    // Later: fetch from database
    const conv1Messages = await getConversationMessages('1');
    const conv2Messages = await getConversationMessages('2');

    const initialChats: Chat[] = [
      {
        id: '1',
        name: 'Support Team',
        lastMessage: conv1Messages[conv1Messages.length - 1]?.content || 'Start chatting',
        unread: 0,
        avatar: '👨‍💻',
        isOnline: true,
        messages: conv1Messages.map(m => ({
          id: m.id,
          text: m.content,
          sender: m.sender,
          timestamp: new Date(m.created_at)
        }))
      },
      // ... conv2 similar
    ];

    setChats(initialChats);
    if (initialChats.length > 0) setActiveChat(initialChats[0].id);
  }

  loadConversations();
}, []);
```

**Test:** Send messages, refresh page, verify messages persist

---

## PHASE 3: ADD ORCHESTRATION (2-3 days)

### Step 12: Mode Detection (2 hours)

Create: `src/agents/orchestrator/modeDetector.ts`

Copy implementation from AGENT_ARCHITECTURE_PLAN.md Section 4.1

### Step 13: Routing Logic (3 hours)

Create: `src/agents/orchestrator/router.ts`

Copy routing rules from architecture plan

### Step 14: Orchestrator (3 hours)

Create: `src/agents/orchestrator/index.ts`

Copy orchestrator implementation from architecture plan

### Step 15: Additional Specialists (4 hours)

Create each:
- `src/agents/specialists/strategy.ts`
- `src/agents/specialists/systems.ts`
- `src/agents/specialists/technical.ts`

Copy implementations from architecture plan

### Step 16: Wire Up Orchestrator (1 hour)

Update `src/agents/index.ts`:

```typescript
import { orchestrate } from './orchestrator';
import { StrategyAgent } from './specialists/strategy';
import { SystemsAgent } from './specialists/systems';
import { TechnicalAgent } from './specialists/technical';
import { ReflectionAgent } from './specialists/reflection';

const specialists = {
  strategy: new StrategyAgent(),
  systems: new SystemsAgent(),
  technical: new TechnicalAgent(),
  reflection: new ReflectionAgent()
};

export async function processWithAgents(request: AgentRequest): Promise<AgentResponse> {
  // 1. Orchestrator decides routing
  const routing = await orchestrate(request);

  console.log(`🎯 Routing to ${routing.specialist} in ${routing.mode} mode`);

  // 2. Get specialist
  const specialist = specialists[routing.specialist];

  // 3. Process
  const response = await specialist.process(request, routing.mode);
  response.routingReason = routing.reasoning;

  return response;
}
```

**Test different message types:**
- "Should I use PPA or direct sales?" → Strategy agent
- "How do I automate lead follow-ups?" → Systems agent
- "What tech stack should I use?" → Technical agent
- "Help me think through this idea..." → Reflection agent

---

## PHASE 4: CONTEXT INTEGRATION (2-3 days)

### Step 17: Context Retrieval (3 hours)

Create: `src/services/memory/contextRetrieval.ts`

Copy implementation from architecture plan Section 6.1

### Step 18: Create Demo Context (1 hour)

In Supabase SQL editor:

```sql
-- Insert demo user
INSERT INTO users (id, email, preferences)
VALUES ('demo-user-123', 'demo@example.com', '{}');

-- Insert demo business
INSERT INTO context_items (user_id, type, title, description, status)
VALUES (
  'demo-user-123',
  'business',
  'Helping Hands Solar',
  'Solar installation business focusing on residential PPAs in Colorado',
  'active'
);

-- Insert demo project
INSERT INTO context_items (user_id, type, title, description, status, tags)
VALUES (
  'demo-user-123',
  'project',
  'Q1 Lead Generation Campaign',
  'Facebook and Clean Energy Experts lead generation for residential solar',
  'active',
  ARRAY['solar', 'marketing', 'leads']
);
```

### Step 19: Wire Context into Agents (1 hour)

Update App.tsx:

```typescript
import { getUserContext } from './services/memory/contextRetrieval';

// Inside form submit:
const userContext = await getUserContext('demo-user-123', activeChat);

const agentResponse = await processWithAgents({
  messageContent: text,
  userContext, // Now includes real context!
  conversationId: activeChat,
  messageHistory: activeMessages
});
```

**Test:**
- Send "What should I focus on?"
- Agent should mention your solar business and Q1 campaign

---

## PHASE 5: QUICK CAPTURE (1 day)

### Step 20: Inbox Service (2 hours)

Create: `src/services/inbox/inboxService.ts`

```typescript
import { supabase } from '@/lib/supabaseClient';

export async function saveToInbox(userId: string, content: string) {
  const { data, error } = await supabase
    .from('inbox')
    .insert({
      user_id: userId,
      content,
      processed: false
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function processInboxItem(inboxId: string) {
  // Basic classification
  const { data: item } = await supabase
    .from('inbox')
    .select('*')
    .eq('id', inboxId)
    .single();

  if (!item) return;

  // Simple keyword-based classification
  const content = item.content.toLowerCase();
  let classification = 'note';

  if (content.includes('remind') || content.includes('todo')) {
    classification = 'task';
  } else if (content.includes('idea') || content.includes('maybe')) {
    classification = 'idea';
  } else if (content.includes('project') || content.includes('campaign')) {
    classification = 'project';
  }

  // Update inbox item
  await supabase
    .from('inbox')
    .update({
      processed: true,
      processed_at: new Date().toISOString(),
      classification
    })
    .eq('id', inboxId);

  return { classification };
}
```

### Step 21: Wire Up SidekickHome (1 hour)

Update `src/SidekickHome.tsx`:

```typescript
import { saveToInbox, processInboxItem } from './services/inbox/inboxService';

const handleSave = async () => {
  const trimmed = captureText.trim();
  if (!trimmed) {
    setCaptureStatus('Nothing to save yet.');
    return;
  }

  try {
    const inboxItem = await saveToInbox('demo-user-123', trimmed);
    const result = await processInboxItem(inboxItem.id);

    setCaptureStatus(`Saved as ${result.classification}. Processing...`);
    setCaptureText('');
  } catch (error) {
    setCaptureStatus('Error saving. Please try again.');
  }
};
```

**Test:** Type in Quick Capture, click Save, verify saved to database

---

## QUICK WINS CHECKLIST

After completing the above, you should have:

- [ ] ✅ Messages sent to Claude instead of n8n
- [ ] ✅ One working agent (Reflection)
- [ ] ✅ Messages persist in Supabase
- [ ] ✅ Conversations load from database
- [ ] ✅ Multiple specialist agents (Strategy, Systems, Technical)
- [ ] ✅ Orchestrator routing to correct agent
- [ ] ✅ Context from database included in prompts
- [ ] ✅ Quick Capture saves to database
- [ ] ✅ Agents respond in appropriate mode (mirror/strategic/execution)

---

## DEBUGGING TIPS

**Problem:** "Failed to contact webhook"
- **Solution:** Remove old webhook code, ensure you're calling `processWithAgents()`

**Problem:** Agents give generic responses
- **Solution:** Check that context is actually being passed, verify database has context items

**Problem:** TypeScript errors
- **Solution:** Install types: `npm install -D @types/node`

**Problem:** Supabase connection fails
- **Solution:** Verify environment variables, check Supabase dashboard for API keys

**Problem:** Messages don't persist
- **Solution:** Check Supabase SQL editor for errors, verify schema was created

---

## MONITORING SUCCESS

**Week 1 Success:**
```
User: "I'm thinking about a solar business"
Agent: [Reflection in mirror mode]
      "Here's how I'm seeing it... You're exploring a solar business model.
       Before we structure this, what's drawing you to solar specifically?
       Is this about impact, market opportunity, or something else?"
```

**Week 2 Success:**
```
User: "Should I do PPAs or direct sales?"
Agent: [Strategy in strategic mode]
      "Here's the tradeoff I'm seeing...

      PPAs: Higher customer acquisition (lower barrier), recurring revenue,
      but slower payback and requires capital partners.

      Direct sales: Immediate revenue, simpler operations, but higher
      customer resistance and requires strong sales process.

      What's your constraint: capital, time to revenue, or sales capacity?"
```

**Week 3 Success:**
```
User: "What should I focus on?"
Agent: [Pulls context: Q1 Lead Gen Campaign, Helping Hands Solar business]
      "Looking at your Q1 campaign - you have 12 new leads from Facebook and
       Clean Energy Experts. One thing worth pressure-testing: are you set up
       to handle the follow-up cadence for 12 simultaneous conversations?

       If not, that's your constraint before adding more lead volume."
```

This shows the agent is:
- Using context ✅
- Being strategic ✅
- Asking better questions ✅
- Reducing cognitive load ✅

---

## NEXT PHASE PREVIEW

After Quick Start (Weeks 1-3), you can add:

**Week 4-5: Polish**
- Communication style enforcement
- Entity extraction and linking
- Agent activity logging for dashboard
- Error handling and fallbacks

**Week 6+: Intelligence**
- Pattern detection and learning
- Knowledge graph for context relationships
- Proactive agent suggestions
- Multi-domain context switching

But for now: Focus on getting the core loop working.

**Core Loop:**
```
User types →
Context retrieved →
Orchestrator routes →
Specialist responds →
Message saved →
User feels heard and clearer
```

Get that loop solid, then expand.

---

## HELP & RESOURCES

**Architecture Details:** See `AGENT_ARCHITECTURE_PLAN.md`

**Database Schema:** Section 2.1 of architecture plan

**Full Code Examples:** Sections 4-6 of architecture plan

**Stuck?** Common issues:
1. API key not set → Check `.env` file
2. Database schema wrong → Rerun migration
3. Types not found → Check import paths

---

Ready to build? Start with Phase 1, Step 1. Ship incrementally. Test each step before moving forward.

You've got this. 🚀
