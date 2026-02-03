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

  const tables = ['conversations', 'messages', 'tasks', 'agents', 'calendar_events', 'profiles', 'user_settings', 'documents', 'document_chunks'];
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

async function checkPgvector() {
  console.log('Step 4: Checking pgvector extension...\n');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/match_document_chunks`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query_embedding: new Array(1024).fill(1).map((_, i) => Math.sin(i)),
        match_threshold: 1,
        match_count: 1,
        user_uuid: '00000000-0000-0000-0000-000000000000'
      })
    });
    
    // If we get 400 Bad Request, the function exists but params are wrong (which is expected with mock UUID)
    // If we get 404, the function doesn't exist
    const exists = response.status !== 404;
    console.log(`${exists ? '✅' : '❌'} pgvector/match_document_chunks: ${exists ? 'EXISTS' : 'NOT FOUND'}`);
    return exists;
  } catch (error) {
    console.log(`❌ pgvector check ERROR: ${error.message}`);
    return false;
  }
}

async function main() {
  const connected = await testConnection();

  if (!connected) {
    console.log('\n⚠️  Please check your Supabase credentials and try again.\n');
    process.exit(1);
  }

  const { allTablesExist, tableStatus } = await checkTables();
  
  const pgvectorExists = await checkPgvector();

  if (allTablesExist && pgvectorExists) {
    console.log('✅ All database tables are set up correctly!\n');
    console.log('🎉 Your Supabase database is ready to use.\n');
    console.log('Next steps:');
    console.log('  1. Run: npm run dev');
    console.log('  2. Open the dashboard and test the features\n');
  } else {
    console.log('⚠️  Some tables are missing. You need to run the database schema.\n');
    console.log('📋 TO SET UP THE DATABASE:\n');
    console.log('  1. Enable pgvector extension in Supabase Dashboard:');
    console.log('     - Go to Database → Extensions');
    console.log('     - Search for "vector" and enable it\n');
    console.log('  2. Go to your Supabase dashboard:');
    console.log(`     ${SUPABASE_URL.replace('/rest/v1', '')}\n`);
    console.log('  3. Click on "SQL Editor" in the left sidebar\n');
    console.log('  4. Click "New Query"\n');
    console.log('  5. Copy the contents of: database/schema.sql\n');
    console.log('  6. Paste into the SQL editor and click "Run"\n');
    console.log('  7. Run this script again to verify: node setup-supabase.mjs\n');
    console.log('Missing items:');
    Object.entries(tableStatus).forEach(([table, exists]) => {
      if (!exists) {
        console.log(`  - Table: ${table}`);
      }
    });
    if (!pgvectorExists) {
      console.log('  - pgvector extension');
      console.log('  - match_document_chunks function');
    }
    console.log('');
  }

  process.exit(allTablesExist ? 0 : 1);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
