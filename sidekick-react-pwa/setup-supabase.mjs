/**
 * Supabase Setup Script
 * Tests the connection and provides instructions for database setup
 */

import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

console.log('╔════════════════════════════════════════════════════════════════════════════╗');
console.log('║                      SUPABASE SETUP SCRIPT                                ║');
console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');

console.log('Step 1: Checking environment variables...\n');
console.log(`✅ VITE_SUPABASE_URL: ${SUPABASE_URL ? 'Set' : '❌ Missing'}`);
console.log(`✅ VITE_SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY ? 'Set' : '❌ Missing'}\n`);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ ERROR: Supabase credentials not found in .env file\n');
  process.exit(1);
}

console.log('Step 2: Testing Supabase connection...\n');

async function testConnection() {
  try {
    // Test a simple query to check connection
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (response.ok) {
      console.log('✅ Successfully connected to Supabase!\n');
      return true;
    } else {
      console.error(`❌ Connection failed: ${response.status} ${response.statusText}\n`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Connection error: ${error.message}\n`);
    return false;
  }
}

async function checkTables() {
  console.log('Step 3: Checking if database tables exist...\n');

  const tables = ['conversations', 'messages', 'tasks', 'agents', 'calendar_events'];
  const tableStatus = {};

  for (const table of tables) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?limit=1`, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      tableStatus[table] = response.ok;
      console.log(`${response.ok ? '✅' : '❌'} Table "${table}": ${response.ok ? 'EXISTS' : 'NOT FOUND'}`);
    } catch (error) {
      tableStatus[table] = false;
      console.log(`❌ Table "${table}": ERROR - ${error.message}`);
    }
  }

  console.log('');

  const allTablesExist = Object.values(tableStatus).every(exists => exists);
  return { allTablesExist, tableStatus };
}

async function main() {
  const connected = await testConnection();

  if (!connected) {
    console.log('\n⚠️  Please check your Supabase credentials and try again.\n');
    process.exit(1);
  }

  const { allTablesExist, tableStatus } = await checkTables();

  if (allTablesExist) {
    console.log('✅ All database tables are set up correctly!\n');
    console.log('🎉 Your Supabase database is ready to use.\n');
    console.log('Next steps:');
    console.log('  1. Run: npm run dev');
    console.log('  2. Open the dashboard and test the features\n');
  } else {
    console.log('⚠️  Some tables are missing. You need to run the database schema.\n');
    console.log('📋 TO SET UP THE DATABASE:\n');
    console.log('  1. Go to your Supabase dashboard:');
    console.log(`     ${SUPABASE_URL.replace('/rest/v1', '')}\n`);
    console.log('  2. Click on "SQL Editor" in the left sidebar\n');
    console.log('  3. Click "New Query"\n');
    console.log('  4. Copy the contents of: database/schema.sql\n');
    console.log('  5. Paste into the SQL editor and click "Run"\n');
    console.log('  6. Run this script again to verify: node setup-supabase.mjs\n');

    console.log('Missing tables:');
    Object.entries(tableStatus).forEach(([table, exists]) => {
      if (!exists) {
        console.log(`  - ${table}`);
      }
    });
    console.log('');
  }

  process.exit(allTablesExist ? 0 : 1);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
