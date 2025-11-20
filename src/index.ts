// src/index.ts
// ShadowLlama Main Application - Cyberpunk Dark Web Proxy

import './server.js';
import { createAgentApp } from "@lucid-dreams/agent-kit";
import { config, BANNER, getRandomPhrase } from "./config/index.js";
import { ShadowLlamaDB } from "./db/index.js";
import { serve } from "@hono/node-server";
import type { ProxyNode } from "./types/index.js";
import { requirePayment } from "./middleware/x402.js";

// ============================================================================
// INITIALIZATION
// ============================================================================

const db = new ShadowLlamaDB();

console.log(BANNER);
console.log(`[SYSTEM] Node ID: ${config.node.id}`);
console.log(`[NETWORK] Mode: ${config.node.mode}`);
console.log(`[CRYPTO] Base: ${config.payments.baseAddress}`);
console.log(`[PRICING] Per MB: $${(config.pricing.perMB / 1_000_000).toFixed(4)} USDC\n`);

seedDemoNodes();

// ============================================================================
// CREATE AGENT APP
// ============================================================================

const agentApp: any = createAgentApp({
  name: "shadowllama-agent",
  version: "1.0.0",
  description: "🌐 Decentralized pay-per-second dark web proxy + AI-powered underground marketplace.",
});

const app = agentApp.app;
const addEntrypoint = agentApp.addEntrypoint;

// ============================================================================
// PRICING
// ============================================================================

const PRICING = {
  proxyStream: 0.05,
  deadDropCreate: 0.10,
  deadDropPurchase: 0.15,
  listDeadDrops: 0.02,       // Small fee for listing
  bountyPost: 0.25,
  submitBountyProof: 0.05,   // Small fee for submission
  listBounties: 0.02,        // Small fee for listing
  nodeStatus: 0.02,          // Small fee for status
  aiQuery: 0.10,
  systemInfo: 0.01,          // Tiny fee for info
};

// ============================================================================
// OG IMAGE
// ============================================================================

app.get("/og-image.png", (c: any) => {
  const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#0a0a0a;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#1a1a2e;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#bg)"/>
    <text x="600" y="200" font-family="monospace" font-size="72" fill="#00ff00" text-anchor="middle" font-weight="bold">SHADOWLLAMA</text>
    <text x="600" y="280" font-family="monospace" font-size="32" fill="#00cc00" text-anchor="middle">Decentralized Dark Web Proxy</text>
    <text x="600" y="350" font-family="monospace" font-size="24" fill="#888" text-anchor="middle">🔒 Tor/I2P • 💰 x402 Micropayments</text>
    <text x="600" y="420" font-family="monospace" font-size="24" fill="#888" text-anchor="middle">📦 Dead Drops • 🎯 Bounties • 🤖 AI</text>
  </svg>`;
  c.header("Content-Type", "image/svg+xml");
  return c.body(svg);
});

// ============================================================================
// ROOT PAGE
// ============================================================================

app.get("/", (c: any) => {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ShadowLlama - Decentralized Dark Web Proxy</title>
  <meta name="description" content="🌐 Pay-per-second anonymous proxy network with encrypted dead drops, hacking bounties, and AI deck assistants. Tor/I2P hybrid with x402 micropayments.">
  <meta property="og:title" content="ShadowLlama - Decentralized Dark Web Proxy">
  <meta property="og:description" content="🌐 Pay-per-second anonymous proxy network with encrypted dead drops, hacking bounties, and AI deck assistants.">
  <meta property="og:image" content="https://shadowllama-production.up.railway.app/og-image.png">
  <style>
    body { font-family: monospace; background: #0a0a0a; color: #00ff00; padding: 40px; max-width: 1200px; margin: 0 auto; }
    h1 { color: #00ff00; text-shadow: 0 0 20px #00ff00; font-size: 3em; }
    .endpoint { background: rgba(0, 255, 0, 0.1); border-left: 4px solid #00ff00; padding: 15px; margin: 10px 0; }
    .price { color: #00ff00; font-weight: bold; }
  </style>
</head>
<body>
  <h1>🌐 ShadowLlama</h1>
  <p>Decentralized dark web proxy + AI marketplace</p>
  <h2>💰 Pricing</h2>
  <div class="endpoint">🔒 Proxy Stream: <span class="price">$${PRICING.proxyStream}</span></div>
  <div class="endpoint">📦 Create Drop: <span class="price">$${PRICING.deadDropCreate}</span></div>
  <div class="endpoint">💰 Purchase Drop: <span class="price">$${PRICING.deadDropPurchase}</span></div>
  <div class="endpoint">📋 List Drops: <span class="price">$${PRICING.listDeadDrops}</span></div>
  <div class="endpoint">🎯 Post Bounty: <span class="price">$${PRICING.bountyPost}</span></div>
  <div class="endpoint">📸 Submit Proof: <span class="price">$${PRICING.submitBountyProof}</span></div>
  <div class="endpoint">🎯 List Bounties: <span class="price">$${PRICING.listBounties}</span></div>
  <div class="endpoint">🤖 AI Query: <span class="price">$${PRICING.aiQuery}</span></div>
  <div class="endpoint">📊 Node Status: <span class="price">$${PRICING.nodeStatus}</span></div>
  <div class="endpoint">ℹ️ System Info: <span class="price">$${PRICING.systemInfo}</span></div>
</body>
</html>`;
  c.header("Content-Type", "text/html");
  return c.body(html);
});

// ============================================================================
// X402 MIDDLEWARE DEFINITIONS
// ============================================================================

const proxyMiddleware = requirePayment({ amount: PRICING.proxyStream, description: "🔒 Start anonymous proxy streaming session" });
const deadDropCreateMiddleware = requirePayment({ amount: PRICING.deadDropCreate, description: "📦 Create encrypted dead drop" });
const deadDropPurchaseMiddleware = requirePayment({ amount: PRICING.deadDropPurchase, description: "💰 Purchase encrypted dead drop" });
const listDeadDropsMiddleware = requirePayment({ amount: PRICING.listDeadDrops, description: "📋 List available dead drops" });
const bountyMiddleware = requirePayment({ amount: PRICING.bountyPost, description: "🎯 Post hacking bounty" });
const submitBountyProofMiddleware = requirePayment({ amount: PRICING.submitBountyProof, description: "📸 Submit bounty proof" });
const listBountiesMiddleware = requirePayment({ amount: PRICING.listBounties, description: "🎯 List available bounties" });
const aiMiddleware = requirePayment({ amount: PRICING.aiQuery, description: "🤖 Consult AI deck assistant" });
const nodeStatusMiddleware = requirePayment({ amount: PRICING.nodeStatus, description: "📊 Check proxy node status" });
const systemInfoMiddleware = requirePayment({ amount: PRICING.systemInfo, description: "ℹ️ Get system information" });

// ============================================================================
// APPLY MIDDLEWARE TO ALL ENDPOINTS (GET and POST)
// ============================================================================

// Start Proxy Stream
app.get("/entrypoints/start-proxy-stream/invoke", proxyMiddleware);
app.post("/entrypoints/start-proxy-stream/invoke", proxyMiddleware);

// Create Dead Drop
app.get("/entrypoints/create-dead-drop/invoke", deadDropCreateMiddleware);
app.post("/entrypoints/create-dead-drop/invoke", deadDropCreateMiddleware);

// Purchase Dead Drop
app.get("/entrypoints/purchase-dead-drop/invoke", deadDropPurchaseMiddleware);
app.post("/entrypoints/purchase-dead-drop/invoke", deadDropPurchaseMiddleware);

// List Dead Drops
app.get("/entrypoints/list-dead-drops/invoke", listDeadDropsMiddleware);
app.post("/entrypoints/list-dead-drops/invoke", listDeadDropsMiddleware);

// Post Bounty
app.get("/entrypoints/post-bounty/invoke", bountyMiddleware);
app.post("/entrypoints/post-bounty/invoke", bountyMiddleware);

// Submit Bounty Proof
app.get("/entrypoints/submit-bounty-proof/invoke", submitBountyProofMiddleware);
app.post("/entrypoints/submit-bounty-proof/invoke", submitBountyProofMiddleware);

// List Bounties
app.get("/entrypoints/list-bounties/invoke", listBountiesMiddleware);
app.post("/entrypoints/list-bounties/invoke", listBountiesMiddleware);

// AI Deck Query
app.get("/entrypoints/ai-deck-query/invoke", aiMiddleware);
app.post("/entrypoints/ai-deck-query/invoke", aiMiddleware);

// Node Status
app.get("/entrypoints/node-status/invoke", nodeStatusMiddleware);
app.post("/entrypoints/node-status/invoke", nodeStatusMiddleware);

// System Info
app.get("/entrypoints/system-info/invoke", systemInfoMiddleware);
app.post("/entrypoints/system-info/invoke", systemInfoMiddleware);

// ============================================================================
// ENTRYPOINTS
// ============================================================================

addEntrypoint({
  key: "start-proxy-stream",
  description: `🔒 Proxy session ($${PRICING.proxyStream})`,
  async handler(ctx: any) {
    const input = ctx.input || {};
    const nodes = db.getProxyNodes(0.7).filter((n: any) => n.network === (input.network || "tor"));
    if (nodes.length === 0) throw new Error("No nodes available");
    const selectedNode = nodes[0];
    const sessionId = db.createSession({ nodeId: selectedNode.id, bytesTransferred: 0, cost: PRICING.proxyStream, userId: "user-" + Date.now() });
    return { output: { sessionId, selectedNode: { id: selectedNode.id, network: selectedNode.network }, estimatedCost: `$${PRICING.proxyStream}`, streamUrl: `wss://shadowllama.stream/${sessionId}`, message: `🔒 ${getRandomPhrase()}` }};
  },
});

addEntrypoint({
  key: "create-dead-drop",
  description: `📦 Create drop ($${PRICING.deadDropCreate})`,
  async handler(ctx: any) {
    const input = ctx.input || {};
    const dropId = db.createDeadDrop({ encryptedData: input.encryptedData || "", price: input.price || 0.05, creator: "anon-" + Date.now(), expiresAt: new Date(Date.now() + 168 * 3600 * 1000), maxDownloads: 100, metadata: { size: 0, mimeType: "application/octet-stream", description: input.description, tags: [] }});
    return { output: { dropId, price: `$${input.price || 0.05}`, message: `📦 ${getRandomPhrase()}` }};
  },
});

addEntrypoint({
  key: "purchase-dead-drop",
  description: `💰 Purchase drop ($${PRICING.deadDropPurchase})`,
  async handler(ctx: any) {
    const drop = db.getDeadDrop(ctx.input?.dropId);
    if (!drop) throw new Error("Dead drop not found");
    db.incrementDeadDropDownload(drop.id);
    return { output: { dropId: drop.id, encryptedData: drop.encryptedData, message: `✓ ${getRandomPhrase()}` }};
  },
});

addEntrypoint({
  key: "list-dead-drops",
  description: `📋 Browse drops ($${PRICING.listDeadDrops})`,
  async handler(ctx: any) {
    const drops = db.listDeadDrops(20);
    return { output: { drops: drops.map((d: any) => ({ dropId: d.id, price: `$${d.price}`, downloads: d.downloads, maxDownloads: d.maxDownloads })), total: drops.length, message: `📋 Found ${drops.length} drops` }};
  },
});

addEntrypoint({
  key: "post-bounty",
  description: `🎯 Post bounty ($${PRICING.bountyPost})`,
  async handler(ctx: any) {
    const input = ctx.input || {};
    const bountyId = db.createBounty({ title: input.title || "Bounty", description: input.description || "", reward: input.reward || 100, creator: "anon-" + Date.now(), expiresAt: new Date(Date.now() + 168 * 3600 * 1000), proofRequired: "Proof" });
    return { output: { bountyId, title: input.title || "Bounty", reward: `$${input.reward || 100}`, message: `🎯 ${getRandomPhrase()}` }};
  },
});

addEntrypoint({
  key: "submit-bounty-proof",
  description: `📸 Submit proof ($${PRICING.submitBountyProof})`,
  async handler(ctx: any) {
    const submissionId = db.submitBounty({ bountyId: ctx.input?.bountyId, submitter: ctx.input?.submitterAddress, proof: ctx.input?.proof || "" });
    return { output: { submissionId, bountyId: ctx.input?.bountyId, status: "pending", message: `📸 ${getRandomPhrase()}` }};
  },
});

addEntrypoint({
  key: "list-bounties",
  description: `🎯 Browse bounties ($${PRICING.listBounties})`,
  async handler(ctx: any) {
    const bounties = db.listBounties(ctx.input?.status);
    return { output: { bounties: bounties.map((b: any) => ({ bountyId: b.id, title: b.title, reward: `$${b.reward}`, status: b.status, submissions: b.submissions.length })), total: bounties.length, message: `🎯 Found ${bounties.length} bounties` }};
  },
});

addEntrypoint({
  key: "ai-deck-query",
  description: `🤖 AI query ($${PRICING.aiQuery})`,
  async handler(ctx: any) {
    const input = ctx.input || {};
    const queryId = db.saveAIQuery({ query: input.query || "", model: input.model || "claude", maxTokens: 1000, userId: "user-" + Date.now(), cost: PRICING.aiQuery, response: "[AI]: Processing your query in the sprawl..." });
    return { output: { queryId, model: (input.model || "claude").toUpperCase(), response: "[AI]: Processing your query in the sprawl...", tokensUsed: 500, cost: `$${PRICING.aiQuery}`, message: `🤖 ${getRandomPhrase()}` }};
  },
});

addEntrypoint({
  key: "node-status",
  description: `📊 Node status ($${PRICING.nodeStatus})`,
  async handler(ctx: any) {
    const input = ctx.input || {};
    let nodes = db.getProxyNodes(input.minReputation || 0.5);
    if (input.network) nodes = nodes.filter((n: any) => n.network === input.network);
    return { output: { nodes: nodes.map((n: any) => ({ nodeId: n.id, network: n.network, reputation: n.reputation, totalSessions: n.totalSessions, region: n.region })), total: nodes.length, averageReputation: nodes.reduce((sum: number, n: any) => sum + n.reputation, 0) / (nodes.length || 1), message: `📊 ${nodes.length} nodes online` }};
  },
});

addEntrypoint({
  key: "system-info",
  description: `ℹ️ System info ($${PRICING.systemInfo})`,
  async handler() {
    return { output: { name: "ShadowLlama", version: "1.0.0", network: config.payments.network, nodeMode: config.node.mode, pricing: PRICING, capabilities: ["Tor/I2P routing", "Dead drops", "Bounties", "AI assistants", "x402 micropayments"], message: `🌐 ${getRandomPhrase()}` }};
  },
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function seedDemoNodes() {
  const demoNodes: Omit<ProxyNode, "lastSeen">[] = [
    { id: "tor-exit-nl-001", address: "tor://nlexitnode001.onion", network: "tor", reputation: 0.95, totalBytes: 15_000_000_000, totalSessions: 1250, earnings: 125.5, region: "Netherlands", capabilities: ["streaming"] },
    { id: "tor-exit-de-042", address: "tor://deexitnode042.onion", network: "tor", reputation: 0.88, totalBytes: 8_500_000_000, totalSessions: 820, earnings: 89.3, region: "Germany", capabilities: ["streaming"] },
    { id: "i2p-relay-jp-007", address: "i2p://jprelay007.i2p", network: "i2p", reputation: 0.92, totalBytes: 12_000_000_000, totalSessions: 950, earnings: 105.8, region: "Japan", capabilities: ["streaming"] },
    { id: "tor-guard-us-123", address: "tor://usguardnode123.onion", network: "tor", reputation: 0.78, totalBytes: 5_200_000_000, totalSessions: 450, earnings: 52.1, region: "United States", capabilities: ["guard"] },
  ];
  try { 
    demoNodes.forEach((n) => { 
      if (!db.getProxyNodes(0).find((e) => e.id === n.id)) db.addProxyNode(n); 
    }); 
    console.log(`[DB] ✓ Seeded ${demoNodes.length} demo nodes`); 
  } catch {}
}

// ============================================================================
// START SERVER
// ============================================================================

const PORT = parseInt(process.env.PORT || "3000");
const HOST = process.env.HOST || "0.0.0.0";

serve({ fetch: app.fetch, port: PORT, hostname: HOST }, () => { 
  console.log(`\n[SERVER] ✓ ShadowLlama running on http://${HOST}:${PORT}`);
  console.log(`[AGENT] ✓ Manifest: http://${HOST}:${PORT}/.well-known/agent.json`);
  console.log(`\n${getRandomPhrase()}\n`);
  console.log("[SYSTEM] All 10 endpoints configured with x402 payments 🌐🔒💰\n");
});

process.on("SIGTERM", () => { db.close(); process.exit(0); });
process.on("SIGINT", () => { db.close(); process.exit(0); });

export default app;
