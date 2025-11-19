// src/index.ts
// ShadowLlama Main Application - Cyberpunk Dark Web Proxy

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
  bountyPost: 0.25,
  aiQuery: 0.10,
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
  <div class="endpoint">🔒 Proxy: <span class="price">$${PRICING.proxyStream}</span></div>
  <div class="endpoint">📦 Create Drop: <span class="price">$${PRICING.deadDropCreate}</span></div>
  <div class="endpoint">💰 Purchase Drop: <span class="price">$${PRICING.deadDropPurchase}</span></div>
  <div class="endpoint">🎯 Post Bounty: <span class="price">$${PRICING.bountyPost}</span></div>
  <div class="endpoint">🤖 AI Query: <span class="price">$${PRICING.aiQuery}</span></div>
</body>
</html>`;
  c.header("Content-Type", "text/html");
  return c.body(html);
});

// ============================================================================
// X402 HANDLERS - Apply middleware to BOTH GET and POST
// ============================================================================

const proxyMiddleware = requirePayment({ amount: PRICING.proxyStream, description: "🔒 Start anonymous proxy streaming session" });
const deadDropCreateMiddleware = requirePayment({ amount: PRICING.deadDropCreate, description: "📦 Create encrypted dead drop" });
const deadDropPurchaseMiddleware = requirePayment({ amount: PRICING.deadDropPurchase, description: "💰 Purchase encrypted dead drop" });
const bountyMiddleware = requirePayment({ amount: PRICING.bountyPost, description: "🎯 Post hacking bounty" });
const aiMiddleware = requirePayment({ amount: PRICING.aiQuery, description: "🤖 Consult AI deck assistant" });

// Apply middleware to GET requests
app.get("/entrypoints/start-proxy-stream/invoke", proxyMiddleware);
app.get("/entrypoints/create-dead-drop/invoke", deadDropCreateMiddleware);
app.get("/entrypoints/purchase-dead-drop/invoke", deadDropPurchaseMiddleware);
app.get("/entrypoints/post-bounty/invoke", bountyMiddleware);
app.get("/entrypoints/ai-deck-query/invoke", aiMiddleware);

// Apply middleware to POST requests (BEFORE they reach the handler)
app.post("/entrypoints/start-proxy-stream/invoke", proxyMiddleware);
app.post("/entrypoints/create-dead-drop/invoke", deadDropCreateMiddleware);
app.post("/entrypoints/purchase-dead-drop/invoke", deadDropPurchaseMiddleware);
app.post("/entrypoints/post-bounty/invoke", bountyMiddleware);
app.post("/entrypoints/ai-deck-query/invoke", aiMiddleware);

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
  description: "📋 Browse drops (FREE)",
  async handler(ctx: any) {
    const drops = db.listDeadDrops(20);
    return { output: { drops: drops.map((d: any) => ({ dropId: d.id, price: `$${d.price}` })), total: drops.length }};
  },
});

addEntrypoint({
  key: "post-bounty",
  description: `🎯 Post bounty ($${PRICING.bountyPost})`,
  async handler(ctx: any) {
    const input = ctx.input || {};
    const bountyId = db.createBounty({ title: input.title || "Bounty", description: input.description || "", reward: 100, creator: "anon-" + Date.now(), expiresAt: new Date(Date.now() + 168 * 3600 * 1000), proofRequired: "Proof" });
    return { output: { bountyId, reward: "$100", message: `🎯 ${getRandomPhrase()}` }};
  },
});

addEntrypoint({ key: "submit-bounty-proof", description: "📸 Submit proof (FREE)", async handler(ctx: any) {
  const submissionId = db.submitBounty({ bountyId: ctx.input?.bountyId, submitter: ctx.input?.submitterAddress, proof: "" });
  return { output: { submissionId, status: "pending" }};
}});

addEntrypoint({ key: "list-bounties", description: "🎯 Browse (FREE)", async handler() {
  const bounties = db.listBounties();
  return { output: { bounties: bounties.map((b: any) => ({ bountyId: b.id, title: b.title, reward: `$${b.reward}` })), total: bounties.length }};
}});

addEntrypoint({
  key: "ai-deck-query",
  description: `🤖 AI query ($${PRICING.aiQuery})`,
  async handler(ctx: any) {
    const input = ctx.input || {};
    const queryId = db.saveAIQuery({ query: input.query || "", model: "claude", maxTokens: 1000, userId: "user-" + Date.now(), cost: PRICING.aiQuery, response: "[AI]: Response..." });
    return { output: { queryId, model: "CLAUDE", response: "[AI]: Response...", cost: `$${PRICING.aiQuery}`, message: `🤖 ${getRandomPhrase()}` }};
  },
});

addEntrypoint({ key: "node-status", description: "📊 Nodes (FREE)", async handler() {
  const nodes = db.getProxyNodes(0.5);
  return { output: { nodes: nodes.map((n: any) => ({ nodeId: n.id, network: n.network, reputation: n.reputation })), total: nodes.length }};
}});

addEntrypoint({ key: "system-info", description: "ℹ️ Info (FREE)", async handler() {
  return { output: { name: "ShadowLlama", version: "1.0.0", pricing: PRICING, message: `🌐 ${getRandomPhrase()}` }};
}});

// Helper
function seedDemoNodes() {
  const demoNodes: Omit<ProxyNode, "lastSeen">[] = [
    { id: "tor-exit-nl-001", address: "tor://nlexitnode001.onion", network: "tor", reputation: 0.95, totalBytes: 15_000_000_000, totalSessions: 1250, earnings: 125.5, region: "Netherlands", capabilities: ["streaming"] },
    { id: "i2p-relay-jp-007", address: "i2p://jprelay007.i2p", network: "i2p", reputation: 0.92, totalBytes: 12_000_000_000, totalSessions: 950, earnings: 105.8, region: "Japan", capabilities: ["streaming"] },
  ];
  try { demoNodes.forEach((n) => { if (!db.getProxyNodes(0).find((e) => e.id === n.id)) db.addProxyNode(n); }); console.log(`[DB] ✓ Seeded nodes`); } catch {}
}

// Server
const PORT = parseInt(process.env.PORT || "3000");
const HOST = process.env.HOST || "0.0.0.0";
serve({ fetch: app.fetch, port: PORT, hostname: HOST }, () => { console.log(`\n[SERVER] ✓ ShadowLlama on http://${HOST}:${PORT}\n`); });
process.on("SIGTERM", () => { db.close(); process.exit(0); });
process.on("SIGINT", () => { db.close(); process.exit(0); });
export default app;
