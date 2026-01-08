# OLLAMA SETUP GUIDE

Complete guide for setting up Sidekick with local Ollama models instead of cloud APIs.

---

## WHY OLLAMA?

✅ **Open Source** - Run models locally with full control
✅ **Privacy** - No data sent to external APIs
✅ **Cost-Effective** - Free after initial setup
✅ **Flexibility** - Choose different models per agent
✅ **Offline Capable** - Works without internet

---

## PREREQUISITES

### System Requirements

**Minimum (for 8B models):**
- 16GB RAM
- 10GB free disk space
- Modern CPU (any x64/ARM64)

**Recommended (for 14B+ models):**
- 32GB RAM
- 50GB free disk space
- NVIDIA GPU with 8GB+ VRAM (optional, speeds up inference)

**Operating System:**
- macOS 11+
- Linux (Ubuntu 22.04+, Debian, Fedora, etc.)
- Windows 10/11 with WSL2

---

## INSTALLATION

### Step 1: Install Ollama

**macOS:**
```bash
# Download from website
curl -fsSL https://ollama.com/install.sh | sh

# Or use Homebrew
brew install ollama
```

**Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**Windows:**
```bash
# Install WSL2 first, then run in Ubuntu:
curl -fsSL https://ollama.com/install.sh | sh
```

**Verify installation:**
```bash
ollama --version
# Should output: ollama version 0.5.x
```

---

### Step 2: Start Ollama Server

```bash
# Start Ollama server (runs on http://localhost:11434)
ollama serve
```

**Run as background service:**

**macOS/Linux (systemd):**
```bash
sudo systemctl enable ollama
sudo systemctl start ollama
```

**macOS (launchd):**
```bash
# Ollama auto-installs as a service on macOS
# It starts automatically on boot
```

**Verify server is running:**
```bash
curl http://localhost:11434/api/version
# Should return: {"version":"0.5.x"}
```

---

### Step 3: Pull Required Models

Sidekick uses different models for different agent types:

```bash
# Reflection Agent - Fast, conversational (8B)
ollama pull llama3.1:8b

# Strategy Agent - Strong reasoning (14B)
ollama pull qwen2.5:14b

# Systems Agent - Process optimization (14B)
ollama pull qwen2.5:14b

# Technical Agent - Code reasoning (14B)
ollama pull deepseek-r1:14b

# Creative Agent - Content generation (8B)
ollama pull llama3.1:8b
```

**Note:** First pull takes 5-15 minutes per model (downloads ~5-10GB each).

**Check downloaded models:**
```bash
ollama list
```

**Expected output:**
```
NAME                    ID              SIZE      MODIFIED
llama3.1:8b             abc123...       4.7 GB    2 minutes ago
qwen2.5:14b             def456...       8.5 GB    5 minutes ago
deepseek-r1:14b         ghi789...       8.2 GB    10 minutes ago
```

---

### Step 4: Test Models

**Test a single model:**
```bash
ollama run llama3.1:8b
```

Type a message:
```
>>> Hello, can you hear me?
Hello! Yes, I can hear you. How can I help you today?
```

Exit with `/bye`

**Test via API:**
```bash
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.1:8b",
  "prompt": "Say hello",
  "stream": false
}'
```

---

## SIDEKICK CONFIGURATION

### Step 5: Update Environment Variables

Edit `.env` file:

```bash
cd sidekick-react-pwa
cp .env.example .env
```

**Configure for Ollama:**
```bash
# .env

# Use Ollama as primary provider
VITE_AI_PROVIDER=ollama

# Ollama server URL (default: localhost)
VITE_OLLAMA_URL=http://localhost:11434

# Model assignments (optional - uses defaults if not set)
VITE_MODEL_REFLECTION=llama3.1:8b
VITE_MODEL_STRATEGY=qwen2.5:14b
VITE_MODEL_SYSTEMS=qwen2.5:14b
VITE_MODEL_TECHNICAL=deepseek-r1:14b
VITE_MODEL_CREATIVE=llama3.1:8b

# Optional: API keys for fallback (if Ollama fails)
VITE_OPENAI_API_KEY=
VITE_ANTHROPIC_API_KEY=

# Supabase (existing)
VITE_SUPABASE_URL=https://zefcnmjqebpcnprhbmkc.supabase.co
VITE_SUPABASE_ANON_KEY=sb_secret_N4wyJJZFwtIwjigVwel0SQ_b6h15oMn
```

---

### Step 6: Install Dependencies

```bash
npm install
```

**New dependencies added:**
- `ollama` - Official Ollama client
- `langchain` - LangChain framework
- `@langchain/community` - Community integrations
- `@langchain/core` - Core abstractions
- `langgraph` - Agent orchestration
- `zod` - Schema validation

---

### Step 7: Start Sidekick

```bash
npm run dev
```

Open browser: http://localhost:5173

---

## TESTING YOUR SETUP

### In-App Health Check

Sidekick automatically checks Ollama availability on startup.

**Console output (good):**
```
✓ Ollama server reachable at http://localhost:11434
✓ Found 5 models: llama3.1:8b, qwen2.5:14b, deepseek-r1:14b
✓ All required models available
```

**Console output (bad):**
```
✗ Cannot connect to Ollama at http://localhost:11434
  Make sure Ollama is running: ollama serve
```

### Test Chat Messages

Send these messages to test different agents:

**Reflection Agent:**
```
"Help me think through starting a solar business"
Expected: Conversational, clarifying questions, empathetic
Model: llama3.1:8b
```

**Strategy Agent:**
```
"Should I use PPAs or direct sales for solar?"
Expected: Analytical, tradeoff analysis, decision framework
Model: qwen2.5:14b
```

**Systems Agent:**
```
"How can I automate my lead follow-up process?"
Expected: Process design, workflow steps, automation ideas
Model: qwen2.5:14b
```

**Technical Agent:**
```
"What tech stack should I use for my solar CRM?"
Expected: Architecture advice, technology comparisons
Model: deepseek-r1:14b
```

---

## MODEL SELECTION GUIDE

### Performance Tiers

| Model | Size | Speed | Quality | Best For |
|-------|------|-------|---------|----------|
| **llama3.1:8b** | 4.7GB | ⚡⚡⚡ Fast | ⭐⭐⭐ Good | Conversation, reflection |
| **qwen2.5:14b** | 8.5GB | ⚡⚡ Medium | ⭐⭐⭐⭐ Excellent | Strategy, systems thinking |
| **deepseek-r1:14b** | 8.2GB | ⚡⚡ Medium | ⭐⭐⭐⭐⭐ Best | Code, technical analysis |
| **mistral:7b** | 4.1GB | ⚡⚡⚡ Fast | ⭐⭐⭐ Good | Alternative to llama3.1 |

### Alternative Model Combinations

**Budget Setup (16GB RAM):**
```bash
VITE_MODEL_REFLECTION=llama3.1:8b
VITE_MODEL_STRATEGY=llama3.1:8b
VITE_MODEL_SYSTEMS=llama3.1:8b
VITE_MODEL_TECHNICAL=llama3.1:8b
VITE_MODEL_CREATIVE=llama3.1:8b
```

**Balanced Setup (32GB RAM) - Recommended:**
```bash
VITE_MODEL_REFLECTION=llama3.1:8b
VITE_MODEL_STRATEGY=qwen2.5:14b
VITE_MODEL_SYSTEMS=qwen2.5:14b
VITE_MODEL_TECHNICAL=deepseek-r1:14b
VITE_MODEL_CREATIVE=llama3.1:8b
```

**High-Performance Setup (64GB RAM + GPU):**
```bash
VITE_MODEL_REFLECTION=llama3.1:70b
VITE_MODEL_STRATEGY=qwen2.5:72b
VITE_MODEL_SYSTEMS=qwen2.5:72b
VITE_MODEL_TECHNICAL=deepseek-r1:70b
VITE_MODEL_CREATIVE=llama3.1:70b
```

---

## TROUBLESHOOTING

### Problem: "Cannot connect to Ollama"

**Solution:**
```bash
# Check if Ollama is running
ps aux | grep ollama

# If not running, start it
ollama serve

# Check port is accessible
curl http://localhost:11434/api/version
```

---

### Problem: "Model not found"

**Error:**
```
Model "qwen2.5:14b" not found. Pull it first: ollama pull qwen2.5:14b
```

**Solution:**
```bash
# List available models
ollama list

# Pull missing model
ollama pull qwen2.5:14b
```

---

### Problem: Slow responses (>30 seconds)

**Causes:**
- Model too large for available RAM
- CPU-only inference (no GPU)
- System under load

**Solutions:**

**1. Use smaller models:**
```bash
VITE_MODEL_STRATEGY=llama3.1:8b  # Instead of qwen2.5:14b
```

**2. Enable GPU acceleration:**
```bash
# Check GPU is detected
ollama run llama3.1:8b
# Should show: "Using GPU: NVIDIA ..."

# If not detected, install CUDA/ROCm drivers
```

**3. Increase memory:**
```bash
# Close other applications
# Or upgrade RAM
```

---

### Problem: Out of memory errors

**Error:**
```
Error: failed to allocate memory
```

**Solution:**

**Use quantized models (smaller, faster):**
```bash
# Instead of full precision
ollama pull qwen2.5:14b-q4_0  # 4-bit quantization

# Update .env
VITE_MODEL_STRATEGY=qwen2.5:14b-q4_0
```

**Or switch to smaller models:**
```bash
VITE_MODEL_STRATEGY=llama3.1:8b
```

---

### Problem: CORS errors in browser console

**Error:**
```
Access to fetch at 'http://localhost:11434' from origin 'http://localhost:5173' has been blocked by CORS
```

**Solution:**

**Set OLLAMA_ORIGINS environment variable:**
```bash
# macOS/Linux
export OLLAMA_ORIGINS="http://localhost:5173,http://localhost:3000"
ollama serve

# Or add to ~/.bashrc / ~/.zshrc for persistence
echo 'export OLLAMA_ORIGINS="http://localhost:5173"' >> ~/.zshrc
```

**Windows (PowerShell):**
```powershell
$env:OLLAMA_ORIGINS="http://localhost:5173"
ollama serve
```

---

## SWITCHING TO API PROVIDERS (FALLBACK)

If Ollama doesn't work on your system, Sidekick can fall back to cloud APIs:

### Option 1: OpenAI

```bash
# .env
VITE_AI_PROVIDER=openai
VITE_OPENAI_API_KEY=sk-...your-key...
```

Models used:
- Reflection/Creative/Orchestrator: `gpt-4o-mini`
- Strategy/Systems/Technical: `gpt-4o`

### Option 2: Anthropic (Claude)

```bash
# .env
VITE_AI_PROVIDER=anthropic
VITE_ANTHROPIC_API_KEY=sk-ant-...your-key...
```

Models used:
- Reflection/Creative/Orchestrator: `claude-3-5-haiku-20241022`
- Strategy/Systems/Technical: `claude-3-5-sonnet-20241022`

### Hybrid Setup (Ollama + API Fallback)

```bash
# .env
VITE_AI_PROVIDER=ollama
VITE_OLLAMA_URL=http://localhost:11434

# Fallback keys (used if Ollama fails)
VITE_OPENAI_API_KEY=sk-...
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

Sidekick will automatically try:
1. Ollama (primary)
2. Anthropic (if key available)
3. OpenAI (if key available)

---

## MONITORING & OPTIMIZATION

### Check Model Usage Stats

```bash
# In browser console (F12)
import { getOllamaStats } from './services/ai/ollama';
console.log(getOllamaStats());
```

**Output:**
```json
{
  "totalRequests": 47,
  "totalTokens": 23450,
  "averageLatencyMs": 1250,
  "modelUsage": {
    "llama3.1:8b": 20,
    "qwen2.5:14b": 18,
    "deepseek-r1:14b": 9
  }
}
```

### Optimize Response Time

**1. Keep models loaded in memory:**
```bash
# Pre-load frequently used models
ollama run llama3.1:8b &
ollama run qwen2.5:14b &
```

**2. Use smaller context windows:**
```typescript
// In agents/specialists/base.ts
protected getMaxTokens(): number {
  return 1000; // Instead of 1500
}
```

**3. Reduce conversation history:**
```typescript
// In services/ai/langchain-memory.ts
.limit(20); // Instead of 50
```

---

## ADVANCED CONFIGURATION

### Running Ollama on Remote Server

**Server setup:**
```bash
# On server (e.g., 192.168.1.100)
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

**Client .env:**
```bash
VITE_OLLAMA_URL=http://192.168.1.100:11434
```

### Using Docker

```bash
# Run Ollama in Docker
docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama

# Pull models
docker exec -it ollama ollama pull llama3.1:8b
```

### GPU Optimization (NVIDIA)

```bash
# Install CUDA toolkit
# https://developer.nvidia.com/cuda-downloads

# Verify GPU is used
ollama run llama3.1:8b
# Should show: "Using GPU: NVIDIA GeForce RTX ..."

# Monitor GPU usage
nvidia-smi -l 1
```

---

## NEXT STEPS

1. ✅ Ollama installed and running
2. ✅ Required models pulled
3. ✅ Sidekick configured to use Ollama
4. ✅ Test messages working with different agents

**Now you're ready to use Sidekick with local, open source models!**

**To customize agents further:**
- See `AGENT_ARCHITECTURE_PLAN.md` for agent system details
- See `src/config/ai-models.ts` to change model assignments
- See `src/agents/specialists/` to modify agent behavior

---

## SUPPORT

**Ollama Issues:**
- Docs: https://ollama.com/docs
- GitHub: https://github.com/ollama/ollama/issues

**Sidekick Issues:**
- GitHub: https://github.com/hhsystems1/hhssidekick/issues

**Model Performance:**
- Ollama Models Library: https://ollama.com/library
- Model benchmarks: https://huggingface.co/spaces/lmsys/chatbot-arena-leaderboard
