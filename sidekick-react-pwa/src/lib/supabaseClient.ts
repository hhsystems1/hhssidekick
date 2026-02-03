import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const isPlaceholderUrl = !supabaseUrl || supabaseUrl.includes('placeholder');
const isPlaceholderKey = !supabaseAnonKey || supabaseAnonKey.includes('placeholder');

if (!supabaseUrl || !supabaseAnonKey || isPlaceholderUrl || isPlaceholderKey) {
  console.error('╔═══════════════════════════════════════════════════════════════╗');
  console.error('║          SUPABASE CONFIGURATION ERROR                         ║');
  console.error('╚═══════════════════════════════════════════════════════════════╝');
  console.error('');
  console.error('Supabase credentials are missing or using placeholder values!');
  console.error('');
  console.error('Local development:');
  console.error('  - Copy .env.example to .env');
  console.error('  - Add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  console.error('');
  console.error('Netlify deployment:');
  console.error('  - Go to Site settings → Environment variables');
  console.error('  - Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  console.error('  - Redeploy the site');
  console.error('');
  console.error('Current values:');
  console.error(`  VITE_SUPABASE_URL: ${supabaseUrl ? (isPlaceholderUrl ? 'PLACEHOLDER' : 'Set') : 'MISSING'}`);
  console.error(`  VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? (isPlaceholderKey ? 'PLACEHOLDER' : 'Set') : 'MISSING'}`);
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);
