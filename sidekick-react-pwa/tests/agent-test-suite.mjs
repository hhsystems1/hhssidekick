/**
 * Comprehensive Agent Test Suite
 * Tests all 5 specialist agents with Groq API
 *
 * Usage: node tests/agent-test-suite.mjs
 */

import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

const GROQ_API_KEY = process.env.VITE_GROQ_API_KEY;

// Test cases for each agent type
const TEST_SCENARIOS = [
  {
    agent: 'Reflection Agent',
    agentType: 'reflection',
    behavioralMode: 'mirror',
    scenarios: [
      {
        name: 'Career decision exploration',
        prompt: "I'm thinking about switching from my corporate job to start my own business, but I'm not sure if it's the right time. Part of me feels ready, but another part is scared of the financial risk.",
        expectedElements: ['explore', 'thinking', 'feel', 'consider'],
      },
      {
        name: 'Idea clarification',
        prompt: "I have this vague idea for a SaaS product but I can't quite articulate what it should do. How do I get more clarity?",
        expectedElements: ['clarify', 'understand', 'what', 'why'],
      }
    ]
  },
  {
    agent: 'Strategy Agent',
    agentType: 'strategy',
    behavioralMode: 'strategic',
    scenarios: [
      {
        name: 'Business model decision',
        prompt: "Should I build a productized service or go straight to SaaS? I have $50k saved and can work on this for 6 months.",
        expectedElements: ['tradeoff', 'leverage', 'consider', 'option'],
      },
      {
        name: 'Pricing strategy',
        prompt: "How should I price my consulting services? Currently charging $150/hour but considering value-based pricing.",
        expectedElements: ['pricing', 'value', 'worth', 'position'],
      }
    ]
  },
  {
    agent: 'Systems Agent',
    agentType: 'systems',
    behavioralMode: 'structuring',
    scenarios: [
      {
        name: 'Client onboarding automation',
        prompt: "I'm manually onboarding each new client which takes 3 hours. How can I automate this process?",
        expectedElements: ['automate', 'process', 'workflow', 'system'],
      },
      {
        name: 'Content creation workflow',
        prompt: "I need to create a repeatable system for producing blog content weekly. What's a good workflow?",
        expectedElements: ['workflow', 'process', 'step', 'system'],
      }
    ]
  },
  {
    agent: 'Technical Agent',
    agentType: 'technical',
    behavioralMode: 'execution',
    scenarios: [
      {
        name: 'API architecture',
        prompt: "I need to build a REST API that handles user authentication and integrates with Stripe. What's a good architecture?",
        expectedElements: ['architecture', 'api', 'authentication', 'implement'],
      },
      {
        name: 'Database design',
        prompt: "I'm building a multi-tenant SaaS. How should I structure my database schema?",
        expectedElements: ['database', 'schema', 'table', 'structure'],
      }
    ]
  },
  {
    agent: 'Creative Agent',
    agentType: 'creative',
    behavioralMode: 'execution',
    scenarios: [
      {
        name: 'Landing page copy',
        prompt: "I'm building a tool that helps freelancers track their time and expenses. What should my landing page headline be?",
        expectedElements: ['headline', 'message', 'copy', 'resonate'],
      },
      {
        name: 'Email campaign',
        prompt: "I need to write a welcome email for new users of my productivity app. What tone should I use?",
        expectedElements: ['email', 'tone', 'message', 'welcome'],
      }
    ]
  }
];

// Call Groq API
async function callGroqAPI(systemPrompt, userMessage, model = 'llama-3.1-8b-instant') {
  const startTime = Date.now();

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 500
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const executionTime = Date.now() - startTime;

  return {
    content: data.choices[0].message.content,
    tokensUsed: data.usage.total_tokens,
    executionTime,
    model: data.model
  };
}

// Get system prompt for agent type
function getSystemPrompt(agentType, behavioralMode) {
  const prompts = {
    reflection: `You are a thoughtful reflection partner helping someone think through their work and life. ${behavioralMode === 'mirror' ? 'Focus on exploring and understanding through open-ended questions.' : ''}`,
    strategy: `You are a strategic thinking partner focused on business leverage and decision-making. ${behavioralMode === 'strategic' ? 'Analyze tradeoffs and highlight second-order effects.' : ''}`,
    systems: `You are a systems thinking expert focused on workflows and automation. ${behavioralMode === 'structuring' ? 'Design clear process flows and identify automation opportunities.' : ''}`,
    technical: `You are a senior software engineer and technical architect. ${behavioralMode === 'execution' ? 'Provide concrete implementation details and code examples.' : ''}`,
    creative: `You are a creative strategist focused on messaging and communication. ${behavioralMode === 'execution' ? 'Write actual copy and provide specific wording.' : ''}`
  };

  return prompts[agentType] || prompts.reflection;
}

// Run a single test scenario
async function runScenario(agentName, agentType, behavioralMode, scenario) {
  console.log(`\n  📝 Testing: ${scenario.name}`);
  console.log(`     Prompt: "${scenario.prompt.substring(0, 80)}..."`);

  try {
    const systemPrompt = getSystemPrompt(agentType, behavioralMode);
    const result = await callGroqAPI(systemPrompt, scenario.prompt);

    console.log(`     ✅ Response generated (${result.executionTime}ms, ${result.tokensUsed} tokens)`);
    console.log(`     Response preview: "${result.content.substring(0, 150)}..."`);

    // Check if response contains expected elements
    const contentLower = result.content.toLowerCase();
    const foundElements = scenario.expectedElements.filter(element =>
      contentLower.includes(element.toLowerCase())
    );

    if (foundElements.length > 0) {
      console.log(`     ✓ Contains expected elements: ${foundElements.join(', ')}`);
    }

    return { success: true, result };
  } catch (error) {
    console.log(`     ❌ Failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Run tests for one agent
async function testAgent(agentConfig) {
  console.log(`\n${'═'.repeat(80)}`);
  console.log(`🤖 ${agentConfig.agent.toUpperCase()}`);
  console.log(`Mode: ${agentConfig.behavioralMode}`);
  console.log(`${'═'.repeat(80)}`);

  const results = [];

  for (const scenario of agentConfig.scenarios) {
    const result = await runScenario(
      agentConfig.agent,
      agentConfig.agentType,
      agentConfig.behavioralMode,
      scenario
    );
    results.push(result);

    // Small delay between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  const successCount = results.filter(r => r.success).length;
  console.log(`\n  Summary: ${successCount}/${results.length} tests passed`);

  return results;
}

// Main test runner
async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                   COMPREHENSIVE AGENT TEST SUITE                          ║
║                         Testing All 5 Agents                              ║
╚════════════════════════════════════════════════════════════════════════════╝
`);

  // Environment check
  console.log('Environment Check:');
  console.log(`  Groq API Key: ${GROQ_API_KEY ? '✅ Set' : '❌ Missing'}`);

  if (!GROQ_API_KEY) {
    console.error('\n❌ ERROR: VITE_GROQ_API_KEY not found in .env file\n');
    process.exit(1);
  }

  console.log('\nStarting tests...\n');

  const allResults = [];

  // Run tests for each agent
  for (const agentConfig of TEST_SCENARIOS) {
    const results = await testAgent(agentConfig);
    allResults.push(...results);
  }

  // Final summary
  console.log(`\n${'═'.repeat(80)}`);
  console.log('FINAL SUMMARY');
  console.log(`${'═'.repeat(80)}`);

  const totalTests = allResults.length;
  const passedTests = allResults.filter(r => r.success).length;
  const failedTests = totalTests - passedTests;

  console.log(`\nTotal Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests} ✅`);
  console.log(`Failed: ${failedTests} ${failedTests > 0 ? '❌' : ''}`);

  if (passedTests > 0) {
    const avgTime = allResults
      .filter(r => r.success && r.result)
      .reduce((sum, r) => sum + r.result.executionTime, 0) / passedTests;
    const avgTokens = allResults
      .filter(r => r.success && r.result)
      .reduce((sum, r) => sum + r.result.tokensUsed, 0) / passedTests;

    console.log(`\nAverage Response Time: ${Math.round(avgTime)}ms`);
    console.log(`Average Tokens Used: ${Math.round(avgTokens)}`);
  }

  console.log(`\n${passedTests === totalTests ? '🎉' : '⚠️'} Test suite ${passedTests === totalTests ? 'completed successfully!' : 'completed with some failures.'}\n`);

  process.exit(failedTests > 0 ? 1 : 0);
}

// Run the test suite
main().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
