# GROQ SETUP GUIDE

**Ultra-fast open source LLMs with zero setup** - Get Sidekick running in 5 minutes!

---

## WHY GROQ?

✅ **Blazing Fast** - 500+ tokens/second (10x faster than Ollama)
✅ **Free Tier** - Generous limits for personal projects
✅ **Zero Setup** - Just get an API key, no downloads needed
✅ **No Hardware Requirements** - Works on any device
✅ **Open Source Models** - Same models as Ollama (Llama, Mixtral)
✅ **Cloud Reliable** - Always available, no "model not loaded" errors

---

## QUICK START (5 MINUTES)

### Step 1: Get Groq API Key

1. Go to https://console.groq.com
2. Sign up with GitHub/Google (free account)
3. Navigate to "API Keys"
4. Click "Create API Key"
5. Copy your key (starts with `gsk_...`)

**That's it!** No software to install, no models to download.

---

### Step 2: Configure Sidekick

Edit your `.env` file:

```bash
cd sidekick-react-pwa

# If .env doesn't exist, copy from template
cp .env.example .env

# Edit .env and add your Groq key
VITE_AI_PROVIDER=groq
VITE_GROQ_API_KEY=gsk_your_key_here

# Supabase (keep your existing values)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

### Step 3: Start Sidekick

```bash
npm install  # If you haven't already
npm run dev
```

**Done!** Open http://localhost:5173 and start chatting.

---

## MODELS USED

Groq uses ultra-fast inference on open source models:

| Agent Type | Model | Speed | Best For |
|------------|-------|-------|----------|
| **Reflection** | llama-3.1-8b-instant | ⚡⚡⚡ Ultra-fast | Conversation, thinking |
| **Strategy** | mixtral-8x7b-32768 | ⚡⚡⚡ Ultra-fast | Business decisions, reasoning |
| **Systems** | mixtral-8x7b-32768 | ⚡⚡⚡ Ultra-fast | Workflows, automation |
| **Technical** | llama-3.1-70b-versatile | ⚡⚡ Very fast | Code, architecture |
| **Creative** | llama-3.1-8b-instant | ⚡⚡⚡ Ultra-fast | Content, messaging |

**All models run at 500+ tokens/second!**

---

## TESTING YOUR SETUP

Send these messages to test different agents:

### Test Reflection Agent
```
"Help me think through starting a new business"
```
**Expected:** Conversational, clarifying questions
**Model:** llama-3.1-8b-instant

### Test Strategy Agent
```
"Should I use PPAs or direct sales for solar?"
```
**Expected:** Tradeoff analysis, decision framework
**Model:** mixtral-8x7b-32768

### Test Systems Agent
```
"How can I automate my lead follow-up process?"
```
**Expected:** Workflow design, automation ideas
**Model:** mixtral-8x7b-32768

### Test Technical Agent
```
"What database should I use for my CRM?"
```
**Expected:** Technical analysis, architecture advice
**Model:** llama-3.1-70b-versatile

---

## FREE TIER LIMITS

Groq's free tier is generous:

- **30 requests per minute**
- **14,400 tokens per minute (input)**
- **No daily limit** (rate limited only)

**This is MORE than enough for:**
- Personal projects
- Development/testing
- Small team usage (< 5 people)

**Only upgrade if:**
- High-volume production app (100+ users)
- Need higher rate limits

---

## COST COMPARISON

| Provider | Setup Time | Cost/Month | Speed |
|----------|-----------|------------|-------|
| **Groq** | 5 minutes | $0 (free tier) | ⚡⚡⚡ 500+ tok/s |
| Ollama | 60 minutes | $0* | ⚡ 20-50 tok/s |
| OpenAI | 5 minutes | $20-50 | ⚡⚡ 100 tok/s |
| Anthropic | 5 minutes | $20-50 | ⚡⚡ 100 tok/s |

*Ollama is free but requires hardware (16-64GB RAM)

---

## SWITCHING BETWEEN PROVIDERS

Groq is the default, but you can easily switch:

### Use Ollama (Local Privacy)

```bash
# .env
VITE_AI_PROVIDER=ollama
VITE_OLLAMA_URL=http://localhost:11434

# Keep Groq key for fallback
VITE_GROQ_API_KEY=gsk_your_key
```

See `OLLAMA_SETUP.md` for Ollama installation.

### Use OpenAI

```bash
# .env
VITE_AI_PROVIDER=openai
VITE_OPENAI_API_KEY=sk-your_key
```

### Use Anthropic

```bash
# .env
VITE_AI_PROVIDER=anthropic
VITE_ANTHROPIC_API_KEY=sk-ant-your_key
```

---

## AUTOMATIC FALLBACK

Sidekick automatically falls back if Groq fails:

```
Primary: Groq
   ↓ (if fails)
Fallback 1: Ollama (if running locally)
   ↓ (if fails)
Fallback 2: Anthropic (if key configured)
   ↓ (if fails)
Fallback 3: OpenAI (if key configured)
```

**To enable fallback**, add multiple keys:

```bash
# .env
VITE_AI_PROVIDER=groq
VITE_GROQ_API_KEY=gsk_your_groq_key

# Fallback options
VITE_ANTHROPIC_API_KEY=sk-ant-your_anthropic_key
VITE_OPENAI_API_KEY=sk-your_openai_key
```

Now if Groq has an outage, Sidekick automatically switches to Anthropic or OpenAI.

---

## TROUBLESHOOTING

### Problem: "Groq API key not configured"

**Solution:**
```bash
# Check your .env file
cat .env | grep GROQ

# Should show:
VITE_GROQ_API_KEY=gsk_...

# If empty or wrong, edit .env and add your key
```

---

### Problem: "Groq API error: 401"

**Error:** Unauthorized

**Solution:**
- API key is invalid or expired
- Get a new key from https://console.groq.com
- Update `.env` with new key
- Restart dev server: `npm run dev`

---

### Problem: "Groq API error: 429"

**Error:** Rate limit exceeded

**Solution:**

**Option 1:** Wait 1 minute (resets at 30 req/min)

**Option 2:** Add fallback provider:
```bash
# .env
VITE_ANTHROPIC_API_KEY=sk-ant-your_key
```

**Option 3:** Upgrade to Groq paid plan (if high volume)

---

### Problem: Slow responses (> 5 seconds)

**Cause:** Network latency, not Groq (Groq is ultra-fast)

**Solution:**
```bash
# Check network
curl -w "@-" -o /dev/null -s https://api.groq.com/openai/v1/models

# Should return < 200ms
```

If slow, check your internet connection.

---

## ADVANCED CONFIGURATION

### Custom Model Selection

Override specific agent models:

```bash
# .env

# Use faster model for all agents
VITE_MODEL_STRATEGY=llama-3.1-8b-instant

# Use larger model for technical agent
VITE_MODEL_TECHNICAL=llama-3.1-70b-versatile
```

### Available Groq Models

```
llama-3.1-8b-instant       # Fastest, 8B params
llama-3.1-70b-versatile    # Highest quality, 70B params
mixtral-8x7b-32768         # Best reasoning, 32k context
gemma2-9b-it              # Alternative 9B model
```

See full list: https://console.groq.com/docs/models

---

## MONITORING USAGE

### Check Usage in Console

```bash
# In browser console (F12)
import { checkProviderHealth } from './services/ai/llm-client';

const health = await checkProviderHealth();
console.log(health);
// { provider: 'groq', available: true }
```

### Track API Usage

Groq dashboard: https://console.groq.com/usage

Shows:
- Requests per minute
- Tokens consumed
- Rate limit status

---

## COMPARISON: GROQ vs OLLAMA

### When to use Groq (Recommended for most users)

✅ **You want fast responses** - 10x faster than Ollama
✅ **You want easy setup** - No software installation
✅ **You have < 16GB RAM** - No hardware requirements
✅ **You're developing/testing** - Free tier is perfect
✅ **You want reliability** - Cloud-based, always available

### When to use Ollama instead

✅ **You need 100% privacy** - Data never leaves your machine
✅ **You work offline** - No internet required
✅ **You have powerful hardware** - 32GB+ RAM, GPU available
✅ **You're customizing models** - Fine-tuned models not on Groq
✅ **You have high volume** - Beyond free tier (1M+ requests/day)

---

## NEXT STEPS

1. ✅ Get Groq API key (5 min)
2. ✅ Configure `.env` file
3. ✅ Start Sidekick: `npm run dev`
4. ✅ Test with messages
5. 🚀 Start building!

**Optional:**
- Set up Ollama as local fallback (see `OLLAMA_SETUP.md`)
- Add Anthropic/OpenAI keys for redundancy
- Customize model selection per agent

---

## SUPPORT

**Groq Issues:**
- Docs: https://console.groq.com/docs
- Discord: https://groq.com/discord

**Sidekick Issues:**
- GitHub: https://github.com/hhsystems1/hhssidekick/issues

**Performance Issues:**
- Check Groq status: https://status.groq.com

---

## SUMMARY

**Groq = Best default choice**

| Feature | Rating |
|---------|--------|
| Speed | ⚡⚡⚡⚡⚡ 5/5 |
| Setup | ⚡⚡⚡⚡⚡ 5/5 |
| Cost | ⚡⚡⚡⚡⚡ 5/5 (free) |
| Privacy | ⚡⚡⚡⚡ 4/5 (cloud) |
| Reliability | ⚡⚡⚡⚡⚡ 5/5 |

**Total setup time: 5 minutes**
**Cost: $0 (free tier)**
**Speed: 500+ tokens/second**

**You're ready!** 🚀
