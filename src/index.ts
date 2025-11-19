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
console.log(`[CRYPTO] Solana: ${config.payments.solanaAddress}`);
console.log(`[PRICING] Per MB: $${(config.pricing.perMB / 1_000_000).toFixed(4)} USDC`);
console.log(`[PRICING] Per Second: $${(config.pricing.perSecond / 1_000_000).toFixed(4)} USDC\n`);

// Seed some demo proxy nodes
seedDemoNodes();

// ============================================================================
// CREATE AGENT APP
// ============================================================================

const agentApp: any = createAgentApp({
  name: "shadowllama-agent",
  version: "1.0.0",
  description:
    "🌐 Decentralized pay-per-second dark web proxy + AI-powered underground marketplace. Tor/I2P hybrid with x402 micropayments.",
});

const app = agentApp.app;
const addEntrypoint = agentApp.addEntrypoint;

// ============================================================================
// PRICING (Fair Market Rates)
// ============================================================================

const PRICING = {
  proxyStream: 0.05,      // $0.05 per session
  deadDropCreate: 0.10,   // $0.10 to create
  deadDropPurchase: 0.15, // $0.15 to purchase
  bountyPost: 0.25,       // $0.25 to post bounty
  aiQuery: 0.10,          // $0.10 per AI query
};

// ============================================================================
// OG IMAGE AND METADATA
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
    <text x="600" y="350" font-family="monospace" font-size="24" fill="#888" text-anchor="middle">🔒 Tor/I2P Hybrid • 💰 x402 Micropayments</text>
    <text x="600" y="420" font-family="monospace" font-size="24" fill="#888" text-anchor="middle">📦 Dead Drops • 🎯 Bounties • 🤖 AI Assistants</text>
    <text x="600" y="520" font-family="monospace" font-size="20" fill="#666" text-anchor="middle">Pay-per-second anonymous routing</text>
  </svg>`;
  
  c.header("Content-Type", "image/svg+xml");
  return c.body(svg);
});

// Override root to add proper meta tags
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
    pre { color: #00cc00; font-size: 0.8em; }
    .price { color: #00ff00; font-weight: bold; }
  </style>
</head>
<body>
  <pre>
╔═══════════════════════════════════════════════════════════════════╗
║                   SHADOWLLAMA - Dark Web Proxy                    ║
║              Pay-Per-Second • Tor/I2P • x402 Payments            ║
╚═══════════════════════════════════════════════════════════════════╝
  </pre>
  
  <h1>🌐 ShadowLlama</h1>
  <p>Decentralized dark web proxy + AI-powered underground marketplace</p>
  
  <h2>💰 Pricing (Fair Market Rates)</h2>
  <div class="endpoint">🔒 Proxy Stream: <span class="price">$${PRICING.proxyStream} USDC</span></div>
  <div class="endpoint">📦 Create Dead Drop: <span class="price">$${PRICING.deadDropCreate} USDC</span></div>
  <div class="endpoint">💰 Purchase Dead Drop: <span class="price">$${PRICING.deadDropPurchase} USDC</span></div>
  <div class="endpoint">🎯 Post Bounty: <span class="price">$${PRICING.bountyPost} USDC</span></div>
  <div class="endpoint">🤖 AI Query: <span class="price">$${PRICING.aiQuery} USDC</span></div>
  <div class="endpoint">📋 List Items: <span class="price">FREE</span></div>
  <div class="endpoint">📊 Node Status: <span class="price">FREE</span></div>
  <div class="endpoint">ℹ️ System Info: <span class="price">FREE</span></div>
  
  <h2>Available Endpoints:</h2>
  <div class="endpoint">POST /entrypoints/start-proxy-stream/invoke</div>
  <div class="endpoint">POST /entrypoints/create-dead-drop/invoke</div>
  <div class="endpoint">POST /entrypoints/purchase-dead-drop/invoke</div>
  <div class="endpoint">POST /entrypoints/list-dead-drops/invoke</div>
  <div class="endpoint">POST /entrypoints/post-bounty/invoke</div>
  <div class="endpoint">POST /entrypoints/submit-bounty-proof/invoke</div>
  <div class="endpoint">POST /entrypoints/list-bounties/invoke</div>
  <div class="endpoint">POST /entrypoints/ai-deck-query/invoke</div>
  <div class="endpoint">POST /entrypoints/node-status/invoke</div>
  <div class="endpoint">POST /entrypoints/system-info/invoke</div>
</body>
</html>`;
  
  c.header("Content-Type", "text/html");
  return c.body(html);
});

// ============================================================================
// X402 GET HANDLERS (Return 402 with full schema)
// ============================================================================

app.get("/entrypoints/start-proxy-stream/invoke", requirePayment({ amount: PRICING.proxyStream, description: "🔒 Start anonymous proxy streaming session through Tor/I2P nodes" }));
app.get("/entrypoints/create-dead-drop/invoke", requirePayment({ amount: PRICING.deadDropCreate, description: "📦 Create encrypted dead drop" }));
app.get("/entrypoints/purchase-dead-drop/invoke", requirePayment({ amount: PRICING.deadDropPurchase, description: "💰 Purchase encrypted dead drop" }));
app.get("/entrypoints/post-bounty/invoke", requirePayment({ amount: PRICING.bountyPost, description: "🎯 Post hacking bounty" }));
app.get("/entrypoints/ai-deck-query/invoke", requirePayment({ amount: PRICING.aiQuery, description: "🤖 Consult AI deck assistant" }));

// ============================================================================
// ENTRYPOINTS (Keep existing but add pricing)
// ============================================================================

addEntrypoint({
  key: "start-proxy-stream",
  description: `🔒 Start anonymous proxy session ($${PRICING.proxyStream})`,
  async handler(ctx: any) {
    const input = ctx.input || {};
    const nodes = db.getProxyNodes(input.minNodeReputation || 0.7).filter((n: any) => n.network === (input.network || "tor"));
    if (nodes.length === 0) throw new Error("No nodes available");
    const selectedNode = nodes[0];
    const sessionId = db.createSession({ nodeId: selectedNode.id, bytesTransferred: 0, cost: PRICING.proxyStream, userId: "user-" + Date.now() });
    return { output: { sessionId, selectedNode: { id: selectedNode.id, network: selectedNode.network, reputation: selectedNode.reputation }, estimatedCost: `$${PRICING.proxyStream} USDC`, streamUrl: `wss://shadowllama.stream/${sessionId}`, message: `🔒 ${getRandomPhrase()}` }};
  },
});

addEntrypoint({ key: "create-dead-drop", description: `📦 Create dead drop ($${PRICING.deadDropCreate})`, async handler(ctx: any) {
  const input = ctx.input || {};
  const dropId = db.createDeadDrop({ encryptedData: input.encryptedData || "", price: input.price || 0.05, creator: "anon-" + Date.now(), expiresAt: new Date(Date.now() + (input.expiresInHours || 168) * 3600 * 1000), maxDownloads: input.maxDownloads || 100, metadata: { size: (input.encryptedData || "").length, mimeType: input.mimeType || "application/octet-stream", description: input.description, tags: input.tags || [] }});
  return { output: { dropId, price: `$${input.price || 0.05} USDC`, message: `📦 ${getRandomPhrase()}` }};
}});

addEntrypoint({ key: "purchase-dead-drop", description: `💰 Purchase dead drop ($${PRICING.deadDropPurchase})`, async handler(ctx: any) {
  const drop = db.getDeadDrop(ctx.input?.dropId);
  if (!drop) throw new Error("Dead drop not found");
  db.incrementDeadDropDownload(drop.id);
  return { output: { dropId: drop.id, encryptedData: drop.encryptedData, message: `✓ ${getRandomPhrase()}` }};
}});

addEntrypoint({ key: "list-dead-drops", description: "📋 Browse dead drops (FREE)", async handler(ctx: any) {
  const drops = db.listDeadDrops(ctx.input?.limit || 20);
  return { output: { drops: drops.map((d: any) => ({ dropId: d.id, price: `$${d.price} USDC`, downloads: d.downloads })), total: drops.length }};
}});

addEntrypoint({ key: "post-bounty", description: `🎯 Post bounty ($${PRICING.bountyPost})`, async handler(ctx: any) {
  const input = ctx.input || {};
  const bountyId = db.createBounty({ title: input.title || "Bounty", description: input.description || "", reward: input.reward || 100, creator: "anon-" + Date.now(), expiresAt: new Date(Date.now() + (input.expiresInHours || 168) * 3600 * 1000), proofRequired: input.proofRequired || "Proof" });
  return { output: { bountyId, reward: `$${input.reward || 100} USDC`, message: `🎯 ${getRandomPhrase()}` }};
}});

addEntrypoint({ key: "submit-bounty-proof", description: "📸 Submit proof (FREE)", async handler(ctx: any) {
  const submissionId = db.submitBounty({ bountyId: ctx.input?.bountyId, submitter: ctx.input?.submitterAddress, proof: ctx.input?.proof || "" });
  return { output: { submissionId, status: "pending", message: `📸 ${getRandomPhrase()}` }};
}});

addEntrypoint({ key: "list-bounties", description: "🎯 Browse bounties (FREE)", async handler(ctx: any) {
  const bounties = db.listBounties(ctx.input?.status);
  return { output: { bounties: bounties.map((b: any) => ({ bountyId: b.id, title: b.title, reward: `$${b.reward} USDC`, status: b.status })), total: bounties.length }};
}});

addEntrypoint({ key: "ai-deck-query", description: `🤖 AI query ($${PRICING.aiQuery})`, async handler(ctx: any) {
  const input = ctx.input || {};
  const queryId = db.saveAIQuery({ query: input.query || "", model: input.model || "claude", maxTokens: input.maxTokens || 1000, userId: "user-" + Date.now(), cost: PRICING.aiQuery, response: "[AI]: Response..." });
  return { output: { queryId, model: (input.model || "claude").toUpperCase(), response: "[AI]: Response...", cost: `$${PRICING.aiQuery} USDC`, message: `🤖 ${getRandomPhrase()}` }};
}});

addEntrypoint({ key: "node-status", description: "📊 Node status (FREE)", async handler(ctx: any) {
  let nodes = db.getProxyNodes(ctx.input?.minReputation || 0.5);
  if (ctx.input?.network) nodes = nodes.filter((n: any) => n.network === ctx.input.network);
  return { output: { nodes: nodes.map((n: any) => ({ nodeId: n.id, network: n.network, reputation: n.reputation })), total: nodes.length }};
}});

addEntrypoint({ key: "system-info", description: "ℹ️ System info (FREE)", async handler() {
  return { output: { name: "ShadowLlama", version: "1.0.0", pricing: { proxyStream: `$${PRICING.proxyStream}`, deadDropCreate: `$${PRICING.deadDropCreate}`, deadDropPurchase: `$${PRICING.deadDropPurchase}`, bountyPost: `$${PRICING.bountyPost}`, aiQuery: `$${PRICING.aiQuery}` }, message: `🌐 ${getRandomPhrase()}` }};
}});

// Helper
function seedDemoNodes() {
  const demoNodes: Omit<ProxyNode, "lastSeen">[] = [
    { id: "tor-exit-nl-001", address: "tor://nlexitnode001.onion", network: "tor", reputation: 0.95, totalBytes: 15_000_000_000, totalSessions: 1250, earnings: 125.5, region: "Netherlands", capabilities: ["streaming"] },
    { id: "i2p-relay-jp-007", address: "i2p://jprelay007.i2p", network: "i2p", reputation: 0.92, totalBytes: 12_000_000_000, totalSessions: 950, earnings: 105.8, region: "Japan", capabilities: ["streaming"] },
  ];
  try { demoNodes.forEach((node) => { const existing = db.getProxyNodes(0).find((n) => n.id === node.id); if (!existing) db.addProxyNode(node); }); console.log(`[DB] ✓ Seeded ${demoNodes.length} nodes`); } catch {}
}

// Server
const PORT = parseInt(process.env.PORT || "3000");
const HOST = process.env.HOST || "0.0.0.0";
serve({ fetch: app.fetch, port: PORT, hostname: HOST }, () => { console.log(`\n[SERVER] ✓ ShadowLlama on http://${HOST}:${PORT}\n${getRandomPhrase()}\n`); });
process.on("SIGTERM", () => { db.close(); process.exit(0); });
process.on("SIGINT", () => { db.close(); process.exit(0); });
export default app;
