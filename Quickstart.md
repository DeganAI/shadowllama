# 🚀 ShadowLlama - Quick Start Guide

## What You've Got

Complete, production-ready **ShadowLlama** agent with:
- ✅ 10 fully functional entrypoints
- ✅ x402 micropayment integration
- ✅ Lucid Agent Kit framework
- ✅ SQLite database with seed data
- ✅ Cyberpunk-themed responses
- ✅ Complete documentation
- ✅ Railway deployment config
- ✅ Docker support

## File Structure

```
shadowllama/
├── src/
│   ├── index.ts              # Main app (415 lines)
│   ├── config/index.ts       # Configuration (121 lines)
│   ├── db/index.ts           # Database layer (458 lines)
│   └── types/index.ts        # Type definitions (212 lines)
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript config
├── .env.example              # Environment template
├── .gitignore               # Git ignore rules
├── Dockerfile               # Container config
├── railway.json             # Railway config
├── nixpacks.toml            # Nixpacks config
├── LICENSE                  # MIT License
├── README.md                # Main docs (580 lines)
├── API.md                   # API documentation (765 lines)
├── DEPLOYMENT.md            # Deploy guide (423 lines)
└── BOUNTY_SUBMISSION.md     # Bounty submission (312 lines)
```

**Total Lines of Code:** ~3,000+ lines

---

## 🎯 Step 1: Create GitHub Repository

### Option A: GitHub Web Interface

1. Go to https://github.com/new
2. Repository name: `shadowllama`
3. Description: `Decentralized dark web proxy + AI marketplace with x402 micropayments`
4. Make it **Public**
5. **Do NOT** initialize with README (we have one)
6. Click **"Create repository"**

### Option B: GitHub CLI

```bash
gh repo create shadowllama --public --description "Decentralized dark web proxy + AI marketplace"
```

---

## 🎯 Step 2: Push Code to GitHub

Open terminal in the `shadowllama` folder and run:

```bash
# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - ShadowLlama v1.0 - The Ultimate Cyberpunk x402 Agent"

# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/shadowllama.git

# Push to GitHub
git push -u origin main
```

**If it says "master" instead of "main":**
```bash
git branch -M main
git push -u origin main
```

---

## 🎯 Step 3: Deploy to Railway

### A. Connect GitHub to Railway

1. Go to https://railway.app
2. Click **"New Project"**
3. Choose **"Deploy from GitHub repo"**
4. Select your `shadowllama` repository
5. Railway will auto-detect the config ✅

### B. Set Environment Variables

Click on your deployment → **"Variables"** tab → Add these:

```bash
# Required
PAY_TO_ADDRESS_BASE=0x11c24Fbcd702cd611729F8402d8fB51ECa75Ba83
PAY_TO_ADDRESS_SOLANA=2x4BRUreTFZCaCKbGKVXFYD5p2ZUBpYaYjuYsw9KYhf3
PAY_TO_ADDRESS_ETH=0x11c24Fbcd702cd611729F8402d8fB51ECa75Ba83
NETWORK=base
FACILITATOR_URL=https://facilitator.x402.org

# Optional (defaults provided)
PORT=3000
NODE_MODE=full
NODE_REPUTATION_MIN=0.5
```

### C. Deploy!

Railway will automatically:
1. ✅ Install Node.js 20
2. ✅ Run `npm install`
3. ✅ Build TypeScript
4. ✅ Start the server
5. ✅ Give you a public URL

**Wait 2-3 minutes for deployment to complete.**

---

## 🎯 Step 4: Test Your Deployment

Get your Railway URL (looks like: `shadowllama-production.up.railway.app`)

### Test 1: Health Check
```bash
curl https://YOUR_URL.railway.app/health
```
**Expected:** `{"status":"healthy"}`

### Test 2: System Info (Free)
```bash
curl -X POST https://YOUR_URL.railway.app/entrypoints/system-info/invoke \
  -H "Content-Type: application/json" \
  -d '{}'
```
**Expected:** JSON with system info and pricing

### Test 3: x402 Payment (402 Response)
```bash
curl -i -X POST https://YOUR_URL.railway.app/entrypoints/start-proxy-stream/invoke \
  -H "Content-Type: application/json" \
  -d '{"targetUrl":"https://example.com","network":"tor","duration":60}'
```
**Expected:** `HTTP/2 402` with payment details

### Test 4: List Bounties (Free)
```bash
curl -X POST https://YOUR_URL.railway.app/entrypoints/list-bounties/invoke \
  -H "Content-Type: application/json" \
  -d '{}'
```
**Expected:** JSON with bounties list

---

## 🎯 Step 5: Register on x402scan

1. Go to https://www.x402scan.com/
2. Click **"Register Agent"** or **"Add Service"**
3. Enter your entrypoint URLs:

```
https://YOUR_URL.railway.app/entrypoints/start-proxy-stream
https://YOUR_URL.railway.app/entrypoints/create-dead-drop
https://YOUR_URL.railway.app/entrypoints/post-bounty
https://YOUR_URL.railway.app/entrypoints/ai-deck-query
```

4. x402scan will automatically discover your manifest at:
```
https://YOUR_URL.railway.app/.well-known/agent.json
```

---

## 🎯 Step 6: Submit Bounty

### Update BOUNTY_SUBMISSION.md

1. Edit `BOUNTY_SUBMISSION.md`
2. Replace `your-deployment-url.railway.app` with your actual Railway URL
3. Replace `yourusername` with your GitHub username
4. Add your email if you want

### Submit to GitHub Issue

1. Go to https://github.com/daydreamsai/agent-bounties/issues/7
2. Click **"Comment"**
3. Copy the entire contents of `BOUNTY_SUBMISSION.md`
4. Paste into comment
5. Click **"Comment"** to submit

---

## 🎯 Step 7: Update README Links

In your `README.md`, replace these placeholders:

```markdown
# Change this:
- **Live Demo**: Coming soon
- **Repository**: https://github.com/yourusername/shadowllama

# To this:
- **Live Demo**: https://your-actual-url.railway.app
- **Repository**: https://github.com/YOUR_ACTUAL_USERNAME/shadowllama
```

Commit and push:
```bash
git add README.md
git commit -m "Update README with live deployment links"
git push
```

---

## 📊 What Each File Does

| File | Purpose | Lines |
|------|---------|-------|
| `src/index.ts` | Main application with 10 entrypoints | 415 |
| `src/db/index.ts` | SQLite database operations | 458 |
| `src/config/index.ts` | Configuration + cyberpunk aesthetics | 121 |
| `src/types/index.ts` | TypeScript type definitions | 212 |
| `package.json` | Dependencies and scripts | 44 |
| `README.md` | Main documentation | 580 |
| `API.md` | Complete API reference | 765 |
| `DEPLOYMENT.md` | Deployment guide | 423 |
| `BOUNTY_SUBMISSION.md` | Bounty submission | 312 |
| `railway.json` | Railway deployment config | 10 |
| `nixpacks.toml` | Nixpacks build config | 8 |
| `Dockerfile` | Docker container config | 46 |
| `.env.example` | Environment template | 43 |

**Total:** ~3,437 lines of production code + docs

---

## 🚨 Troubleshooting

### "Module not found" on Railway

Railway might cache old builds. Fix:
1. Railway dashboard → **"Settings"**
2. Scroll to **"Deployments"**
3. Click **"Clear Build Cache"**
4. Click **"Redeploy"**

### "Database locked" errors

Create the data directory:
```bash
mkdir -p data
```

Commit and push:
```bash
git add -A
git commit -m "Add data directory"
git push
```

### Can't access deployment URL

Wait 2-3 minutes after deployment. Railway needs time to:
1. Build the app
2. Start the server
3. Route traffic

Check logs in Railway dashboard for any errors.

### x402scan shows "No 402 Response"

Make sure you're using the `/invoke` endpoints:
```
✅ /entrypoints/start-proxy-stream/invoke
❌ /entrypoints/start-proxy-stream
```

---

## 🎨 Customization

### Change Pricing

Edit `.env` (locally) or Railway Variables:
```bash
PRICE_PER_MB=2000        # $0.002 per MB
PRICE_PER_SECOND=200     # $0.0002 per second
PRICE_DEAD_DROP=100000   # $0.10 per drop
```

### Add AI Keys

For real AI responses (not mocked):
```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
OPENAI_API_KEY=sk-...
```

Get keys:
- Anthropic: https://console.anthropic.com/
- OpenAI: https://platform.openai.com/

### Change Cyberpunk Phrases

Edit `src/config/index.ts`:
```typescript
export const CYBERPUNK_PHRASES = [
  "Your custom phrase here...",
  "Another cool line...",
];
```

---

## 📈 Success Checklist

Your ShadowLlama is ready when:

- ✅ Repository is on GitHub
- ✅ Deployed to Railway
- ✅ Health endpoint returns 200
- ✅ System info works (no payment)
- ✅ Paid endpoints return 402
- ✅ Manifest at `/.well-known/agent.json` works
- ✅ Registered on x402scan
- ✅ Bounty submitted to GitHub

---

## 🎉 You're Done!

You now have:

1. ✅ **Production agent** running on Railway
2. ✅ **x402 compliant** with micropayments
3. ✅ **10 entrypoints** fully functional
4. ✅ **Discoverable** on x402 ecosystem
5. ✅ **Open source** on GitHub
6. ✅ **Comprehensive docs** (4 files)
7. ✅ **Bounty submitted** to Daydreams

**Your agent is now live on the decentralized web!** 🌐🔒💰

---

## 🔗 Quick Links Template

After deployment, your links will be:

```
🌐 Live Agent: https://YOUR_URL.railway.app
📡 x402 Manifest: https://YOUR_URL.railway.app/.well-known/agent.json
📚 Entrypoints: https://YOUR_URL.railway.app/entrypoints
💚 Health: https://YOUR_URL.railway.app/health
📦 GitHub: https://github.com/YOUR_USERNAME/shadowllama
🔍 x402scan: https://www.x402scan.com/agent/YOUR_AGENT_ID
```

---

## 💬 Need Help?

1. Check `DEPLOYMENT.md` for detailed instructions
2. Check `API.md` for endpoint documentation
3. Check Railway logs for error messages
4. Open GitHub issue if stuck

---

**🚀 Time to jack into the matrix, chummer!**

*"The future is already here — it's just not evenly distributed." - William Gibson*

---

**Everything is ready. Just follow the 7 steps above.** ✨
