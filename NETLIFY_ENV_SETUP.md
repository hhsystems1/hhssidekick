# Netlify Environment Variables Setup

## The Issue
The error `supabaseUrl is required` means Vite didn't find the environment variables during the build.

**Important:** Vite environment variables must be set at **BUILD TIME**, not runtime!

## How to Fix in Netlify

### Step 1: Add Environment Variables to Netlify

1. **Go to your Netlify site dashboard**:
   - https://app.netlify.com/sites/[your-site-name]/configuration/env

2. **Click "Environment variables"** in the left sidebar

3. **Add these 4 variables**:

   **Variable 1:**
   - Key: `VITE_AI_PROVIDER`
   - Value: `groq`

   **Variable 2:**
   - Key: `VITE_GROQ_API_KEY`
   - Value: `[Your Groq API key from .env file]`

   **Variable 3:**
   - Key: `VITE_SUPABASE_URL`
   - Value: `[Your Supabase URL from .env file]`

   **Variable 4:**
   - Key: `VITE_SUPABASE_ANON_KEY`
   - Value: `[Your Supabase anon key from .env file]`

### Step 2: Trigger a New Deploy

After adding the variables:

**Option A - In Netlify Dashboard:**
1. Go to "Deploys" tab
2. Click "Trigger deploy" → "Clear cache and deploy site"

**Option B - From Git:**
```bash
git commit --allow-empty -m "Rebuild with environment variables"
git push origin claude/setup-groq-api-test-uiUWX
```

### Step 3: Verify

After the deploy completes:
1. Open your site
2. Open browser console (F12)
3. Check for any errors
4. The Supabase error should be gone

## Troubleshooting

### If error persists:

1. **Check variable names are exact** (case-sensitive):
   - Must start with `VITE_`
   - Check for typos

2. **Check variable scopes**:
   - Make sure they're set for "All deploy contexts" or at least "Production"

3. **Clear cache**:
   - Use "Clear cache and deploy site" instead of regular deploy

4. **Check build logs**:
   - Look for the variables in the build output
   - They should NOT show the actual values (Netlify hides them)
   - But you should see "VITE_SUPABASE_URL" mentioned

## Screenshot Guide

Your Netlify environment variables page should look like this:

```
Key                        Value                    Scopes
─────────────────────────  ───────────────────────  ──────────────
VITE_AI_PROVIDER          groq                     All
VITE_GROQ_API_KEY         gsk_***************      All
VITE_SUPABASE_URL         https://eiad*******      All
VITE_SUPABASE_ANON_KEY    eyJhbG***************    All
```

## Important Notes

⚠️ **Never commit `.env` to git** - it's in `.gitignore` for security

✅ **For local development**: Use `.env` file in `sidekick-react-pwa/`

✅ **For Netlify production**: Use Environment Variables in dashboard

✅ **Must start with `VITE_`**: Vite only exposes variables with this prefix to the browser
