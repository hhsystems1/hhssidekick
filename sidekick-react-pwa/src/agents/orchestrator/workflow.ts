/**
 * LangGraph Orchestration Workflow
 *
 * State machine for routing user messages to appropriate specialist agents.
 *
 * FLOW:
 * 1. detectMode - Analyze user message to determine behavioral mode
 * 2. routeSpecialist - Choose which specialist should handle the request
 * 3. processWithSpecialist - Execute the specialist and return response
 *
 * This replaces the previous linear orchestration with a proper state machine.
 */

import { StateGraph, END } from '@langchain/langgraph';
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import type { AgentType, BehavioralMode, UserContext } from '../../types/agents';

// ============================================================================
// STATE DEFINITION
// ============================================================================

/**
 * Workflow state that gets passed between nodes
 * Each node can read and update this state
 */
export interface WorkflowState {
  // INPUT (provided by caller)
  messageContent: string;
  userContext: UserContext;
  conversationId: string;
  messageHistory: BaseMessage[];

  // INTERMEDIATE (set by nodes during execution)
  behavioralMode?: BehavioralMode;
  selectedAgent?: AgentType;
  routingReason?: string;
  routingConfidence?: number;

  // OUTPUT (final result)
  response?: string;
  agentMetadata?: {
    agentType: AgentType;
    behavioralMode: BehavioralMode;
    tokensUsed: number;
    executionTimeMs: number;
  };

  // ERROR HANDLING
  error?: string;
}

// ============================================================================
// NODE FUNCTIONS
// ============================================================================

/**
 * NODE 1: Detect Behavioral Mode
 *
 * Analyzes the user's message and conversation context to determine
 * which behavioral mode the agent should operate in.
 *
 * MODES:
 * - mirror: Reflect thinking back, clarify, explore
 * - structuring: Organize chaos into frameworks
 * - strategic: Pressure-test ideas, highlight tradeoffs
 * - execution: Break down into concrete actions
 *
 * @param state - Current workflow state
 * @returns Updated state with behavioralMode set
 */
async function detectMode(state: WorkflowState): Promise<Partial<WorkflowState>> {
  const { messageContent, messageHistory } = state;

  console.log('🔍 [detectMode] Analyzing message:', messageContent.substring(0, 50) + '...');

  // Pattern-based mode detection
  const message = messageContent.toLowerCase();

  // EXECUTION MODE - User is ready to act
  if (hasExecutionSignals(message)) {
    console.log('   → Detected: EXECUTION mode');
    return { behavioralMode: 'execution' };
  }

  // STRATEGIC MODE - User is deciding between options
  if (hasDecisionSignals(message)) {
    console.log('   → Detected: STRATEGIC mode');
    return { behavioralMode: 'strategic' };
  }

  // STRUCTURING MODE - User wants organization
  if (hasStructuringSignals(message)) {
    console.log('   → Detected: STRUCTURING mode');
    return { behavioralMode: 'structuring' };
  }

  // MIRROR MODE (default) - User is exploring
  console.log('   → Detected: MIRROR mode (default)');
  return { behavioralMode: 'mirror' };
}

/**
 * Helper: Detect execution signals
 */
function hasExecutionSignals(message: string): boolean {
  const executionPatterns = [
    /\b(let's|start|begin|ready to|going to|plan to)\b/i,
    /\b(next step|what should i do|how do i|walk me through)\b/i,
    /\b(implement|build|create|set up|deploy)\b/i,
  ];
  return executionPatterns.some((pattern) => pattern.test(message));
}

/**
 * Helper: Detect decision signals
 */
function hasDecisionSignals(message: string): boolean {
  const decisionPatterns = [
    /\b(should i|should we|which|better|versus|vs|or)\b/i,
    /\b(tradeoff|pros and cons|worth it|make sense)\b/i,
    /\b(decide|decision|choose|pick|select)\b/i,
  ];
  return decisionPatterns.some((pattern) => pattern.test(message));
}

/**
 * Helper: Detect structuring signals
 */
function hasStructuringSignals(message: string): boolean {
  const structuringPatterns = [
    /\b(plan|organize|framework|structure|breakdown)\b/i,
    /\b(steps|process|workflow|system|sop)\b/i,
    /\b(how do i organize|help me structure)\b/i,
  ];
  return structuringPatterns.some((pattern) => pattern.test(message));
}

// ============================================================================

/**
 * NODE 2: Route to Specialist
 *
 * Determines which specialist agent should handle the request based on
 * keywords, question type, and domain indicators.
 *
 * SPECIALISTS:
 * - strategy: Business models, leverage, positioning
 * - systems: Workflows, automation, SOPs
 * - technical: Architecture, implementation, code
 * - creative: Messaging, content, framing
 * - reflection: General thinking partner (fallback)
 *
 * @param state - Current workflow state
 * @returns Updated state with selectedAgent set
 */
async function routeSpecialist(state: WorkflowState): Promise<Partial<WorkflowState>> {
  const { messageContent, userContext, behavioralMode } = state;

  console.log('🎯 [routeSpecialist] Routing with mode:', behavioralMode);

  const message = messageContent.toLowerCase();

  // Priority-based routing rules
  const routingRules = [
    {
      agent: 'strategy' as AgentType,
      priority: 9,
      test: () =>
        /\b(business model|revenue|pricing|positioning|market|competitive|leverage|should (i|we))\b/i.test(
          message
        ),
      reason: 'Business strategy or decision-making question detected',
    },
    {
      agent: 'systems' as AgentType,
      priority: 8,
      test: () =>
        /\b(workflow|process|automation|sop|system|integrate|sync|streamline)\b/i.test(message),
      reason: 'Process or automation question detected',
    },
    {
      agent: 'technical' as AgentType,
      priority: 8,
      test: () =>
        /\b(api|database|code|deploy|architecture|stack|bug|error|technical|implementation)\b/i.test(
          message
        ),
      reason: 'Technical or implementation question detected',
    },
    {
      agent: 'creative' as AgentType,
      priority: 7,
      test: () =>
        /\b(messaging|content|copy|brand|positioning|story|framing|communicate|message)\b/i.test(
          message
        ),
      reason: 'Content or communication question detected',
    },
  ];

  // Find first matching rule
  for (const rule of routingRules) {
    if (rule.test()) {
      console.log(`   → Routed to: ${rule.agent.toUpperCase()} (${rule.reason})`);
      return {
        selectedAgent: rule.agent,
        routingReason: rule.reason,
        routingConfidence: 0.85,
      };
    }
  }

  // Default to reflection agent
  console.log('   → Routed to: REFLECTION (default - general thinking partner)');
  return {
    selectedAgent: 'reflection',
    routingReason: 'General thinking partner for exploratory conversation',
    routingConfidence: 0.7,
  };
}

// ============================================================================

/**
 * NODE 3: Process with Specialist
 *
 * Executes the selected specialist agent with the detected behavioral mode.
 * This is where the actual LLM call happens.
 *
 * @param state - Current workflow state
 * @returns Updated state with response and metadata
 */
async function processWithSpecialist(state: WorkflowState): Promise<Partial<WorkflowState>> {
  const { selectedAgent, behavioralMode, messageContent, userContext, conversationId } = state;

  console.log(
    `🤖 [processWithSpecialist] Executing ${selectedAgent} in ${behavioralMode} mode`
  );

  const startTime = Date.now();

  try {
    // Import specialist dynamically
    // NOTE: This will be implemented after we refactor the specialists
    // For now, this is the interface they'll need to implement
    const specialist = await getSpecialist(selectedAgent!);

    // Call the specialist with full context
    const response = await specialist.process({
      messageContent,
      userContext,
      conversationId,
      behavioralMode: behavioralMode!,
      messageHistory: state.messageHistory,
    });

    const executionTimeMs = Date.now() - startTime;

    console.log(`   ✓ Generated response (${executionTimeMs}ms)`);

    return {
      response: response.content,
      agentMetadata: {
        agentType: selectedAgent!,
        behavioralMode: behavioralMode!,
        tokensUsed: response.tokensUsed || 0,
        executionTimeMs,
      },
    };
  } catch (error: any) {
    console.error('   ✗ Specialist execution failed:', error.message);
    return {
      error: `Agent processing failed: ${error.message}`,
    };
  }
}

/**
 * Helper: Get specialist instance
 * This will load the actual specialist classes after refactoring
 */
async function getSpecialist(agentType: AgentType): Promise<any> {
  // TODO: Import actual specialists after refactoring
  // For now, return a placeholder interface
  throw new Error('Specialist loading not yet implemented - needs refactoring phase');
}

// ============================================================================
// WORKFLOW CONSTRUCTION
// ============================================================================

/**
 * Build the LangGraph workflow
 *
 * GRAPH STRUCTURE:
 *
 *    START
 *      ↓
 *   detectMode
 *      ↓
 *  routeSpecialist
 *      ↓
 * processWithSpecialist
 *      ↓
 *     END
 */
export function createWorkflow(): StateGraph<WorkflowState> {
  // Initialize the state graph
  const workflow = new StateGraph<WorkflowState>({
    channels: {
      messageContent: null,
      userContext: null,
      conversationId: null,
      messageHistory: null,
      behavioralMode: null,
      selectedAgent: null,
      routingReason: null,
      routingConfidence: null,
      response: null,
      agentMetadata: null,
      error: null,
    },
  });

  // Add nodes
  workflow.addNode('detectMode', detectMode);
  workflow.addNode('routeSpecialist', routeSpecialist);
  workflow.addNode('processWithSpecialist', processWithSpecialist);

  // Define edges (sequential flow)
  workflow.addEdge('__start__', 'detectMode');
  workflow.addEdge('detectMode', 'routeSpecialist');
  workflow.addEdge('routeSpecialist', 'processWithSpecialist');
  workflow.addEdge('processWithSpecialist', '__end__');

  // Set entry point
  workflow.setEntryPoint('detectMode');

  return workflow;
}

/**
 * Execute the workflow with input state
 *
 * @param input - Initial workflow state
 * @returns Final state with response
 */
export async function runWorkflow(input: Omit<WorkflowState, 'behavioralMode' | 'selectedAgent' | 'routingReason' | 'routingConfidence' | 'response' | 'agentMetadata' | 'error'>): Promise<WorkflowState> {
  const workflow = createWorkflow();
  const compiledWorkflow = workflow.compile();

  console.log('🚀 Starting LangGraph workflow...');

  // Run the workflow
  const result = await compiledWorkflow.invoke(input);

  console.log('✅ Workflow completed');

  return result as WorkflowState;
}

// ============================================================================
// EXPORTS
// ============================================================================

export { detectMode, routeSpecialist, processWithSpecialist };
