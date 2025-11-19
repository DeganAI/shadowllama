// src/index.ts
// ShadowLlama Main Application - Cyberpunk Dark Web Proxy

import { createAgentApp } from "@lucid-dreams/agent-kit";
import { config, BANNER, getRandomPhrase } from "./config/index.js";
import { ShadowLlamaDB } from "./db/index.js";
import { serve } from "@hono/node-server";
import type { ProxyNode } from "./types/index.js";

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
// X402 PAYMENT MIDDLEWARE
// ============================================================================

const requirePayment = (options: { amount: number; description: string }) => {
  return async (c: any, next: any) => {
    const paymentProof = c.req.header("x-payment-proof");
    
    if (!paymentProof) {
      // Return 402 with proper x402 schema
      return c.json(
        {
          x402Version: 1,
          accepts: [
            {
              scheme: "exact",
              network: "base",
              maxAmountRequired: options.amount.toString(),
              resource: c.req.path,
              description: options.description,
              mimeType: "application/json",
              payTo: config.payments.baseAddress,
              maxTimeoutSeconds: 300,
              asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
              outputSchema: {
                input: {
                  type: "http",
                  method: "POST",
                  bodyType: "json",
                  bodyFields: {
                    input: {
                      type: "object",
                      required: false,
                      description: "Input parameters for the endpoint",
                    },
                  },
                },
                output: {
                  output: {
                    type: "object",
                    description: "Response data from the endpoint",
                  },
                },
              },
            },
          ],
        },
        402
      );
    }
    
    // Payment proof provided, continue
    await next();
  };
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
    body { 
      font-family: monospace; 
      background: #0a0a0a; 
      color: #00ff00; 
      padding: 40px;
      max-width: 1200px;
      margin: 0 auto;
    }
    h1 { 
      color: #00ff00; 
      text-shadow: 0 0 20px #00ff00;
      font-size: 3em;
      margin-bottom: 20px;
    }
    .endpoints {
      margin: 30px 0;
    }
    .endpoint {
      background: rgba(0, 255, 0, 0.1);
      border-left: 4px solid #00ff00;
      padding: 15px;
      margin: 10px 0;
    }
    .endpoint:hover {
      background: rgba(0, 255, 0, 0.2);
    }
    pre {
      color: #00cc00;
      font-size: 0.8em;
      line-height: 1.2;
    }
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
  
  <div class="endpoints">
    <h2>Available Endpoints:</h2>
    <div class="endpoint">🔒 POST /entrypoints/start-proxy-stream - Anonymous routing</div>
    <div class="endpoint">📦 POST /entrypoints/create-dead-drop - Upload encrypted files</div>
    <div class="endpoint">💰 POST /entrypoints/purchase-dead-drop - Buy encrypted data</div>
    <div class="endpoint">📋 POST /entrypoints/list-dead-drops - Browse marketplace</div>
    <div class="endpoint">🎯 POST /entrypoints/post-bounty - Create hacking challenges</div>
    <div class="endpoint">📸 POST /entrypoints/submit-bounty-proof - Submit proof</div>
    <div class="endpoint">🎯 POST /entrypoints/list-bounties - Browse bounties</div>
    <div class="endpoint">🤖 POST /entrypoints/ai-deck-query - Consult AI assistants</div>
    <div class="endpoint">📊 POST /entrypoints/node-status - Check proxy nodes</div>
    <div class="endpoint">ℹ️ POST /entrypoints/system-info - Get system info</div>
  </div>
  
  <p style="margin-top: 40px; color: #888;">
    💰 Payment: Base USDC via x402 protocol<br>
    🔒 Privacy: Zero-log architecture<br>
    🌐 Networks: Tor, I2P, Clearnet
  </p>
</body>
</html>`;
  
  c.header("Content-Type", "text/html");
  return c.body(html);
});

// ============================================================================
// ENTRYPOINT 1: Start Proxy Stream (With x402)
// ============================================================================

app.get("/entrypoints/start-proxy-stream", (c: any) => {
  return c.json(
    {
      x402Version: 1,
      accepts: [
        {
          scheme: "exact",
          network: "base",
          maxAmountRequired: config.pricing.perSecond.toString(),
          resource: "/entrypoints/start-proxy-stream",
          description: "🔒 Start anonymous proxy streaming session through Tor/I2P nodes",
          mimeType: "application/json",
          payTo: config.payments.baseAddress,
          maxTimeoutSeconds: 300,
          asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
          outputSchema: {
            input: {
              type: "http",
              method: "POST",
              bodyType: "json",
              bodyFields: {
                targetUrl: { type: "string", required: false, description: "Target URL to access" },
                network: { type: "string", required: false, description: "Network type (tor/i2p/clearnet)" },
                duration: { type: "number", required: false, description: "Session duration in seconds" },
                minNodeReputation: { type: "number", required: false, description: "Minimum node reputation (0-1)" },
              },
            },
            output: {
              sessionId: { type: "string" },
              selectedNode: { type: "object" },
              estimatedCost: { type: "string" },
              streamUrl: { type: "string" },
              expiresAt: { type: "string" },
              message: { type: "string" },
            },
          },
        },
      ],
    },
    402
  );
});

addEntrypoint({
  key: "start-proxy-stream",
  description: "🔒 Start an anonymous proxy streaming session through Tor/I2P nodes",
  async handler(ctx: any) {
    const input = ctx.input || {};
    const targetUrl = input.targetUrl || "https://example.com";
    const network = input.network || "tor";
    const duration = input.duration || 60;
    const minNodeReputation = input.minNodeReputation || 0.7;

    const nodes = db.getProxyNodes(minNodeReputation).filter((n: any) => n.network === network);

    if (nodes.length === 0) {
      throw new Error(`No ${network} nodes available`);
    }

    const selectedNode = nodes[0];
    const estimatedCost = (config.pricing.perSecond * duration) / 1_000_000;

    const sessionId = db.createSession({
      nodeId: selectedNode.id,
      bytesTransferred: 0,
      cost: estimatedCost,
      userId: "user-" + Date.now(),
    });

    console.log(`[PROXY] ${getRandomPhrase()}`);

    return {
      output: {
        sessionId,
        selectedNode: {
          id: selectedNode.id,
          network: selectedNode.network,
          reputation: selectedNode.reputation,
          region: selectedNode.region,
        },
        estimatedCost: `$${estimatedCost.toFixed(6)} USDC`,
        streamUrl: `wss://shadowllama.stream/${sessionId}`,
        expiresAt: new Date(Date.now() + duration * 1000).toISOString(),
        message: `🔒 Proxy stream established. ${getRandomPhrase()}`,
      },
    };
  },
});

// ============================================================================
// Add GET handlers for all other entrypoints (returning 402)
// ============================================================================

app.get("/entrypoints/create-dead-drop", (c: any) => {
  return c.json({
    x402Version: 1,
    accepts: [{
      scheme: "exact",
      network: "base",
      maxAmountRequired: config.pricing.deadDrop.toString(),
      resource: "/entrypoints/create-dead-drop",
      description: "📦 Create encrypted dead drop",
      mimeType: "application/json",
      payTo: config.payments.baseAddress,
      maxTimeoutSeconds: 300,
      asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    }],
  }, 402);
});

app.get("/entrypoints/purchase-dead-drop", (c: any) => {
  return c.json({
    x402Version: 1,
    accepts: [{
      scheme: "exact",
      network: "base",
      maxAmountRequired: config.pricing.deadDrop.toString(),
      resource: "/entrypoints/purchase-dead-drop",
      description: "💰 Purchase encrypted dead drop",
      mimeType: "application/json",
      payTo: config.payments.baseAddress,
      maxTimeoutSeconds: 300,
      asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    }],
  }, 402);
});

app.get("/entrypoints/post-bounty", (c: any) => {
  return c.json({
    x402Version: 1,
    accepts: [{
      scheme: "exact",
      network: "base",
      maxAmountRequired: config.pricing.bountyPost.toString(),
      resource: "/entrypoints/post-bounty",
      description: "🎯 Post hacking bounty",
      mimeType: "application/json",
      payTo: config.payments.baseAddress,
      maxTimeoutSeconds: 300,
      asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    }],
  }, 402);
});

app.get("/entrypoints/ai-deck-query", (c: any) => {
  return c.json({
    x402Version: 1,
    accepts: [{
      scheme: "exact",
      network: "base",
      maxAmountRequired: config.pricing.aiQuery.toString(),
      resource: "/entrypoints/ai-deck-query",
      description: "🤖 Consult AI deck assistant",
      mimeType: "application/json",
      payTo: config.payments.baseAddress,
      maxTimeoutSeconds: 300,
      asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    }],
  }, 402);
});

// Continue with all other entrypoints as before (list-dead-drops, submit-bounty-proof, list-bounties, node-status)
addEntrypoint({ key: "create-dead-drop", description: "📦 Create encrypted dead drop", async handler(ctx: any) {
  const input = ctx.input || {};
  const encryptedData = input.encryptedData || "";
  const price = input.price || 0.05;
  const expiresInHours = input.expiresInHours || 168;
  const maxDownloads = input.maxDownloads || 100;
  const dropId = db.createDeadDrop({
    encryptedData, price, creator: "anon-" + Date.now(),
    expiresAt: new Date(Date.now() + expiresInHours * 3600 * 1000),
    maxDownloads, metadata: { size: encryptedData.length, mimeType: input.mimeType || "application/octet-stream", description: input.description, tags: input.tags || [] }
  });
  console.log(`[DEAD DROP] ${getRandomPhrase()}`);
  return { output: { dropId, price: `$${price} USDC`, expiresAt: new Date(Date.now() + expiresInHours * 3600 * 1000).toISOString(), accessUrl: `https://shadowllama.network/drop/${dropId}`, message: `📦 Dead drop created. ${getRandomPhrase()}` }};
}});

addEntrypoint({ key: "purchase-dead-drop", description: "💰 Purchase encrypted dead drop", async handler(ctx: any) {
  const drop = db.getDeadDrop(ctx.input?.dropId);
  if (!drop) throw new Error("Dead drop not found");
  db.incrementDeadDropDownload(drop.id);
  return { output: { dropId: drop.id, encryptedData: drop.encryptedData, mimeType: drop.metadata.mimeType, size: drop.metadata.size, downloads: drop.downloads + 1, message: `✓ Dead drop unlocked. ${getRandomPhrase()}` }};
}});

addEntrypoint({ key: "list-dead-drops", description: "📋 Browse dead drops", async handler(ctx: any) {
  const drops = db.listDeadDrops(ctx.input?.limit || 20);
  return { output: { drops: drops.map((d: any) => ({ dropId: d.id, price: `$${d.price} USDC`, size: d.metadata.size, downloads: d.downloads, maxDownloads: d.maxDownloads, expiresAt: d.expiresAt.toISOString() })), total: drops.length, message: `📋 Found ${drops.length} drops` }};
}});

addEntrypoint({ key: "post-bounty", description: "🎯 Post hacking bounty", async handler(ctx: any) {
  const input = ctx.input || {};
  const bountyId = db.createBounty({ title: input.title || "Bounty", description: input.description || "", reward: input.reward || 100, creator: "anon-" + Date.now(), expiresAt: new Date(Date.now() + (input.expiresInHours || 168) * 3600 * 1000), proofRequired: input.proofRequired || "Proof" });
  return { output: { bountyId, title: input.title, reward: `$${input.reward || 100} USDC`, message: `🎯 Bounty posted. ${getRandomPhrase()}` }};
}});

addEntrypoint({ key: "submit-bounty-proof", description: "📸 Submit bounty proof", async handler(ctx: any) {
  const submissionId = db.submitBounty({ bountyId: ctx.input?.bountyId, submitter: ctx.input?.submitterAddress, proof: ctx.input?.proof || "" });
  return { output: { submissionId, bountyId: ctx.input?.bountyId, status: "pending", message: `📸 Proof submitted. ${getRandomPhrase()}` }};
}});

addEntrypoint({ key: "list-bounties", description: "🎯 Browse bounties", async handler(ctx: any) {
  const bounties = db.listBounties(ctx.input?.status);
  return { output: { bounties: bounties.map((b: any) => ({ bountyId: b.id, title: b.title, reward: `$${b.reward} USDC`, status: b.status, submissions: b.submissions.length })), total: bounties.length }};
}});

addEntrypoint({ key: "ai-deck-query", description: "🤖 AI assistant", async handler(ctx: any) {
  const input = ctx.input || {};
  const queryId = db.saveAIQuery({ query: input.query || "", model: input.model || "claude", maxTokens: input.maxTokens || 1000, userId: "user-" + Date.now(), cost: 0.025, response: "[AI]: Response..." });
  return { output: { queryId, model: (input.model || "claude").toUpperCase(), response: "[AI]: Response...", tokensUsed: 500, cost: "$0.025000 USDC", message: `🤖 AI consulted. ${getRandomPhrase()}` }};
}});

addEntrypoint({ key: "node-status", description: "📊 Check nodes", async handler(ctx: any) {
  let nodes = db.getProxyNodes(ctx.input?.minReputation || 0.5);
  if (ctx.input?.network) nodes = nodes.filter((n: any) => n.network === ctx.input.network);
  return { output: { nodes: nodes.map((n: any) => ({ nodeId: n.id, network: n.network, reputation: n.reputation, totalSessions: n.totalSessions })), total: nodes.length, message: `📊 ${nodes.length} nodes active` }};
}});

addEntrypoint({ key: "system-info", description: "ℹ️ System info", async handler() {
  return { output: { name: "ShadowLlama", version: "1.0.0", network: config.payments.network, capabilities: ["Tor/I2P routing", "Dead drops", "Bounties", "AI assistants"], message: `🌐 Welcome to the Sprawl. ${getRandomPhrase()}` }};
}});

// Helper
function seedDemoNodes() {
  const demoNodes: Omit<ProxyNode, "lastSeen">[] = [
    { id: "tor-exit-nl-001", address: "tor://nlexitnode001.onion", network: "tor", reputation: 0.95, totalBytes: 15_000_000_000, totalSessions: 1250, earnings: 125.5, region: "Netherlands", capabilities: ["streaming"] },
    { id: "i2p-relay-jp-007", address: "i2p://jprelay007.i2p", network: "i2p", reputation: 0.92, totalBytes: 12_000_000_000, totalSessions: 950, earnings: 105.8, region: "Japan", capabilities: ["streaming"] },
  ];
  try {
    demoNodes.forEach((node) => {
      const existing = db.getProxyNodes(0).find((n) => n.id === node.id);
      if (!existing) db.addProxyNode(node);
    });
    console.log(`[DB] ✓ Seeded ${demoNodes.length} nodes`);
  } catch {}
}

// Server
const PORT = parseInt(process.env.PORT || "3000");
const HOST = process.env.HOST || "0.0.0.0";

serve({ fetch: app.fetch, port: PORT, hostname: HOST }, () => {
  console.log(`\n[SERVER] ✓ ShadowLlama running on http://${HOST}:${PORT}`);
  console.log(`[AGENT] ✓ Manifest: http://${HOST}:${PORT}/.well-known/agent.json`);
  console.log(`\n${getRandomPhrase()}\n`);
});

process.on("SIGTERM", () => { db.close(); process.exit(0); });
process.on("SIGINT", () => { db.close(); process.exit(0); });

export default app;
