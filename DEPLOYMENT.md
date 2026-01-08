# Deployment Guide

## Netlify Deployment

This project is configured for automatic Netlify deployment using `netlify.toml`.

### Configuration

The `netlify.toml` file configures:
- **Base directory**: `sidekick-react-pwa/`
- **Build command**: `npm install && npm run build`
- **Publish directory**: `dist/`
- **Node version**: 22

### Required Environment Variables

Set these in your Netlify dashboard under **Site settings → Environment variables**:

#### Required
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_AI_PROVIDER=groq
VITE_GROQ_API_KEY=gsk_your_groq_api_key
```

#### Optional (fallback providers)
```bash
VITE_OLLAMA_URL=http://localhost:11434
VITE_OPENAI_API_KEY=sk_your_openai_key
VITE_ANTHROPIC_API_KEY=sk-ant_your_anthropic_key
```

### Deploy Steps

1. **Connect Repository** to Netlify
2. **Set Environment Variables** in Netlify dashboard
3. **Deploy** - Netlify will automatically:
   - Navigate to `sidekick-react-pwa/`
   - Run `npm install`
   - Run `npm run build`
   - Publish from `sidekick-react-pwa/dist/`

### Local Development

For local development, you don't need the root package.json anymore:

```bash
cd sidekick-react-pwa
npm install
npm run dev
```

The dev server will start on `http://localhost:5173/`

### Build Output

Build creates:
- `dist/index.html` - Entry point
- `dist/assets/*.css` - Styles (~17KB)
- `dist/assets/*.js` - JavaScript bundle (~211KB)

### Troubleshooting

**Build fails with "module not found":**
- Check that all environment variables are set in Netlify
- Verify Node version is 22+

**404 on refresh:**
- The `netlify.toml` includes SPA redirect rules
- All routes redirect to `/index.html` for client-side routing

**Environment variables not loading:**
- Make sure all variable names start with `VITE_`
- Rebuild the site after adding new variables
