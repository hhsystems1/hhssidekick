/**
 * Simple Groq API Test
 * Tests the Groq API connection directly
 */

import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const GROQ_API_KEY = process.env.VITE_GROQ_API_KEY;

console.log('╔════════════════════════════════════════════════════════════════════════════╗');
console.log('║                          GROQ API TEST                                    ║');
console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');

console.log('Environment check:');
console.log(`- API Key: ${GROQ_API_KEY ? '✅ Found' : '❌ Missing'}`);
console.log(`- Key prefix: ${GROQ_API_KEY ? GROQ_API_KEY.substring(0, 10) + '...' : 'N/A'}\n`);

if (!GROQ_API_KEY) {
  console.error('❌ ERROR: VITE_GROQ_API_KEY not found in .env file');
  process.exit(1);
}

async function testGroqAPI() {
  console.log('🔬 Testing Groq API connection...\n');

  const testMessage = 'Say "Hello from Groq!" if you can read this.';

  try {
    const startTime = Date.now();

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: testMessage }
        ],
        temperature: 0.7,
        max_tokens: 50
      })
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${response.status} - ${error}`);
    }

    const data = await response.json();

    console.log('✅ SUCCESS!\n');
    console.log('Response Details:');
    console.log('─'.repeat(80));
    console.log(`Model: ${data.model}`);
    console.log(`Duration: ${duration}ms`);
    console.log(`Tokens used: ${data.usage.total_tokens} (prompt: ${data.usage.prompt_tokens}, completion: ${data.usage.completion_tokens})`);
    console.log(`\nAI Response:`);
    console.log(`"${data.choices[0].message.content}"\n`);
    console.log('─'.repeat(80));
    console.log('\n✅ Groq API is working correctly!');
    console.log('✅ Agent system should work with this API key.\n');

    return true;
  } catch (error) {
    console.error('❌ FAILED:', error.message);
    console.error('\nPlease check:');
    console.error('1. Your API key is correct');
    console.error('2. You have internet connectivity');
    console.error('3. Groq API is not experiencing issues\n');
    return false;
  }
}

testGroqAPI().then(success => {
  process.exit(success ? 0 : 1);
});
