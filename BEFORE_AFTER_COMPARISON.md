# SIDEKICK: BEFORE & AFTER COMPARISON

A visual guide showing the transformation from prototype to intelligent system.

---

## CURRENT STATE (Before)

### What Happens When User Sends a Message

```
User types: "Should I use PPAs or direct sales for solar?"
      ↓
App.tsx line 205: fetch(WEBHOOK_URL)
      ↓
POST to n8n.helpinghandsystems.com/webhook/chat-webhook
      ↓
Payload: { message: "Should I...", chatId: "1" }
      ↓
[Black box - we don't control what n8n does]
      ↓
Response: Generic text from n8n workflow
      ↓
Display in chat
      ✗ No context passed
      ✗ No memory of previous conversations
      ✗ No domain awareness
      ✗ No mode detection
      ✗ No specialist routing
```

**Problems:**
- Conversation context lost (only current message sent)
- No knowledge of user's solar business
- No awareness of existing projects
- Can't remember what happened 5 minutes ago
- Generic responses without strategic thinking
- No persistence (refresh = amnesia)

---

## FUTURE STATE (After)

### What Happens When User Sends a Message

```
User types: "Should I use PPAs or direct sales for solar?"
      ↓
1. Context Retrieval
   getUserContext('user-123', 'conv-456')
      → Pulls from Supabase:
        • Last 10 messages from this conversation
        • Active projects: "Q1 Solar Lead Gen Campaign"
        • Active business: "Helping Hands Solar - CO residential market"
        • User patterns: Prefers analytical tone, asks strategic questions
        • Domain: solar_business
      ↓
2. Orchestrator Analysis
   orchestrate({ message, context, history })
      → Mode Detection:
        ✓ Detects decision language: "should I", "or"
        ✓ Mode: STRATEGIC (user is deciding)
      → Specialist Routing:
        ✓ Keywords: "business model" (PPA vs sales)
        ✓ Route to: STRATEGY AGENT
        ✓ Reasoning: "Evaluating business model tradeoffs in solar domain"
      ↓
3. Strategy Agent Processing
   StrategyAgent.process(request, mode='strategic')
      → Builds specialized prompt:
        • Master context profile (thinking partner philosophy)
        • Strategy domain expertise
        • Strategic mode instructions (pressure-test, highlight tradeoffs)
        • Decision framework (Leverage, Complexity, Reversibility, Alignment, Momentum)
        • User's full context (solar business, Colorado market, Q1 campaign)
      → Calls Claude API with rich context
      → Claude generates response following all guidelines
      ↓
4. Response Processing
   parseResponse(claudeOutput)
      → Extracts entities: [project: "Solar PPA", business: "Helping Hands Solar"]
      → Extracts actions: [validate_assumption, test_market_fit]
      → Enforces communication style:
        ✓ Removes "you should definitely"
        ✓ Replaces with "one approach to consider"
        ✓ Ensures calm, analytical tone
      ↓
5. Persistence
   saveMessage(conversationId, content, agentType, mode, entities)
      → Saves to Supabase messages table
      → Updates conversation last_message
      → Links extracted entities to context items
      → Logs agent activity for dashboard
      ↓
6. Display to User
   "Here's the tradeoff I'm seeing...

   PPAs: Lower customer barrier (no upfront cost), recurring revenue stream,
   but requires capital partners and slower payback.

   Direct sales: Immediate revenue, simpler operations, but higher customer
   resistance and needs strong sales infrastructure.

   Given your Q1 campaign targeting residential in Colorado - what's your
   current constraint: access to capital, time to first revenue, or sales capacity?

   That constraint should drive the model choice."

   [Metadata shown in UI: Strategy Agent • Strategic Mode]
```

**Benefits:**
- ✅ Full conversation context included
- ✅ Knows about user's solar business
- ✅ References active Q1 campaign
- ✅ Strategic mode = pressure-tests decision
- ✅ Uses decision framework (leverage, complexity, etc.)
- ✅ Asks better questions than user asked themselves
- ✅ Response persists in database
- ✅ Entities extracted and linked
- ✅ Can reference this decision in future conversations

---

## FEATURE COMPARISON TABLE

| Feature | Before (Current) | After (With Agents) |
|---------|-----------------|-------------------|
| **Message Handling** | POST to n8n webhook | Multi-agent orchestration |
| **Context Awareness** | ❌ None | ✅ Full user context |
| **Memory** | ❌ Lost on refresh | ✅ Persistent in Supabase |
| **Conversation History** | ❌ Only current message | ✅ Last 10+ messages |
| **Domain Knowledge** | ❌ Generic | ✅ Knows businesses, projects |
| **Specialist Routing** | ❌ No routing | ✅ Strategy/Systems/Technical/Creative/Reflection |
| **Behavioral Modes** | ❌ No modes | ✅ Mirror/Structuring/Strategic/Execution |
| **Decision Framework** | ❌ No framework | ✅ 5-factor analysis |
| **Communication Style** | ❌ Whatever n8n returns | ✅ Enforced: calm, grounded, analytical |
| **Entity Extraction** | ❌ No extraction | ✅ Auto-extracts projects, tools, people |
| **Quick Capture** | ❌ Fake (status message) | ✅ Saves to DB, classifies, processes |
| **Home Dashboard** | ❌ Hardcoded demo data | ✅ Real-time from database |
| **Agent Activity** | ❌ Static text | ✅ Live agent logs |
| **Pattern Learning** | ❌ No learning | ✅ Learns user preferences |
| **Knowledge Graph** | ❌ No relationships | ✅ Links context items |
| **Proactive Suggestions** | ❌ No proactivity | ✅ Background agents surface insights |

---

## CODE COMPARISON

### Before: Message Sending (App.tsx:204-232)

```typescript
// Send to webhook
setIsSending(true);
try {
  const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: text, chatId: activeChat }),
    //                     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    //                     Only current message, no context!
  });
  const data = await res.json().catch(() => ({}));

  // Try to extract a reply (fragile parsing)
  const replyText =
    (data && (data.reply || data.message || data.text)) ||
    (Array.isArray(data) && (data[0]?.text || data[0]?.message)) ||
    (typeof data === 'string' ? data : null) ||
    'Received.';

  // Display response
  const botMsg: Message = {
    id: (Date.now() + 1).toString(),
    text: replyText,  // Generic text, no metadata
    sender: 'bot',
    timestamp: new Date(),
  };

  setChats(prev => /* update local state only */);
  // ❌ Nothing saved to database
  // ❌ Lost on refresh
} catch (err: any) {
  setError('Failed to contact webhook');
}
```

---

### After: Message Sending (App.tsx - Updated)

```typescript
// Get full user context
const userContext = await getUserContext(userId, activeChat);
// ✅ Retrieves: businesses, projects, patterns, preferences

// Save user message to database immediately
await saveMessage({
  conversationId: activeChat,
  sender: 'user',
  content: text
});

setIsSending(true);
try {
  // Process with intelligent agent system
  const agentResponse = await processWithAgents({
    messageContent: text,
    userContext,              // ✅ Full context
    conversationId: activeChat,
    messageHistory: activeMessages  // ✅ Conversation history
  });
  // Returns:
  // - Specialized response from correct agent
  // - Routing reason (why this agent was chosen)
  // - Behavioral mode used
  // - Extracted entities
  // - Suggested actions

  // Save agent response to database
  await saveMessage({
    conversationId: activeChat,
    sender: 'assistant',
    content: agentResponse.content,
    agentType: agentResponse.agentType,        // e.g., 'strategy'
    behavioralMode: agentResponse.behavioralMode,  // e.g., 'strategic'
    entities: agentResponse.extractedEntities
  });
  // ✅ Persisted with full metadata
  // ✅ Can analyze agent performance
  // ✅ Entities linked to context

  // Display response with metadata
  const botMsg: Message = {
    id: (Date.now() + 1).toString(),
    text: agentResponse.content,
    sender: 'bot',
    timestamp: new Date(),
    agentType: agentResponse.agentType,
    behavioralMode: agentResponse.behavioralMode
  };

  setChats(prev => /* update local state */);
  // ✅ Also saved to database
  // ✅ Survives refresh

  // Update agent activity dashboard
  await logAgentActivity({
    userId,
    agentType: agentResponse.agentType,
    action: 'processed_message',
    conversationId: activeChat,
    metadata: agentResponse.metadata
  });
  // ✅ Visible in Home dashboard

} catch (err: any) {
  setError('Agent processing failed: ' + err.message);
  // Fallback to reflection agent in mirror mode
  const fallback = await reflectionAgent.process(request, 'mirror');
  // ✅ Graceful degradation
}
```

---

## CONVERSATION EXAMPLES

### Example 1: First Mention of Business

**Before:**
```
User: "I'm starting a solar business in Colorado"
Bot:  "That sounds great! How can I help you today?"
      [Generic, no memory]

User: "What should I focus on?" [5 minutes later]
Bot:  "It depends on your goals. What are you working on?"
      [Already forgot about solar business]
```

**After:**
```
User: "I'm starting a solar business in Colorado"
Agent: [Reflection • Mirror mode]
       "Here's how I'm seeing it... You're exploring a solar business
        in Colorado specifically. Before we structure this, a few things
        worth clarifying:

        - Residential, commercial, or both?
        - What's your positioning - installer, sales, or full stack?
        - Do you already have leads/pipeline or starting from zero?

        These will shape whether we focus on market validation, operations,
        or go-to-market first."

       [Behind scenes: Creates context_item type='business' for "Colorado Solar Business"]

User: "What should I focus on?" [5 minutes later]
Agent: [Strategy • Execution mode]
       [Retrieves: Colorado Solar Business context]
       "Looking at your Colorado solar business - if you're starting from
        zero, your constraint is likely pipeline, not operations.

        One approach: Start with a narrow ICP (ideal customer profile) -
        maybe residential homeowners in specific zip codes with high sun
        exposure and above-average income.

        Test a small lead gen campaign (Facebook or Google LSA) before
        building out infrastructure. Validate demand first.

        What's your budget for testing?"

       ✅ Remembers solar business
       ✅ Provides strategic next step
       ✅ Asks clarifying question
```

---

### Example 2: Decision Support

**Before:**
```
User: "Should I hire a full-time closer or use an agency?"
Bot:  "Both options have pros and cons. A full-time closer gives you
       more control, while an agency provides flexibility. What do you
       think works best for your situation?"
       [Vague, no analysis, no context]
```

**After:**
```
User: "Should I hire a full-time closer or use an agency?"
Agent: [Strategy • Strategic mode]
       [Context: Colorado Solar Business, early stage]

       "Here's the tradeoff I'm seeing...

       FULL-TIME CLOSER:
       ✓ Leverage: Low initially (1 person), but builds institutional knowledge
       ✓ Complexity: Higher (payroll, training, management overhead)
       ✓ Reversibility: Low (severance costs, emotional toll)
       ✓ Alignment: High (dedicated to your business)
       ✓ Momentum: Slower to start (hiring + ramp time)

       AGENCY:
       ✓ Leverage: Higher immediately (team of closers)
       ✓ Complexity: Lower (just pay per close)
       ✓ Reversibility: High (can switch quickly)
       ✓ Alignment: Lower (handling multiple clients)
       ✓ Momentum: Faster (starts this week)

       Given you're early stage (based on your Q1 campaign just starting):
       One thing worth pressure-testing - do you have enough deal flow to
       keep a full-time closer busy yet?

       If you're under ~20 qualified appointments/month, an agency might
       compound faster while you prove out the model. Once you hit consistent
       volume, bring it in-house to capture margin.

       What's your current appointment volume?"

       ✅ Uses decision framework
       ✅ Contextual to business stage
       ✅ Asks better question (volume)
       ✅ Suggests phased approach
```

---

### Example 3: Quick Capture Processing

**Before (SidekickHome.tsx):**
```
User types in Quick Capture:
"Remind me to test new PPA ad in Colorado and send Jo the numbers"

Clicks "Save to inbox"

Result: setCaptureStatus('Saved to Sidekick inbox (demo only).')
        [NOTHING ACTUALLY HAPPENS]
        [Refresh page = gone forever]
```

**After:**
```
User types in Quick Capture:
"Remind me to test new PPA ad in Colorado and send Jo the numbers"

Clicks "Save to inbox"

Behind the scenes:
1. Saved to Supabase inbox table
2. Inbox processor runs:
   - Classification: "task" (detected "remind me")
   - Entities extracted:
     • Ad campaign: "PPA ad"
     • Location: "Colorado"
     • Person: "Jo"
   - Links to existing context:
     • Business: "Colorado Solar Business"
     • Project: "Q1 Lead Generation Campaign"
3. Creates context_item type='task':
   - Title: "Test PPA ad in Colorado"
   - Properties: { assigned_to: "user", mention: "Jo" }
   - Linked to: Q1 campaign project
4. Agent logs activity:
   - "Inbox agent processed 1 item → created task"

Result shown: "Saved as task. Linked to Q1 Lead Gen Campaign."

Later in chat:
User: "What should I work on today?"
Agent: [Execution mode]
       "Looking at your active tasks, you mentioned testing a new PPA ad
        in Colorado and sharing numbers with Jo. If you haven't done that
        yet, that could inform your Q1 campaign direction.

        Want to break that down into specific steps?"

       ✅ Remembers the quick capture
       ✅ Surfaces it proactively
       ✅ Links it to larger context
```

---

## HOME DASHBOARD COMPARISON

### Before (All Hardcoded)

```typescript
// SidekickHome.tsx lines 84-124
<ul>
  <li>
    <div>Review new residential solar leads</div>
    <div>From: Facebook & Clean Energy Experts</div>
    <span>Needs decision</span>
  </li>
  <li>
    <div>Check agent calls + appointment calendar</div>
    <span>15–20 min</span>
  </li>
  <li>
    <div>Outline one content asset (solar or health)</div>
    <span>Deep work</span>
  </li>
</ul>

// Lines 188-202: Static agent activity
"Sales agent called 5 new solar leads" // FAKE
"Ops agent synced Discord notes to Notion" // FAKE
"Content agent drafted 3 social posts" // FAKE

// Lines 258-278: Static metrics
<div>New leads: 12</div>  // HARDCODED
<div>Booked calls: 3</div>  // HARDCODED
<div>Agent actions: 27</div>  // HARDCODED
```

**Problems:**
- Zero real data
- Numbers never change
- No connection to actual work
- Just a visual mockup

---

### After (Real-Time Data)

```typescript
// SidekickHome.tsx - Updated

// PRIORITY FOCUS - Generated from context
const { data: priorities } = await supabase
  .from('context_items')
  .select('*')
  .eq('user_id', userId)
  .eq('type', 'task')
  .eq('status', 'active')
  .order('properties->priority', { ascending: false })
  .limit(3);

// Displays:
<ul>
  {priorities.map(task => (
    <li key={task.id}>
      <div>{task.title}</div>
      <div>{task.description}</div>
      <span>{task.properties.tag}</span>
    </li>
  ))}
</ul>

// AGENT ACTIVITY - Real logs from database
const { data: activity } = await supabase
  .from('agent_logs')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(5);

// Displays real activity:
"Strategy agent analyzed PPA vs direct sales decision" // REAL
"Inbox agent processed quick capture → created 2 tasks" // REAL
"Reflection agent helped clarify Q1 campaign goals" // REAL

// METRICS - Calculated from real data
const leadsCount = await supabase
  .from('context_items')
  .select('count')
  .eq('type', 'person')
  .eq('tags', ['lead'])
  .gte('created_at', startOfToday());

const callsCount = await supabase
  .from('context_items')
  .select('count')
  .eq('type', 'task')
  .eq('tags', ['call'])
  .gte('properties->scheduled_date', today());

const agentActionsCount = await supabase
  .from('agent_logs')
  .select('count')
  .gte('created_at', startOfToday());

<div>New leads: {leadsCount}</div>  // DYNAMIC
<div>Booked calls: {callsCount}</div>  // DYNAMIC
<div>Agent actions: {agentActionsCount}</div>  // DYNAMIC
```

**Benefits:**
- ✅ Real data from database
- ✅ Updates as you work
- ✅ Reflects actual agent activity
- ✅ Actionable priorities
- ✅ Live metrics

---

## TECHNICAL ARCHITECTURE COMPARISON

### Before

```
┌─────────────────┐
│   React UI      │
│  (App.tsx)      │
└────────┬────────┘
         │ POST { message, chatId }
         ↓
┌─────────────────┐
│  n8n Webhook    │ ← Black box, we don't control
│  (external)     │
└────────┬────────┘
         │ Returns text
         ↓
┌─────────────────┐
│  Display in UI  │
│  (ephemeral     │
│   useState)     │
└─────────────────┘

No database
No context
No memory
No intelligence
```

---

### After

```
┌──────────────────────────────────────────────┐
│              React UI Layer                  │
│  App.tsx, SidekickHome.tsx                   │
│  (Presentational only)                       │
└──────────────┬───────────────────────────────┘
               │ useAgent() hook
               ↓
┌──────────────────────────────────────────────┐
│           Agent System Layer                 │
│  ┌────────────────────────────────────────┐  │
│  │  Orchestrator                          │  │
│  │  - Mode Detection                      │  │
│  │  - Specialist Routing                  │  │
│  └────────┬───────────────────────────────┘  │
│           │                                   │
│  ┌────────┴───────────────────────────────┐  │
│  │  Specialist Agents                     │  │
│  │  - Strategy  - Systems                 │  │
│  │  - Technical - Creative                │  │
│  │  - Reflection                          │  │
│  └────────┬───────────────────────────────┘  │
└───────────┼───────────────────────────────────┘
            │
            ↓
┌──────────────────────────────────────────────┐
│         Integration Layer                    │
│  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Claude API   │  │  Context Retrieval   │  │
│  │ Client       │  │  - Knowledge Graph   │  │
│  └──────────────┘  │  - Pattern Learning  │  │
│                    └──────────────────────┘  │
└───────────┬──────────────────────────────────┘
            │
            ↓
┌──────────────────────────────────────────────┐
│         Supabase Database                    │
│  - users                                     │
│  - conversations                             │
│  - messages                                  │
│  - context_items (projects, businesses)      │
│  - context_relationships (knowledge graph)   │
│  - inbox (quick capture)                     │
│  - agent_logs (activity tracking)            │
│  - user_patterns (learning)                  │
└──────────────────────────────────────────────┘

✅ Full persistence
✅ Rich context
✅ Multi-agent intelligence
✅ Pattern learning
✅ Proactive behavior
```

---

## SUMMARY: THE TRANSFORMATION

**Before:** Visual prototype with fake data and no brain

**After:** Intelligent thinking partner that:
- Remembers context across sessions
- Routes to specialist agents based on need
- Adapts communication mode to user state
- Persists all conversations and insights
- Learns user patterns over time
- Proactively surfaces relevant information
- Connects context across projects and domains

**Vision Alignment:**
- Before: 5%
- After: 85%

The gap between "pretty UI" and "thinking partner" is this agent system.

---

See `AGENT_ARCHITECTURE_PLAN.md` for full implementation details.
See `QUICK_START_GUIDE.md` for step-by-step build instructions.
