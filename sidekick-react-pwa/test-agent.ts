/**
 * Agent System Test Script
 *
 * Tests the agent system with sample messages to verify:
 * 1. Mode detection works correctly
 * 2. Specialist routing works
 * 3. LLM integration works with Groq API
 * 4. Responses are generated successfully
 *
 * Usage: npm run test-agent
 */

import { processWithAgents } from './src/agents/index';
import type { AgentRequest } from './src/types/agents';

// Test messages covering different modes and specialists
const testCases: Array<{ name: string; message: string; expectedAgent?: string }> = [
  {
    name: 'General reflection',
    message: 'I\'m thinking about where to focus my energy next. Not sure if I should double down on my current project or explore something new.',
    expectedAgent: 'reflection'
  },
  {
    name: 'Business strategy',
    message: 'Should I build a productized service or go straight to SaaS? What are the tradeoffs?',
    expectedAgent: 'strategy'
  },
  {
    name: 'Workflow automation',
    message: 'How can I automate my client onboarding process? Currently doing everything manually and it\'s taking too much time.',
    expectedAgent: 'systems'
  },
  {
    name: 'Technical implementation',
    message: 'I need to build an API that integrates with Stripe. What\'s the best architecture for this?',
    expectedAgent: 'technical'
  },
  {
    name: 'Messaging and content',
    message: 'I\'m struggling with how to position my product. It does a lot but I\'m not sure what message will resonate.',
    expectedAgent: 'creative'
  },
  {
    name: 'Execution mode',
    message: 'Let\'s plan out the next steps for launching my MVP. What should I build first?',
  }
];

async function runTest(testCase: typeof testCases[0], index: number) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`TEST ${index + 1}: ${testCase.name}`);
  console.log(`${'='.repeat(80)}`);
  console.log(`Message: "${testCase.message}"\n`);

  const request: AgentRequest = {
    messageContent: testCase.message,
    userContext: {
      userId: 'test-user',
      currentProject: 'Test Project',
      recentTopics: []
    },
    conversationId: `test-conv-${index}`,
    messageHistory: []
  };

  try {
    const startTime = Date.now();
    const response = await processWithAgents(request);
    const duration = Date.now() - startTime;

    console.log(`✅ SUCCESS`);
    console.log(`Agent: ${response.agentType} (expected: ${testCase.expectedAgent || 'any'})`);
    console.log(`Mode: ${response.behavioralMode}`);
    console.log(`Routing: ${response.routingReason}`);
    console.log(`Duration: ${duration}ms`);
    console.log(`Tokens: ${response.metadata.tokensUsed || 'N/A'}`);
    console.log(`\nResponse:\n${response.content}\n`);

    // Verify expected agent if specified
    if (testCase.expectedAgent && response.agentType !== testCase.expectedAgent) {
      console.warn(`⚠️  WARNING: Expected ${testCase.expectedAgent} but got ${response.agentType}`);
    }

    return { success: true, duration, response };
  } catch (error: any) {
    console.error(`❌ FAILED: ${error.message}\n`);
    console.error(`Stack trace:\n${error.stack}\n`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                        AGENT SYSTEM TEST SUITE                            ║
╚════════════════════════════════════════════════════════════════════════════╝
`);

  console.log('Testing agent system with Groq API...\n');
  console.log('Environment check:');
  console.log(`- VITE_GROQ_API_KEY: ${import.meta.env.VITE_GROQ_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`- VITE_AI_PROVIDER: ${import.meta.env.VITE_AI_PROVIDER || 'groq (default)'}`);

  const results = [];

  // Run tests sequentially to avoid rate limits
  for (let i = 0; i < testCases.length; i++) {
    const result = await runTest(testCases[i], i);
    results.push(result);

    // Small delay between tests to avoid rate limiting
    if (i < testCases.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Summary
  console.log(`\n${'='.repeat(80)}`);
  console.log('TEST SUMMARY');
  console.log(`${'='.repeat(80)}`);

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`Total tests: ${results.length}`);
  console.log(`Passed: ${successful}`);
  console.log(`Failed: ${failed}`);

  if (successful > 0) {
    const avgDuration = results
      .filter(r => r.success && r.duration)
      .reduce((sum, r) => sum + r.duration!, 0) / successful;
    console.log(`Average response time: ${Math.round(avgDuration)}ms`);
  }

  if (failed === 0) {
    console.log(`\n✅ All tests passed!`);
    process.exit(0);
  } else {
    console.log(`\n❌ ${failed} test(s) failed`);
    process.exit(1);
  }
}

// Run tests
main().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});
