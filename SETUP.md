# Sidekick Setup Guide

## ✅ Prerequisites Completed

- ✅ Groq API Key configured
- ✅ Supabase project created
- ✅ Environment variables set in `.env`

## 🗄️ Database Setup (Required)

### Step 1: Run the SQL Schema

1. Open your Supabase dashboard:
   - https://supabase.com/dashboard/project/eiadhrqarxfxegzuvxcy

2. Navigate to **SQL Editor** (left sidebar)

3. Click **+ New Query**

4. Copy the contents of `database/schema.sql`

5. Paste into the editor and click **Run**

6. Verify tables were created:
   - Go to **Table Editor**
   - You should see: `conversations`, `messages`, `tasks`, `agents`, `calendar_events`

### Step 2: Verify Setup (Optional)

Run the setup script to test connection:
```bash
cd sidekick-react-pwa
node setup-supabase.mjs
```

## 🚀 Running the Application

### Development Mode

```bash
cd sidekick-react-pwa
npm run dev
```

Then open: http://localhost:5173

### Production Build

```bash
npm run build
npm run preview
```

## 🧪 Testing the Agent System

The agent system uses Groq API for AI responses. Test it by:

1. Start the dev server: `npm run dev`
2. Click "New Brain Dump" in the dashboard
3. Send a test message to interact with the agents

### Test Different Agent Types:

- **Reflection Agent**: "I'm thinking about my next career move..."
- **Strategy Agent**: "Should I build a SaaS or a service business?"
- **Systems Agent**: "How can I automate my sales process?"
- **Technical Agent**: "I need to integrate Stripe payments into my app"
- **Creative Agent**: "Help me write a compelling landing page headline"

## 📊 Dashboard Features

### Tasks
- View today's tasks
- Toggle task completion
- Add new tasks (opens dialog - functionality ready for implementation)

### Agents
- View deployed agents
- Start/pause agents with play/pause buttons
- Deploy new agents (opens dialog - functionality ready for implementation)

### Calendar
- View today's events
- See next upcoming event
- Click events for details (ready for implementation)

### Data Flow

The dashboard automatically:
- Loads data from Supabase when available
- Falls back to mock data if database is not configured
- Provides loading indicators during data fetch
- Shows empty states when no data exists

## 🔐 Environment Variables

Your `.env` file should contain:

```env
# AI Provider
VITE_AI_PROVIDER=groq
VITE_GROQ_API_KEY=your_groq_api_key

# Supabase
VITE_SUPABASE_URL=https://eiadhrqarxfxegzuvxcy.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

⚠️ **Never commit the `.env` file** - it's in `.gitignore` for security

## 📁 Project Structure

```
hhssidekick/
├── database/
│   └── schema.sql              # Supabase database schema
├── sidekick-react-pwa/
│   ├── src/
│   │   ├── agents/             # Agent system
│   │   │   ├── specialists/    # 5 specialist agents
│   │   │   ├── orchestrator/   # Workflow routing
│   │   │   └── index.ts        # Main entry point
│   │   ├── services/
│   │   │   ├── ai/             # LLM integration
│   │   │   └── database/       # Supabase services
│   │   ├── hooks/
│   │   │   └── useDatabase.ts  # React data hooks
│   │   ├── lib/
│   │   │   └── supabaseClient.ts
│   │   └── SidekickHome.tsx    # Main dashboard
│   └── .env                    # Environment config (DO NOT COMMIT)
```

## 🛠️ Troubleshooting

### Database Connection Issues
- Verify Supabase URL and key in `.env`
- Check Row Level Security (RLS) policies are enabled
- Ensure tables were created successfully

### Agent System Not Responding
- Verify Groq API key is correct
- Check browser console for errors
- Test API key with: `node test-groq-simple.mjs`

### Build Errors
- Run `npm install` to ensure dependencies are up to date
- Clear node_modules and reinstall if needed
- Check TypeScript errors with `npm run build`

## 🎯 Next Development Steps

1. Implement task creation dialog functionality
2. Implement agent deployment wizard
3. Add brain dump conversation interface
4. Connect agent responses to conversation history
5. Add authentication (Supabase Auth)
6. Create remaining pages (Agents, Training, Marketplace, Profile)

## 📚 Documentation

- **Supabase Docs**: https://supabase.com/docs
- **Groq API Docs**: https://console.groq.com/docs
- **Agent System**: See comments in `src/agents/index.ts`
- **Database Services**: See comments in `src/services/database/`
