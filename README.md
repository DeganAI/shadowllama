# 🌐 ShadowLlama

```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║   ███████╗██╗  ██╗ █████╗ ██████╗  ██████╗ ██╗    ██╗             ║
║   ██╔════╝██║  ██║██╔══██╗██╔══██╗██╔═══██╗██║    ██║             ║
║   ███████╗███████║███████║██║  ██║██║   ██║██║ █╗ ██║             ║
║   ╚════██║██╔══██║██╔══██║██║  ██║██║   ██║██║███╗██║             ║
║   ███████║██║  ██║██║  ██║██████╔╝╚██████╔╝╚███╔███╔╝             ║
║   ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝  ╚═════╝  ╚══╝╚══╝              ║
║                                                                   ║
║   ██╗     ██╗      █████╗ ███╗   ███╗ █████╗                      ║
║   ██║     ██║     ██╔══██╗████╗ ████║██╔══██╗                     ║
║   ██║     ██║     ███████║██╔████╔██║███████║                     ║
║   ██║     ██║     ██╔══██║██║╚██╔╝██║██╔══██║                     ║
║   ███████╗███████╗██║  ██║██║ ╚═╝ ██║██║  ██║                     ║
║   ╚══════╝╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝                     ║
║                                                                   ║
║   Decentralized Dark Web Proxy + AI Marketplace                   ║
║   Pay-Per-Second Streaming • x402 Micropayments                   ║
║   Tor/I2P Hybrid • Zero Logs • Maximum Privacy                    ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

## 🎯 What is ShadowLlama?

**ShadowLlama** is a cyberpunk-themed **decentralized proxy network** where every byte of data costs cryptocurrency. Built on the **x402 micropayment protocol** and **Lucid Agent Kit**, it's the ultimate anonymous routing system for the digital underground.

### Core Features

🔒 **Anonymous Proxy Streaming**
- Route traffic through Tor/I2P exit nodes
- Pay ~$0.0001 per second or $0.001 per MB
- No accounts, no logs, zero tracking
- Nodes earn crypto automatically

📦 **Encrypted Dead Drops**
- Upload encrypted files others can purchase
- Perfect for whistleblowing and data leaks
- Set your own prices and expiration times
- Atomic payments via x402

🎯 **Hacking Bounties**
- Post challenges: "Hack this corp - 500 USDC reward"
- First valid submission wins
- Automatic payouts via smart contracts
- Zero-knowledge proof submissions

🤖 **AI Deck Assistants**
- Consult Claude, GPT-4, or Gemini
- Pay per token for AI navigation
- "Jack in" to browse forbidden zones
- Encrypted results, total privacy

💰 **Instant Micropayments**
- x402 protocol on Base network
- Pay only for what you use
- No subscriptions, no commitments
- USDC payments, instant settlement

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- npm or yarn
- x402-compatible wallet

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/shadowllama.git
cd shadowllama

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your payment addresses
nano .env

# Start the server
npm run dev
```

### Environment Variables

```bash
# Required
PAY_TO_ADDRESS_BASE=0x11c24Fbcd702cd611729F8402d8fB51ECa75Ba83
PAY_TO_ADDRESS_SOLANA=2x4BRUreTFZCaCKbGKVXFYD5p2ZUBpYaYjuYsw9KYhf3
NETWORK=base
FACILITATOR_URL=https://facilitator.x402.org

# Optional
PORT=3000
ANTHROPIC_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
```

## 📡 API Endpoints

### 1. Start Proxy Stream
```bash
POST /entrypoints/start-proxy-stream/invoke
{
  "targetUrl": "https://example.onion",
  "network": "tor",
  "duration": 300,
  "minNodeReputation": 0.8
}
```

**Response:**
```json
{
  "sessionId": "abc123",
  "selectedNode": {
    "id": "tor-exit-nl-001",
    "network": "tor",
    "reputation": 0.95,
    "region": "Netherlands"
  },
  "estimatedCost": "$0.050000 USDC",
  "streamUrl": "wss://shadowllama.stream/abc123",
  "expiresAt": "2025-11-18T15:30:00Z",
  "message": "🔒 Proxy stream established. Neural link active..."
}
```

### 2. Create Dead Drop
```bash
POST /entrypoints/create-dead-drop/invoke
{
  "encryptedData": "base64_encrypted_data_here",
  "price": 5.0,
  "expiresInHours": 168,
  "maxDownloads": 50,
  "description": "Leaked corp documents Q3 2025",
  "tags": ["leak", "corporate", "finance"]
}
```

### 3. Post Bounty
```bash
POST /entrypoints/post-bounty/invoke
{
  "title": "Breach MegaCorp firewall",
  "description": "Need access to internal network. Admin credentials required.",
  "reward": 500,
  "expiresInHours": 72,
  "proofRequired": "Screenshot of admin panel + network diagram"
}
```

### 4. AI Deck Query
```bash
POST /entrypoints/ai-deck-query/invoke
{
  "query": "Analyze this smart contract for vulnerabilities",
  "model": "claude",
  "maxTokens": 2000
}
```

### 5. System Info (Free)
```bash
GET /entrypoints/system-info/invoke
```

## 💰 Pricing

| Service | Cost | Details |
|---------|------|---------|
| **Proxy Streaming** | $0.0001/sec | ~$0.36/hour maximum |
| **Proxy Bandwidth** | $0.001/MB | Pay for what you use |
| **Dead Drop Post** | $0.05 | One-time creation fee |
| **Dead Drop Purchase** | Varies | Set by creator |
| **AI Query** | $0.025 | Per query + token cost |
| **Bounty Post** | $0.10 | Post a challenge |
| **Node Status** | Free | Network information |

## 🔧 x402 Integration

ShadowLlama is fully x402-compliant and discoverable:

- **x402 Manifest**: `/.well-known/agent.json`
- **Entrypoints**: `/entrypoints`
- **Payment Protocol**: HTTP 402 Payment Required
- **Settlement**: Instant on Base network
- **Facilitator**: x402.org standard

### Register on x402scan

```bash
# Your agent URL
https://your-domain.com/entrypoints/start-proxy-stream

# Will be automatically discovered by x402 ecosystem
```

## 🛡️ Security & Privacy

### Zero-Log Architecture
- No IP logging
- No session tracking
- No user identification
- Payment = Access token

### Encryption
- All dead drops are encrypted client-side
- Tor/I2P routing for anonymity
- Optional PGP for dead drop keys
- TLS everywhere

### Reputation System
- Nodes earn reputation through honest service
- Bad nodes get slashed and delisted
- Users can filter by minimum reputation
- Transparent scoring algorithm

## 🌐 Network Modes

### Full Node (Default)
- Accepts proxy requests
- Hosts dead drops
- Processes bounties
- Runs AI queries
- Earns from all services

### Relay Node
- Routes traffic only
- Doesn't store data
- Lower liability
- Still earns fees

### Exit Node
- Final hop in proxy chain
- Higher risk, higher reward
- Optional configuration
- Legal protections vary

## 📊 Node Operator Guide

### Running a Proxy Node

```bash
# Set node mode
NODE_MODE=full

# Generate node ID
NODE_ID=$(openssl rand -hex 16)

# Configure Tor (optional)
TOR_PROXY_HOST=127.0.0.1
TOR_PROXY_PORT=9050

# Start earning
npm start
```

### Earnings Breakdown

Example for a node with 0.9 reputation:
- 1000 sessions/month @ $0.01 avg = $10/month
- 50 GB bandwidth @ $0.001/MB = $50/month
- Dead drop hosting fees = $5/month
- **Total: ~$65/month passive income**

High-reputation nodes (0.95+) earn 2-3x more.

## 🎨 Cyberpunk UI

ShadowLlama includes a neon-drenched terminal aesthetic:

```
[SYSTEM] Jacking into the matrix...
[NETWORK] FULL node initializing...
[PAYMENT] x402 protocol active on base
[CRYPTO] Pay address: 0x11c24Fbc...

[PROXY] ICE detected. Paying to breach...
[DEAD DROP] Neural link established. Streaming data...
[BOUNTY] Netrunners mobilizing...
[AI DECK] Oracle consulted. Tokens burning...
```

## 🚀 Deployment

### Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up
```

### Docker

```bash
# Build image
docker build -t shadowllama .

# Run container
docker run -p 3000:3000 --env-file .env shadowllama
```

### Environment Variables (Production)

Set these in your deployment platform:
- `PAY_TO_ADDRESS_BASE`
- `PAY_TO_ADDRESS_SOLANA`
- `FACILITATOR_URL`
- `NETWORK=base`
- `NODE_MODE=full`

## 📈 Use Cases

### Journalists & Whistleblowers
- Anonymous document submission
- Encrypted communication channels
- No centralized servers to subpoena
- Pay-per-use, no trails

### Security Researchers
- Test exploit tooling anonymously
- Post vulnerability bounties
- Trade zero-days securely
- AI-assisted reconnaissance

### Privacy Activists
- Censorship circumvention
- Repressive regime bypass
- VPN alternative (pay per use)
- No logs = no evidence

### Crypto Traders
- Front-run protection via routing
- Private on-chain analysis
- MEV opportunity scanning
- Market intel trading

## 🏆 Lucid Agent
- **Framework**: [@lucid-dreams/agent-kit](https://www.npmjs.com/package/@lucid-dreams/agent-kit)
- **Protocol**: x402 micropayments
- **Network**: Base (USDC)

### Submission Wallet
- **Base**: `0x11c24Fbcd702cd611729F8402d8fB51ECa75Ba83`
- **Solana**: `2x4BRUreTFZCaCKbGKVXFYD5p2ZUBpYaYjuYsw9KYhf3`
- **Ethereum**: `0x11c24Fbcd702cd611729F8402d8fB51ECa75Ba83`

## 🔗 Links

- **Live Demo**: Coming soon
- **x402scan**: Will be registered post-deployment
- **Documentation**: See `/docs` folder
- **Discord**: Join the underground

## 🤝 Contributing

Contributions welcome! This is open-source infrastructure for the ungoverned internet.

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Submit a PR

## 📜 License

MIT License - Use it, fork it, remix it. Just don't blame us.

## ⚠️ Legal Disclaimer

ShadowLlama is a **proof-of-concept** for decentralized infrastructure. Users are responsible for their own actions. The developers make no warranties about privacy, security, or legal compliance. Use at your own risk.

This software is provided "as is" without warranty of any kind. By using ShadowLlama, you acknowledge:
- You understand the risks of anonymous networks
- You won't use it for illegal activities
- You're responsible for compliance with local laws
- The developers aren't liable for your actions

---

## 🌟 Why This Matters

The internet was supposed to be free. Somewhere along the way, surveillance capitalism won. Every click tracked, every search monetized, every thought catalogued.

**ShadowLlama is the fightback.**

It's what happens when you combine:
- William Gibson's Sprawl trilogy
- Satoshi's vision of P2P electronic cash
- Modern AI capabilities
- Zero-knowledge cryptography

The result? A network where:
- Privacy is default, not optional
- Value flows like electricity
- No company owns your data
- Nodes earn by serving users
- AI agents navigate autonomously
- Reputation = trust, cryptographically

**This is the internet we deserved.**

Now jack in, chummer. The matrix is waiting.

```
[SYSTEM] Ready to stream... 🌐
[PAYMENT] x402 protocol active 💰
[NETWORK] Zero logs engaged 🔒
[STATUS] Maximum privacy 🛡️

> _
```

---

**Built with ❤️ for the ungoverned internet**

*"The future is already here — it's just not evenly distributed." - William Gibson*
