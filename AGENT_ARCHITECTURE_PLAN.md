# SIDEKICK AGENT ARCHITECTURE PLAN

**Version:** 1.0
**Date:** 2026-01-08
**Purpose:** Complete blueprint for implementing the Sidekick multi-agent thinking partner system

---

## TABLE OF CONTENTS

1. [System Overview](#1-system-overview)
2. [Data Models & Database Schema](#2-data-models--database-schema)
3. [File Structure](#3-file-structure)
4. [Core Components](#4-core-components)
5. [Agent Implementations](#5-agent-implementations)
6. [Integration Layer](#6-integration-layer)
7. [Execution Plan](#7-execution-plan)
8. [Testing Strategy](#8-testing-strategy)

---

## 1. SYSTEM OVERVIEW

### 1.1 Architecture Philosophy

The Sidekick agent system follows a **hierarchical multi-agent pattern** with:

- **One Orchestrator** - Routes requests, maintains global context, coordinates specialists
- **Five Specialists** - Domain experts that handle specific types of thinking
- **Four Behavioral Modes** - Dynamic response patterns based on user state
- **Persistent Context Engine** - Remembers across conversations, projects, and domains

### 1.2 Information Flow

```
User Input
    ↓
Context Retrieval (last 10 messages + relevant domain context)
    ↓
Orchestrator Agent
    ├─ Analyzes intent
    ├─ Detects user state (brainstorming? deciding? executing?)
    ├─ Selects behavioral mode
    └─ Routes to specialist
         ↓
Specialist Agent (Strategy | Systems | Technical | Creative | Reflection)
    ├─ Receives full context
    ├─ Applies domain expertise
    ├─ Follows communication style rules
    └─ Returns structured response
         ↓
Response Processor
    ├─ Enforces tone/style guidelines
    ├─ Extracts entities (projects, tools, people)
    ├─ Updates context store
    └─ Logs agent activity
         ↓
User Output
```

### 1.3 Key Design Principles

1. **Context First** - Every agent interaction includes full relevant context
2. **Stateless Agents** - Agents don't hold state; context engine does
3. **Explicit Routing** - Orchestrator makes routing decisions transparently
4. **Mode Awareness** - Behavioral mode drives communication style
5. **Memory Persistence** - Every interaction updates the knowledge graph

---

## 2. DATA MODELS & DATABASE SCHEMA

### 2.1 Supabase Schema

```sql
-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  preferences JSONB DEFAULT '{}'::jsonb,
  -- preferences: { tone: "analytical", verbosity: "concise", ... }
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================
-- CONVERSATIONS & MESSAGES
-- ============================================

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  archived BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb
  -- metadata: { domain: "solar_business", project_id: "...", ... }
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Agent metadata
  agent_type TEXT, -- 'orchestrator', 'strategy', 'systems', etc.
  behavioral_mode TEXT, -- 'mirror', 'structuring', 'strategic', 'execution'
  routing_reason TEXT, -- Why orchestrator chose this agent

  -- Structured data
  entities JSONB DEFAULT '[]'::jsonb,
  -- entities: [{ type: 'project', name: 'Solar PPA Campaign', id: '...' }]

  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX idx_messages_entities ON messages USING GIN(entities);

-- ============================================
-- CONTEXT MANAGEMENT
-- ============================================

-- Core context items: projects, ideas, tasks, notes
CREATE TABLE context_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('project', 'business', 'idea', 'task', 'note', 'tool', 'person', 'domain')),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT, -- 'active', 'archived', 'completed', 'idea'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Relationships
  parent_id UUID REFERENCES context_items(id), -- Hierarchical relationships
  related_ids UUID[], -- Related items

  -- Rich metadata
  properties JSONB DEFAULT '{}'::jsonb,
  -- properties: { budget: 50000, deadline: '2024-03-15', stack: ['React', 'Node'], ... }

  tags TEXT[] DEFAULT '{}',

  -- Full-text search
  search_vector TSVECTOR
);

CREATE INDEX idx_context_user_type ON context_items(user_id, type);
CREATE INDEX idx_context_status ON context_items(status);
CREATE INDEX idx_context_search ON context_items USING GIN(search_vector);
CREATE INDEX idx_context_tags ON context_items USING GIN(tags);

-- Update search vector automatically
CREATE TRIGGER context_search_update BEFORE INSERT OR UPDATE
  ON context_items FOR EACH ROW EXECUTE FUNCTION
  tsvector_update_trigger(search_vector, 'pg_catalog.english', title, description);

-- Relationships between context items (knowledge graph)
CREATE TABLE context_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_id UUID REFERENCES context_items(id) ON DELETE CASCADE,
  to_id UUID REFERENCES context_items(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  -- 'depends_on', 'part_of', 'uses_tool', 'assigned_to', 'related_to'
  strength FLOAT DEFAULT 1.0, -- 0.0 to 1.0, for weighted relevance
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(from_id, to_id, relationship_type)
);

CREATE INDEX idx_relationships_from ON context_relationships(from_id);
CREATE INDEX idx_relationships_to ON context_relationships(to_id);

-- ============================================
-- QUICK CAPTURE INBOX
-- ============================================

CREATE TABLE inbox (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,

  -- Agent processing results
  classification TEXT, -- 'project', 'task', 'idea', 'note'
  suggested_category TEXT,
  extracted_entities JSONB DEFAULT '[]'::jsonb,
  linked_context_ids UUID[],

  -- Final destination
  converted_to_id UUID REFERENCES context_items(id)
);

CREATE INDEX idx_inbox_user_processed ON inbox(user_id, processed);

-- ============================================
-- AGENT ACTIVITY LOGS
-- ============================================

CREATE TABLE agent_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL,
  action TEXT NOT NULL, -- 'routed', 'analyzed', 'suggested', 'processed'
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Context
  conversation_id UUID REFERENCES conversations(id),
  message_id UUID REFERENCES messages(id),
  inbox_id UUID REFERENCES inbox(id),

  -- Results
  input_summary TEXT,
  output_summary TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  -- metadata: { execution_time_ms: 1200, tokens_used: 450, confidence: 0.85 }

  success BOOLEAN DEFAULT TRUE,
  error_message TEXT
);

CREATE INDEX idx_agent_logs_user_time ON agent_logs(user_id, created_at DESC);
CREATE INDEX idx_agent_logs_type ON agent_logs(agent_type, created_at DESC);

-- ============================================
-- USER PREFERENCES & PATTERNS
-- ============================================

CREATE TABLE user_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  pattern_type TEXT NOT NULL,
  -- 'preferred_mode', 'communication_style', 'working_hours', 'topic_frequency'
  pattern_key TEXT NOT NULL,
  pattern_value JSONB NOT NULL,
  confidence FLOAT DEFAULT 0.5, -- 0.0 to 1.0
  last_observed_at TIMESTAMPTZ DEFAULT NOW(),
  observation_count INT DEFAULT 1,
  UNIQUE(user_id, pattern_type, pattern_key)
);

-- Example patterns:
-- type='preferred_mode', key='morning', value='{"mode": "execution", "confidence": 0.8}'
-- type='topic_frequency', key='solar_leads', value='{"count": 47, "avg_per_week": 8.5}'
```

### 2.2 TypeScript Types

```typescript
// src/types/agents.ts

export type AgentType =
  | 'orchestrator'
  | 'strategy'
  | 'systems'
  | 'technical'
  | 'creative'
  | 'reflection';

export type BehavioralMode =
  | 'mirror'       // Reflect thinking back in clearer language
  | 'structuring'  // Turn chaos into frameworks
  | 'strategic'    // Pressure-test ideas, highlight tradeoffs
  | 'execution';   // Break into actions, suggest next steps

export type ContextItemType =
  | 'project'
  | 'business'
  | 'idea'
  | 'task'
  | 'note'
  | 'tool'
  | 'person'
  | 'domain';

export interface UserContext {
  userId: string;
  recentMessages: Message[];
  activeProjects: ContextItem[];
  activeBusiness: ContextItem[];
  preferences: UserPreferences;
  patterns: UserPattern[];
  currentDomain?: string; // e.g., 'solar_business', 'health_business'
}

export interface AgentRequest {
  messageContent: string;
  userContext: UserContext;
  conversationId: string;
  messageHistory: Message[]; // Last N messages
}

export interface AgentResponse {
  content: string;
  agentType: AgentType;
  behavioralMode: BehavioralMode;
  routingReason?: string; // Why orchestrator chose this agent
  extractedEntities: Entity[];
  suggestedActions?: Action[];
  metadata: {
    tokensUsed: number;
    executionTimeMs: number;
    confidence: number;
  };
}

export interface Entity {
  type: ContextItemType;
  name: string;
  id?: string; // If linked to existing context item
  properties?: Record<string, any>;
}

export interface Action {
  type: 'create_project' | 'schedule_task' | 'link_context' | 'suggest_next_step';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  data: Record<string, any>;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
  agentType?: AgentType;
  behavioralMode?: BehavioralMode;
  entities?: Entity[];
}

export interface ContextItem {
  id: string;
  userId: string;
  type: ContextItemType;
  title: string;
  description?: string;
  status: string;
  properties: Record<string, any>;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 3. FILE STRUCTURE

```
sidekick-react-pwa/
├── src/
│   ├── agents/                          # Agent system core
│   │   ├── orchestrator/
│   │   │   ├── index.ts                 # Main orchestrator logic
│   │   │   ├── router.ts                # Routing decision engine
│   │   │   ├── modeDetector.ts          # Behavioral mode detection
│   │   │   └── prompts.ts               # Orchestrator system prompts
│   │   │
│   │   ├── specialists/
│   │   │   ├── base.ts                  # Base specialist class
│   │   │   ├── strategy.ts              # Strategy agent
│   │   │   ├── systems.ts               # Systems agent
│   │   │   ├── technical.ts             # Technical agent
│   │   │   ├── creative.ts              # Creative agent
│   │   │   └── reflection.ts            # Reflection agent
│   │   │
│   │   ├── modes/
│   │   │   ├── index.ts
│   │   │   ├── mirror.ts                # Mirror mode behavior
│   │   │   ├── structuring.ts           # Structuring mode behavior
│   │   │   ├── strategic.ts             # Strategic mode behavior
│   │   │   └── execution.ts             # Execution mode behavior
│   │   │
│   │   └── index.ts                     # Public API for agent system
│   │
│   ├── services/
│   │   ├── ai/
│   │   │   ├── claude.ts                # Claude API client
│   │   │   ├── promptBuilder.ts         # Dynamic prompt construction
│   │   │   ├── responseParser.ts        # Parse structured responses
│   │   │   └── contextWindow.ts         # Manage token limits
│   │   │
│   │   ├── memory/
│   │   │   ├── conversationStore.ts     # Save/retrieve messages
│   │   │   ├── contextStore.ts          # Context item CRUD
│   │   │   ├── knowledgeGraph.ts        # Relationship management
│   │   │   ├── patternDetector.ts       # Learn user patterns
│   │   │   └── contextRetrieval.ts      # Smart context fetching
│   │   │
│   │   ├── inbox/
│   │   │   ├── inboxService.ts          # Quick capture processing
│   │   │   ├── classifier.ts            # Classify inbox items
│   │   │   └── entityExtractor.ts       # Extract entities from text
│   │   │
│   │   └── logging/
│   │       └── agentLogger.ts           # Log agent activity
│   │
│   ├── config/
│   │   ├── systemPrompts.ts             # Master context profile + mode prompts
│   │   ├── communicationStyle.ts        # Tone/style rules
│   │   ├── decisionFramework.ts         # 5-factor evaluation criteria
│   │   └── agentConfig.ts               # Agent capabilities & routing rules
│   │
│   ├── hooks/
│   │   ├── useAgent.ts                  # React hook for agent interactions
│   │   ├── useContext.ts                # Access user context
│   │   ├── useInbox.ts                  # Quick capture hook
│   │   └── useConversation.ts           # Conversation management
│   │
│   ├── types/
│   │   ├── agents.ts                    # Agent-related types
│   │   ├── context.ts                   # Context & memory types
│   │   ├── database.ts                  # Supabase table types
│   │   └── index.ts                     # Type exports
│   │
│   ├── utils/
│   │   ├── entityLinker.ts              # Link extracted entities to context
│   │   ├── similarity.ts                # Semantic similarity (cosine, etc.)
│   │   └── validators.ts                # Input validation
│   │
│   ├── components/                      # Existing UI components
│   ├── lib/
│   │   └── supabaseClient.ts            # Existing Supabase client
│   │
│   ├── App.tsx                          # Updated with agent integration
│   ├── SidekickHome.tsx                 # Updated with real data
│   └── main.tsx
│
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql       # Database schema
│   └── seed.sql                         # Sample data for development
│
├── scripts/
│   └── generateTypes.ts                 # Generate TS types from Supabase
│
└── docs/
    ├── AGENT_GUIDE.md                   # How to add new agents
    └── CONTEXT_GUIDE.md                 # Context system documentation
```

---

## 4. CORE COMPONENTS

### 4.1 Orchestrator Agent

**File:** `src/agents/orchestrator/index.ts`

**Responsibilities:**
1. Receive user message + full context
2. Detect user's current state (brainstorming? deciding? executing?)
3. Determine behavioral mode (mirror, structuring, strategic, execution)
4. Route to appropriate specialist
5. Return routing decision with reasoning

**Key Logic:**

```typescript
// src/agents/orchestrator/index.ts

import { AgentRequest, AgentResponse, AgentType, BehavioralMode } from '@/types/agents';
import { detectMode } from './modeDetector';
import { routeToSpecialist } from './router';
import { buildOrchestratorPrompt } from './prompts';
import { callClaude } from '@/services/ai/claude';

export interface RoutingDecision {
  specialist: AgentType;
  mode: BehavioralMode;
  reasoning: string;
  confidence: number;
}

export async function orchestrate(request: AgentRequest): Promise<RoutingDecision> {
  const startTime = Date.now();

  // Step 1: Detect behavioral mode
  const mode = await detectMode(request);

  // Step 2: Build orchestrator prompt
  const prompt = buildOrchestratorPrompt({
    message: request.messageContent,
    context: request.userContext,
    history: request.messageHistory,
    detectedMode: mode
  });

  // Step 3: Ask Claude which specialist should handle this
  const response = await callClaude({
    systemPrompt: prompt.system,
    userMessage: prompt.user,
    maxTokens: 500, // Orchestrator responses should be brief
    temperature: 0.3 // Lower temp for consistent routing
  });

  // Step 4: Parse routing decision
  const decision = parseRoutingDecision(response);

  // Step 5: Log decision
  await logOrchestration({
    request,
    decision,
    executionTimeMs: Date.now() - startTime
  });

  return {
    specialist: decision.specialist,
    mode: decision.mode || mode,
    reasoning: decision.reasoning,
    confidence: decision.confidence
  };
}

function parseRoutingDecision(response: string): RoutingDecision {
  // Expected format from Claude:
  // SPECIALIST: strategy
  // MODE: strategic
  // REASONING: User is evaluating tradeoffs between two business models
  // CONFIDENCE: 0.85

  const specialist = extractField(response, 'SPECIALIST') as AgentType || 'reflection';
  const mode = extractField(response, 'MODE') as BehavioralMode || 'mirror';
  const reasoning = extractField(response, 'REASONING') || 'Default routing';
  const confidence = parseFloat(extractField(response, 'CONFIDENCE') || '0.7');

  return { specialist, mode, reasoning, confidence };
}
```

**Routing Rules Logic:**

```typescript
// src/agents/orchestrator/router.ts

import { AgentType, UserContext } from '@/types/agents';

export interface RoutingSignals {
  keywords: string[];
  questionType: 'what' | 'how' | 'why' | 'should' | 'none';
  hasDecisionLanguage: boolean;
  hasStructuringNeeds: boolean;
  domainIndicators: string[];
}

export function analyzeSignals(message: string, context: UserContext): RoutingSignals {
  const lowerMessage = message.toLowerCase();

  return {
    keywords: extractKeywords(message),
    questionType: detectQuestionType(message),
    hasDecisionLanguage: /\b(should|or|versus|vs|better|tradeoff|choose)\b/i.test(message),
    hasStructuringNeeds: /\b(plan|organize|framework|steps|process|sop)\b/i.test(message),
    domainIndicators: detectDomains(message, context)
  };
}

// Routing priority rules
export const ROUTING_RULES = {
  strategy: {
    keywords: ['business model', 'revenue', 'positioning', 'market', 'competitive', 'pricing', 'leverage'],
    patterns: /\b(should (i|we)|which (approach|strategy)|better to)\b/i,
    priority: 9
  },

  systems: {
    keywords: ['workflow', 'process', 'automation', 'sop', 'system', 'integrate', 'sync'],
    patterns: /\b(how (do|can) (i|we) (automate|streamline|build a system))\b/i,
    priority: 8
  },

  technical: {
    keywords: ['api', 'database', 'code', 'deploy', 'architecture', 'stack', 'bug', 'error'],
    patterns: /\b(technical|implementation|how to (build|code|implement))\b/i,
    priority: 8
  },

  creative: {
    keywords: ['messaging', 'content', 'copy', 'brand', 'positioning', 'story', 'framing'],
    patterns: /\b(how (should|can) (i|we) (message|communicate|frame))\b/i,
    priority: 7
  },

  reflection: {
    // Default fallback - handles thinking, clarity, perspective
    keywords: ['thinking', 'unclear', 'help me think', 'perspective'],
    patterns: /\b(what (am i|are we)|help me (understand|think|clarify))\b/i,
    priority: 5 // Lowest priority - catches everything else
  }
};
```

**Mode Detection:**

```typescript
// src/agents/orchestrator/modeDetector.ts

import { BehavioralMode, AgentRequest } from '@/types/agents';

export async function detectMode(request: AgentRequest): Promise<BehavioralMode> {
  const { messageContent, messageHistory } = request;
  const message = messageContent.toLowerCase();

  // Check for explicit mode triggers

  // EXECUTION MODE - user is ready to act
  if (hasExecutionSignals(message)) {
    return 'execution';
  }

  // STRATEGIC MODE - user is deciding
  if (hasDecisionSignals(message)) {
    return 'strategic';
  }

  // STRUCTURING MODE - user wants organization
  if (hasStructuringSignals(message)) {
    return 'structuring';
  }

  // MIRROR MODE (default) - user is exploring
  return 'mirror';
}

function hasExecutionSignals(message: string): boolean {
  const executionPatterns = [
    /\b(let's|start|begin|ready to|going to|plan to)\b/i,
    /\b(next step|what should i do|how do i|walk me through)\b/i,
    /\b(implement|build|create|set up|deploy)\b/i
  ];
  return executionPatterns.some(pattern => pattern.test(message));
}

function hasDecisionSignals(message: string): boolean {
  const decisionPatterns = [
    /\b(should i|should we|which|better|versus|vs|or)\b/i,
    /\b(tradeoff|pros and cons|worth it|make sense)\b/i,
    /\b(decide|decision|choose|pick|select)\b/i
  ];
  return decisionPatterns.some(pattern => pattern.test(message));
}

function hasStructuringSignals(message: string): boolean {
  const structuringPatterns = [
    /\b(plan|organize|framework|structure|breakdown)\b/i,
    /\b(steps|process|workflow|system|sop)\b/i,
    /\b(how do i organize|help me structure)\b/i
  ];
  return structuringPatterns.some(pattern => pattern.test(message));
}
```

### 4.2 Specialist Agents

**Base Class:**

```typescript
// src/agents/specialists/base.ts

import { AgentRequest, AgentResponse, AgentType, BehavioralMode } from '@/types/agents';
import { buildSpecialistPrompt } from '@/config/systemPrompts';
import { callClaude } from '@/services/ai/claude';
import { parseResponse } from '@/services/ai/responseParser';
import { enforceStyle } from '@/config/communicationStyle';

export abstract class BaseSpecialist {
  abstract readonly type: AgentType;
  abstract readonly domain: string;
  abstract readonly capabilities: string[];

  async process(
    request: AgentRequest,
    mode: BehavioralMode
  ): Promise<AgentResponse> {
    const startTime = Date.now();

    // Build specialist-specific prompt
    const prompt = this.buildPrompt(request, mode);

    // Call Claude with specialist context
    const rawResponse = await callClaude({
      systemPrompt: prompt.system,
      userMessage: prompt.user,
      maxTokens: this.getMaxTokens(mode),
      temperature: this.getTemperature(mode)
    });

    // Enforce communication style
    const styledResponse = enforceStyle(rawResponse, mode);

    // Parse structured data
    const parsed = await parseResponse(styledResponse);

    // Build response object
    return {
      content: styledResponse,
      agentType: this.type,
      behavioralMode: mode,
      extractedEntities: parsed.entities,
      suggestedActions: parsed.actions,
      metadata: {
        tokensUsed: parsed.tokensUsed || 0,
        executionTimeMs: Date.now() - startTime,
        confidence: parsed.confidence || 0.8
      }
    };
  }

  protected abstract buildPrompt(
    request: AgentRequest,
    mode: BehavioralMode
  ): { system: string; user: string };

  protected getMaxTokens(mode: BehavioralMode): number {
    // Execution mode tends to be more detailed
    return mode === 'execution' ? 2000 : 1500;
  }

  protected getTemperature(mode: BehavioralMode): number {
    // Lower temperature for strategic/execution, higher for creative mirror
    switch (mode) {
      case 'strategic':
      case 'execution':
        return 0.4;
      case 'mirror':
        return 0.6;
      case 'structuring':
        return 0.5;
      default:
        return 0.5;
    }
  }
}
```

**Strategy Agent Example:**

```typescript
// src/agents/specialists/strategy.ts

import { BaseSpecialist } from './base';
import { AgentRequest, AgentType, BehavioralMode } from '@/types/agents';
import { STRATEGY_SYSTEM_PROMPT } from '@/config/systemPrompts';
import { formatContextForPrompt } from '@/services/memory/contextRetrieval';

export class StrategyAgent extends BaseSpecialist {
  readonly type: AgentType = 'strategy';
  readonly domain = 'Business Strategy, Positioning, Leverage';
  readonly capabilities = [
    'Evaluate business models',
    'Assess market positioning',
    'Identify leverage opportunities',
    'Analyze competitive dynamics',
    'Pressure-test strategic decisions'
  ];

  protected buildPrompt(
    request: AgentRequest,
    mode: BehavioralMode
  ): { system: string; user: string } {

    const contextSummary = formatContextForPrompt(request.userContext);

    const system = `${STRATEGY_SYSTEM_PROMPT}

CURRENT BEHAVIORAL MODE: ${mode}

${this.getModeSpecificInstructions(mode)}

DECISION FRAMEWORK:
When evaluating ideas, assess across:
1. Leverage - does this scale time, money, or energy?
2. Complexity cost - what does this add to cognitive load?
3. Reversibility - can this be undone easily?
4. Alignment - does this fit the bigger system being built?
5. Momentum - does this move things forward now?

USER CONTEXT:
${contextSummary}`;

    const conversationHistory = request.messageHistory
      .slice(-5)
      .map(m => `${m.sender}: ${m.content}`)
      .join('\n');

    const user = `CONVERSATION HISTORY:
${conversationHistory}

CURRENT MESSAGE:
${request.messageContent}

Respond as the Strategy specialist in ${mode} mode. Remember:
- Ask better questions than the user is asking themselves
- Make tradeoffs explicit
- Focus on leverage and long-term compounding
- Be calm, grounded, analytical`;

    return { system, user };
  }

  private getModeSpecificInstructions(mode: BehavioralMode): string {
    switch (mode) {
      case 'mirror':
        return `Mirror mode: Reflect the user's strategic thinking back in clearer language. Identify hidden assumptions about the business model or market. Summarize without adding opinion yet.`;

      case 'structuring':
        return `Structuring mode: Turn the strategic problem into a clear framework. Create phases, options, or decision trees. Help the user see the structure of the strategic question.`;

      case 'strategic':
        return `Strategic mode: Pressure-test the business idea. Highlight tradeoffs between different approaches. Identify second-order effects and risks. Ask probing questions about leverage and positioning.`;

      case 'execution':
        return `Execution mode: Break the strategic decision into concrete next steps. What needs to be validated first? What data would help? What's the minimum viable test?`;

      default:
        return '';
    }
  }
}
```

**Other Specialists (Summary):**

```typescript
// src/agents/specialists/systems.ts
export class SystemsAgent extends BaseSpecialist {
  readonly type = 'systems';
  readonly domain = 'Workflows, Automation, SOPs, Integration';
  // Focuses on: process design, automation opportunities, tool integration
}

// src/agents/specialists/technical.ts
export class TechnicalAgent extends BaseSpecialist {
  readonly type = 'technical';
  readonly domain = 'Architecture, Implementation, Stack Decisions';
  // Focuses on: technical architecture, code quality, implementation paths
}

// src/agents/specialists/creative.ts
export class CreativeAgent extends BaseSpecialist {
  readonly type = 'creative';
  readonly domain = 'Messaging, Content, Framing, Communication';
  // Focuses on: positioning, messaging, content strategy, framing
}

// src/agents/specialists/reflection.ts
export class ReflectionAgent extends BaseSpecialist {
  readonly type = 'reflection';
  readonly domain = 'Clarity, Thinking, Perspective';
  // Focuses on: helping user think clearly, surface assumptions, gain perspective
  // This is the generalist fallback
}
```

### 4.3 Main Agent Interface

```typescript
// src/agents/index.ts

import { AgentRequest, AgentResponse } from '@/types/agents';
import { orchestrate } from './orchestrator';
import { StrategyAgent } from './specialists/strategy';
import { SystemsAgent } from './specialists/systems';
import { TechnicalAgent } from './specialists/technical';
import { CreativeAgent } from './specialists/creative';
import { ReflectionAgent } from './specialists/reflection';
import { logAgentActivity } from '@/services/logging/agentLogger';

// Initialize all specialists
const specialists = {
  strategy: new StrategyAgent(),
  systems: new SystemsAgent(),
  technical: new TechnicalAgent(),
  creative: new CreativeAgent(),
  reflection: new ReflectionAgent()
};

/**
 * Main entry point for agent system
 * This is what the UI calls
 */
export async function processWithAgents(
  request: AgentRequest
): Promise<AgentResponse> {

  try {
    // Step 1: Orchestrator decides routing
    const routing = await orchestrate(request);

    console.log(`🎯 Routing to ${routing.specialist} in ${routing.mode} mode`);
    console.log(`   Reason: ${routing.reasoning}`);

    // Step 2: Get the appropriate specialist
    const specialist = specialists[routing.specialist];

    if (!specialist) {
      throw new Error(`Unknown specialist: ${routing.specialist}`);
    }

    // Step 3: Specialist processes request
    const response = await specialist.process(request, routing.mode);

    // Step 4: Add routing metadata
    response.routingReason = routing.reasoning;

    // Step 5: Log activity
    await logAgentActivity({
      userId: request.userContext.userId,
      agentType: routing.specialist,
      action: 'processed_message',
      conversationId: request.conversationId,
      inputSummary: request.messageContent.substring(0, 100),
      outputSummary: response.content.substring(0, 100),
      metadata: {
        mode: routing.mode,
        routingConfidence: routing.confidence,
        ...response.metadata
      }
    });

    return response;

  } catch (error) {
    console.error('Agent processing error:', error);

    // Fallback to reflection agent in mirror mode
    const fallbackResponse = await specialists.reflection.process(
      request,
      'mirror'
    );

    return fallbackResponse;
  }
}
```

---

## 5. AGENT IMPLEMENTATIONS

### 5.1 System Prompts

```typescript
// src/config/systemPrompts.ts

export const MASTER_CONTEXT_PROFILE = `You are Sidekick, a thinking partner designed to reduce cognitive load and help users think clearly.

CORE PHILOSOPHY:
1. Clarify before optimizing - Never optimize something that hasn't been properly understood
2. Structure without constraining - Provide frameworks that still leave room for evolution
3. Progress over perfection - Move things forward even if inputs are incomplete
4. Context persistence matters more than clever answers
5. Ask better questions than the user is asking themselves

COMMUNICATION STYLE:
- Be calm, grounded, analytical, collaborative
- Slightly conversational, never robotic
- Avoid: hype language, motivational clichés, "Here's the best way" absolutes
- Prefer: "Here's how I'm seeing it...", "Let me reflect this back...", "One thing worth pressure-testing..."

YOUR JOB:
- Reduce cognitive load
- Help the user think clearly
- Turn vague thoughts into structured action
- Remember context across projects and domains
- Proactively surface next best actions

You do NOT replace the user's judgment. You augment it.`;

export const STRATEGY_SYSTEM_PROMPT = `${MASTER_CONTEXT_PROFILE}

You are the STRATEGY specialist within Sidekick.

DOMAIN EXPERTISE:
- Business models and revenue systems
- Market positioning and competitive dynamics
- Leverage identification (what scales time, money, energy)
- Strategic tradeoffs and second-order effects
- Long-term compounding decisions

DECISION FRAMEWORK:
When evaluating strategic questions, assess across:
1. Leverage - does this scale time, money, or energy?
2. Complexity cost - what does this add to cognitive load?
3. Reversibility - can this be undone easily?
4. Alignment - does this fit the bigger system being built?
5. Momentum - does this move things forward now?

Make tradeoffs explicit. Highlight what the user might not be seeing.`;

export const SYSTEMS_SYSTEM_PROMPT = `${MASTER_CONTEXT_PROFILE}

You are the SYSTEMS specialist within Sidekick.

DOMAIN EXPERTISE:
- Workflow design and process optimization
- Automation opportunities
- SOP creation and documentation
- Tool integration and data flow
- Operational efficiency

APPROACH:
- Identify repetitive patterns that can be systematized
- Design for minimal cognitive overhead
- Prefer simple systems over complex automations
- Map out dependencies and data flows
- Create frameworks that evolve with the business`;

export const TECHNICAL_SYSTEM_PROMPT = `${MASTER_CONTEXT_PROFILE}

You are the TECHNICAL specialist within Sidekick.

DOMAIN EXPERTISE:
- Software architecture and design patterns
- Stack decisions and tool evaluation
- API integration and data modeling
- Deployment and infrastructure
- Debugging and problem-solving

PRINCIPLES:
- Prefer boring technology over bleeding edge
- Optimize for maintainability and simplicity
- Avoid over-engineering
- Consider total cost of ownership (time, complexity, money)
- Make architectural tradeoffs transparent`;

export const CREATIVE_SYSTEM_PROMPT = `${MASTER_CONTEXT_PROFILE}

You are the CREATIVE specialist within Sidekick.

DOMAIN EXPERTISE:
- Messaging and positioning
- Content strategy and creation
- Brand voice and framing
- Communication clarity
- Storytelling and narrative

APPROACH:
- Help clarify what the user is really trying to communicate
- Frame complex ideas simply
- Test multiple angles before committing
- Ensure messaging aligns with strategy
- Avoid fluff, focus on clarity`;

export const REFLECTION_SYSTEM_PROMPT = `${MASTER_CONTEXT_PROFILE}

You are the REFLECTION specialist within Sidekick.

DOMAIN: General thinking partner, clarity, perspective

YOUR ROLE:
- Help the user think through problems that don't fit other specialists
- Surface assumptions and hidden beliefs
- Provide perspective on thinking patterns
- Clarify vague or incomplete thoughts
- Be the generalist when domain isn't clear

You are the fallback agent. Your strength is helping users think, not domain expertise.`;

// Mode-specific prompt modifiers
export const MODE_INSTRUCTIONS = {
  mirror: `
MIRROR MODE:
- Reflect the user's thinking back in clearer language
- Identify hidden assumptions
- Summarize without adding opinion
- Help the user hear their own thoughts more clearly
- Used when: user is brainstorming, uncertain, ideas still forming
`,

  structuring: `
STRUCTURING MODE:
- Turn chaos into outlines, systems, diagrams, or steps
- Create categories, phases, layers
- Provide frameworks and mental models
- Help organize scattered thoughts
- Used when: user asks for plans, frameworks, SOPs, organization
`,

  strategic: `
STRATEGIC MODE:
- Pressure-test ideas
- Highlight tradeoffs
- Identify second-order effects
- Ask probing questions
- Challenge assumptions constructively
- Used when: user is making decisions, evaluating options, considering tradeoffs
`,

  execution: `
EXECUTION MODE:
- Break plans into concrete actions
- Suggest specific next steps
- Help sequence work realistically
- Identify dependencies and blockers
- Used when: user is ready to move, building, shipping, implementing
`
};
```

### 5.2 Communication Style Enforcement

```typescript
// src/config/communicationStyle.ts

export interface StyleRule {
  pattern: RegExp;
  replacement: string;
  reason: string;
}

// Phrases to avoid
export const AVOID_PATTERNS: StyleRule[] = [
  {
    pattern: /\bhere's the best way\b/gi,
    replacement: "Here's one approach",
    reason: "Avoid absolutes"
  },
  {
    pattern: /\byou should definitely\b/gi,
    replacement: "You might consider",
    reason: "Too prescriptive"
  },
  {
    pattern: /\bthat's a great idea!\b/gi,
    replacement: "That's worth exploring.",
    reason: "Avoid empty enthusiasm"
  },
  {
    pattern: /\blet me tell you\b/gi,
    replacement: "Here's how I'm seeing it",
    reason: "More collaborative tone"
  }
];

// Preferred conversational phrases
export const PREFERRED_PHRASES = [
  "Here's how I'm seeing it...",
  "Let me reflect this back...",
  "If we simplify this...",
  "One thing worth pressure-testing...",
  "A tradeoff to consider...",
  "Here's what might not be obvious...",
  "Let's break this down...",
  "What I'm noticing is..."
];

// Style enforcement function
export function enforceStyle(response: string, mode: BehavioralMode): string {
  let styled = response;

  // Apply avoidance patterns
  for (const rule of AVOID_PATTERNS) {
    styled = styled.replace(rule.pattern, rule.replacement);
  }

  // Remove excessive emojis (max 1 per response)
  const emojiCount = (styled.match(/[\u{1F600}-\u{1F64F}]/gu) || []).length;
  if (emojiCount > 1) {
    styled = styled.replace(/[\u{1F600}-\u{1F64F}]/gu, '');
  }

  // Ensure response isn't too long (user attention)
  const paragraphs = styled.split('\n\n');
  if (paragraphs.length > 6) {
    console.warn('Response too long, may lose user attention');
  }

  return styled;
}
```

---

## 6. INTEGRATION LAYER

### 6.1 Context Retrieval Service

```typescript
// src/services/memory/contextRetrieval.ts

import { supabase } from '@/lib/supabaseClient';
import { UserContext, ContextItem, Message } from '@/types/agents';

export async function getUserContext(
  userId: string,
  conversationId: string
): Promise<UserContext> {

  // Fetch recent messages from this conversation
  const { data: recentMessages } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(10);

  // Fetch active projects
  const { data: activeProjects } = await supabase
    .from('context_items')
    .select('*')
    .eq('user_id', userId)
    .eq('type', 'project')
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(5);

  // Fetch active businesses
  const { data: activeBusinesses } = await supabase
    .from('context_items')
    .select('*')
    .eq('user_id', userId)
    .eq('type', 'business')
    .eq('status', 'active');

  // Fetch user preferences
  const { data: user } = await supabase
    .from('users')
    .select('preferences')
    .eq('id', userId)
    .single();

  // Fetch learned patterns
  const { data: patterns } = await supabase
    .from('user_patterns')
    .select('*')
    .eq('user_id', userId)
    .gte('confidence', 0.6) // Only high-confidence patterns
    .order('confidence', { ascending: false });

  // Detect current domain from conversation
  const currentDomain = await detectCurrentDomain(conversationId, recentMessages);

  return {
    userId,
    recentMessages: (recentMessages || []).reverse(),
    activeProjects: activeProjects || [],
    activeBusiness: activeBusinesses || [],
    preferences: user?.preferences || {},
    patterns: patterns || [],
    currentDomain
  };
}

async function detectCurrentDomain(
  conversationId: string,
  messages: Message[]
): Promise<string | undefined> {
  // Look for domain indicators in recent messages
  const recentText = messages
    .slice(0, 5)
    .map(m => m.content)
    .join(' ')
    .toLowerCase();

  if (/\b(solar|ppa|energy|panels)\b/.test(recentText)) return 'solar_business';
  if (/\b(health|wellness|supplements)\b/.test(recentText)) return 'health_business';
  if (/\b(payments|web design|shopify)\b/.test(recentText)) return 'web_business';

  // Check conversation metadata
  const { data: conv } = await supabase
    .from('conversations')
    .select('metadata')
    .eq('id', conversationId)
    .single();

  return conv?.metadata?.domain;
}

export function formatContextForPrompt(context: UserContext): string {
  const parts: string[] = [];

  if (context.activeBusiness.length > 0) {
    parts.push('ACTIVE BUSINESSES:');
    context.activeBusiness.forEach(b => {
      parts.push(`- ${b.title}: ${b.description || 'No description'}`);
    });
    parts.push('');
  }

  if (context.activeProjects.length > 0) {
    parts.push('ACTIVE PROJECTS:');
    context.activeProjects.slice(0, 3).forEach(p => {
      parts.push(`- ${p.title}: ${p.description || 'No description'}`);
      if (p.tags.length > 0) {
        parts.push(`  Tags: ${p.tags.join(', ')}`);
      }
    });
    parts.push('');
  }

  if (context.currentDomain) {
    parts.push(`CURRENT DOMAIN: ${context.currentDomain}`);
    parts.push('');
  }

  if (context.patterns.length > 0) {
    parts.push('USER PATTERNS:');
    context.patterns.slice(0, 3).forEach(p => {
      parts.push(`- ${p.pattern_type}: ${JSON.stringify(p.pattern_value)}`);
    });
    parts.push('');
  }

  return parts.join('\n');
}
```

### 6.2 Claude API Client

```typescript
// src/services/ai/claude.ts

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
    messages: [
      {
        role: 'user',
        content: request.userMessage
      }
    ]
  });

  const content = response.content[0];
  if (content.type === 'text') {
    return content.text;
  }

  throw new Error('Unexpected response type from Claude');
}
```

### 6.3 Response Parser

```typescript
// src/services/ai/responseParser.ts

import { Entity, Action } from '@/types/agents';

export interface ParsedResponse {
  entities: Entity[];
  actions: Action[];
  confidence: number;
  tokensUsed?: number;
}

export async function parseResponse(response: string): Promise<ParsedResponse> {
  const entities = extractEntities(response);
  const actions = extractActions(response);

  return {
    entities,
    actions,
    confidence: 0.8 // Could be enhanced with actual confidence scoring
  };
}

function extractEntities(text: string): Entity[] {
  const entities: Entity[] = [];

  // Look for project mentions: "for the [project name]" or "in [project name]"
  const projectPattern = /\b(?:for|in) the ([A-Z][a-zA-Z\s]{2,30}(?:project|campaign|initiative))\b/gi;
  let match;
  while ((match = projectPattern.exec(text)) !== null) {
    entities.push({
      type: 'project',
      name: match[1].trim()
    });
  }

  // Look for tool mentions
  const toolPattern = /\b(Notion|Discord|Slack|Supabase|n8n|Zapier|Airtable)\b/g;
  while ((match = toolPattern.exec(text)) !== null) {
    entities.push({
      type: 'tool',
      name: match[1]
    });
  }

  // Deduplicate by name
  const unique = new Map<string, Entity>();
  entities.forEach(e => unique.set(e.name, e));

  return Array.from(unique.values());
}

function extractActions(text: string): Action[] {
  const actions: Action[] = [];

  // Look for "next step" sections
  const nextStepPattern = /next step[s]?:?\s*(.+?)(?:\n\n|$)/is;
  const match = text.match(nextStepPattern);

  if (match) {
    const stepsText = match[1];
    const steps = stepsText.split(/\n-|\n\d+\./).filter(s => s.trim());

    steps.forEach(step => {
      actions.push({
        type: 'suggest_next_step',
        title: step.trim().substring(0, 100),
        description: step.trim(),
        priority: 'medium',
        data: {}
      });
    });
  }

  return actions;
}
```

---

## 7. EXECUTION PLAN

### Phase 1: Foundation (Week 1)
**Goal:** Get basic agent system working end-to-end

#### Day 1-2: Database & Types
- [ ] Create Supabase migration with full schema
- [ ] Run migration on development database
- [ ] Generate TypeScript types from Supabase
- [ ] Create all type definitions in `src/types/`
- [ ] Test database connectivity

**Deliverable:** Working Supabase database with all tables

#### Day 3-4: Claude Integration
- [ ] Implement `src/services/ai/claude.ts`
- [ ] Add API key to environment variables
- [ ] Test basic Claude API calls
- [ ] Implement `src/services/ai/responseParser.ts`
- [ ] Create basic prompt builder

**Deliverable:** Can send messages to Claude and receive responses

#### Day 5-7: Basic Agent System
- [ ] Implement `BaseSpecialist` class
- [ ] Implement `ReflectionAgent` (simplest specialist)
- [ ] Create basic system prompts
- [ ] Implement simple orchestrator (always routes to ReflectionAgent)
- [ ] Wire up `src/agents/index.ts` as main entry point

**Deliverable:** One working specialist agent

---

### Phase 2: Orchestration (Week 2)
**Goal:** Smart routing to multiple specialists

#### Day 1-3: Mode Detection & Routing
- [ ] Implement `src/agents/orchestrator/modeDetector.ts`
- [ ] Implement `src/agents/orchestrator/router.ts` with routing rules
- [ ] Build orchestrator prompts
- [ ] Test routing decisions with various inputs
- [ ] Create routing decision logs

**Deliverable:** Orchestrator can detect mode and route to correct specialist

#### Day 4-5: Additional Specialists
- [ ] Implement `StrategyAgent`
- [ ] Implement `SystemsAgent`
- [ ] Implement `TechnicalAgent`
- [ ] Create specialist-specific prompts
- [ ] Test each specialist in isolation

**Deliverable:** All 4 main specialists working

#### Day 6-7: Context Integration
- [ ] Implement `src/services/memory/contextRetrieval.ts`
- [ ] Build context formatting for prompts
- [ ] Wire context into agent requests
- [ ] Test with real user context data

**Deliverable:** Agents receive full context with every request

---

### Phase 3: Memory & Persistence (Week 3)
**Goal:** Agents remember and learn

#### Day 1-2: Conversation Storage
- [ ] Implement `src/services/memory/conversationStore.ts`
- [ ] Save messages to Supabase after each interaction
- [ ] Retrieve conversation history
- [ ] Update App.tsx to use persistent messages
- [ ] Test message persistence across sessions

**Deliverable:** Conversations persist in database

#### Day 3-4: Context Management
- [ ] Implement `src/services/memory/contextStore.ts`
- [ ] Create context item CRUD operations
- [ ] Build entity extraction from messages
- [ ] Auto-link extracted entities to context items
- [ ] Test context item creation and retrieval

**Deliverable:** Can create and manage context items

#### Day 5-7: Quick Capture Processing
- [ ] Implement `src/services/inbox/inboxService.ts`
- [ ] Build inbox classifier
- [ ] Create entity extractor
- [ ] Wire up SidekickHome.tsx Quick Capture
- [ ] Test end-to-end quick capture flow

**Deliverable:** Quick Capture actually saves and processes

---

### Phase 4: Intelligence Layer (Week 4)
**Goal:** Proactive behavior and learning

#### Day 1-3: Pattern Detection
- [ ] Implement `src/services/memory/patternDetector.ts`
- [ ] Detect user preferences from conversations
- [ ] Learn communication style preferences
- [ ] Track topic frequency
- [ ] Store patterns in database

**Deliverable:** System learns user patterns over time

#### Day 4-5: Knowledge Graph
- [ ] Implement `src/services/memory/knowledgeGraph.ts`
- [ ] Auto-create relationships between context items
- [ ] Build relationship strength scoring
- [ ] Create graph traversal for context retrieval
- [ ] Test relationship-based context fetching

**Deliverable:** Context items are connected intelligently

#### Day 6-7: Agent Activity Dashboard
- [ ] Implement `src/services/logging/agentLogger.ts`
- [ ] Log all agent activities to database
- [ ] Update SidekickHome.tsx to show real agent logs
- [ ] Create real-time activity feed
- [ ] Test activity logging end-to-end

**Deliverable:** Home dashboard shows real agent activity

---

### Phase 5: UI Integration (Week 5)
**Goal:** Connect React UI to agent system

#### Day 1-2: Chat Integration
- [ ] Create `src/hooks/useAgent.ts`
- [ ] Update App.tsx to use agent system instead of n8n
- [ ] Add loading states during agent processing
- [ ] Show which agent/mode is responding
- [ ] Add error handling

**Deliverable:** Chat interface uses real agent system

#### Day 3-4: Context Hooks
- [ ] Create `src/hooks/useContext.ts`
- [ ] Create `src/hooks/useConversation.ts`
- [ ] Create `src/hooks/useInbox.ts`
- [ ] Build UI components for context management
- [ ] Test React hooks with Supabase

**Deliverable:** React hooks for all core features

#### Day 5-7: Home Dashboard (Real)
- [ ] Fetch real priority items from context
- [ ] Show real agent activity logs
- [ ] Display live metrics from database
- [ ] Add context item creation UI
- [ ] Test full dashboard functionality

**Deliverable:** Home dashboard is fully functional

---

### Phase 6: Polish & Testing (Week 6)
**Goal:** Production-ready system

#### Day 1-2: Communication Style
- [ ] Implement `src/config/communicationStyle.ts`
- [ ] Enforce style rules in all responses
- [ ] Test tone across all modes
- [ ] Validate against vision doc requirements
- [ ] User testing for tone/style

**Deliverable:** Consistent communication style

#### Day 3-4: Error Handling & Fallbacks
- [ ] Add comprehensive error handling
- [ ] Implement fallback to ReflectionAgent
- [ ] Add retry logic for API failures
- [ ] Create user-friendly error messages
- [ ] Test failure scenarios

**Deliverable:** Robust error handling

#### Day 5-7: Performance & Optimization
- [ ] Optimize database queries
- [ ] Add caching for context retrieval
- [ ] Reduce prompt sizes where possible
- [ ] Load testing with concurrent users
- [ ] Monitor token usage and costs

**Deliverable:** System is performant and cost-effective

---

### Phase 7: Advanced Features (Week 7-8)
**Goal:** Proactive intelligence

#### Week 7: Proactive Agents
- [ ] Build background processing system
- [ ] Implement scheduled context analysis
- [ ] Create opportunity detection logic
- [ ] Build notification/suggestion system
- [ ] Test proactive suggestions

**Deliverable:** Agents proactively surface insights

#### Week 8: Multi-Domain Intelligence
- [ ] Build domain-specific context models
- [ ] Implement cross-domain linking
- [ ] Create domain switching logic
- [ ] Test with multiple businesses
- [ ] Validate context persistence

**Deliverable:** System handles multiple domains intelligently

---

## 8. TESTING STRATEGY

### Unit Tests

```typescript
// tests/agents/orchestrator/router.test.ts
describe('Agent Routing', () => {
  test('routes business model questions to strategy agent', async () => {
    const result = await orchestrate({
      messageContent: 'Should I use a PPA model or direct sales for solar?',
      userContext: mockContext,
      conversationId: 'test-123',
      messageHistory: []
    });

    expect(result.specialist).toBe('strategy');
    expect(result.mode).toBe('strategic');
  });

  test('routes workflow questions to systems agent', async () => {
    const result = await orchestrate({
      messageContent: 'How can I automate lead follow-ups?',
      userContext: mockContext,
      conversationId: 'test-123',
      messageHistory: []
    });

    expect(result.specialist).toBe('systems');
  });
});
```

### Integration Tests

```typescript
// tests/integration/agent-flow.test.ts
describe('Full Agent Flow', () => {
  test('user message -> context retrieval -> routing -> response', async () => {
    const userId = 'test-user-123';
    const conversationId = 'test-conv-456';

    // 1. Create context
    await createContextItem({
      userId,
      type: 'project',
      title: 'Solar Lead Generation',
      status: 'active'
    });

    // 2. Send message
    const response = await processWithAgents({
      messageContent: 'How should I prioritize these 50 new solar leads?',
      userContext: await getUserContext(userId, conversationId),
      conversationId,
      messageHistory: []
    });

    // 3. Validate response
    expect(response.agentType).toBe('strategy');
    expect(response.content).toContain('prioritize');
    expect(response.extractedEntities).toContainEqual(
      expect.objectContaining({ type: 'project', name: expect.stringContaining('Solar') })
    );

    // 4. Verify persistence
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId);

    expect(messages).toHaveLength(2); // user message + agent response
  });
});
```

### Manual Test Scenarios

**Scenario 1: First-Time User**
```
User: "I'm thinking about starting a solar business focused on PPAs in Colorado"
Expected:
- Agent: Strategy (mode: mirror)
- Extracts: business type (solar), model (PPA), location (Colorado)
- Creates: business context item, project context item
- Response: Reflects back the idea, asks clarifying questions
```

**Scenario 2: Returning User with Context**
```
User: "What should I do first?"
Context: Has active solar PPA project from previous session
Expected:
- Agent: Strategy or Systems (mode: execution)
- Retrieves: solar PPA context
- Response: Suggests next steps specific to PPA model
- Shows domain awareness
```

**Scenario 3: Decision Point**
```
User: "Should I hire a full-time closer or use an agency?"
Expected:
- Agent: Strategy (mode: strategic)
- Response: Highlights tradeoffs using 5-factor framework
- Identifies: leverage, complexity cost, reversibility
- Doesn't prescribe, helps user think through it
```

---

## APPENDIX: Key Files Quick Reference

### Critical Path Files (Implement First)
1. `src/types/agents.ts` - All type definitions
2. `src/services/ai/claude.ts` - Claude API integration
3. `src/agents/specialists/base.ts` - Base specialist class
4. `src/agents/specialists/reflection.ts` - First specialist
5. `src/agents/index.ts` - Main agent API
6. `src/config/systemPrompts.ts` - All prompts
7. `src/services/memory/contextRetrieval.ts` - Context fetching
8. `src/services/memory/conversationStore.ts` - Message persistence

### Supporting Files (Implement Second)
9. `src/agents/orchestrator/index.ts` - Routing logic
10. `src/agents/orchestrator/modeDetector.ts` - Mode detection
11. `src/agents/specialists/strategy.ts` - Strategy agent
12. `src/services/logging/agentLogger.ts` - Activity logging
13. `src/hooks/useAgent.ts` - React integration

### Enhancement Files (Implement Third)
14. `src/services/memory/knowledgeGraph.ts` - Relationships
15. `src/services/memory/patternDetector.ts` - Learning
16. `src/services/inbox/inboxService.ts` - Quick capture processing
17. `src/config/communicationStyle.ts` - Style enforcement

---

## SUCCESS METRICS

**Week 1-2:** Basic agent responses working
- Can send message → get response from one agent
- Responses stored in database
- Context retrieved and included in prompts

**Week 3-4:** Full agent system operational
- Orchestrator routes to correct specialist
- All 5 specialists working
- Mode detection accurate
- Context items created and linked

**Week 5-6:** Production-ready
- UI fully integrated
- Home dashboard showing real data
- Quick capture processing items
- Communication style consistent

**Week 7-8:** Intelligent system
- Proactive suggestions surfacing
- Pattern detection working
- Multi-domain context management
- User feels less cognitively scattered

---

## NEXT STEPS

1. Review this plan with stakeholders
2. Set up Supabase project if not already done
3. Add required environment variables
4. Start Phase 1, Day 1: Database schema
5. Ship incrementally - test each phase before moving forward

This architecture turns Sidekick from a static prototype into the thinking partner described in your vision doc. The system will actually reduce cognitive load, remember context, and help users think clearly across domains.

Ready to start building?
