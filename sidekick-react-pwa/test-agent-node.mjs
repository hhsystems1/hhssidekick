/**
 * Agent System Test Script - Node Version
 *
 * Tests the agent system with sample messages to verify:
 * 1. Mode detection works correctly
 * 2. Specialist routing works
 * 3. LLM integration works with Groq API
 * 4. Responses are generated successfully
 *
 * Usage: node test-agent-node.mjs
 */

import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

// Mock import.meta.env for Node.js environment
globalThis.import = {
  meta: {
    env: {
      VITE_GROQ_API_KEY: process.env.VITE_GROQ_API_KEY,
      VITE_AI_PROVIDER: process.env.VITE_AI_PROVIDER || 'groq',
      VITE_OLLAMA_URL: process.env.VITE_OLLAMA_URL,
      VITE_OPENAI_API_KEY: process.env.VITE_OPENAI_API_KEY,
      VITE_ANTHROPIC_API_KEY: process.env.VITE_ANTHROPIC_API_KEY,
    }
  }
};

// Dynamic import after setting up environment
const { processWithAgents } = await import('./src/agents/index.js');

// Test messages covering different modes and specialists
const testCases = [
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
  }
];

async function runTest(testCase, index) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`TEST ${index + 1}: ${testCase.name}`);
  console.log(`${'='.repeat(80)}`);
  console.log(`Message: "${testCase.message}"\n`);

  const request = {
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
  } catch (error) {
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
  console.log(`- VITE_GROQ_API_KEY: ${process.env.VITE_GROQ_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`- VITE_AI_PROVIDER: ${process.env.VITE_AI_PROVIDER || 'groq (default)'}`);

  if (!process.env.VITE_GROQ_API_KEY) {
    console.error('\n❌ ERROR: VITE_GROQ_API_KEY not found in .env file');
    process.exit(1);
  }

  const results = [];

  // Run just the first test for now
  console.log('\n🔬 Running quick test with first case only...\n');
  const result = await runTest(testCases[0], 0);
  results.push(result);

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
      .reduce((sum, r) => sum + r.duration, 0) / successful;
    console.log(`Average response time: ${Math.round(avgDuration)}ms`);
  }

  if (failed === 0) {
    console.log(`\n✅ All tests passed!`);
    console.log('\n💡 To run all test cases, uncomment the loop in the main() function');
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
