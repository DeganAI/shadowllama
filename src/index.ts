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
// X402 MIDDLEWARE - Add proper 402 responses
// ============================================================================

app.use("*", async (c: any, next: any) => {
  await next();
  
  // Add x402 metadata to HTML pages
  if (c.res.headers.get("content-type")?.includes("text/html")) {
    const originalBody = await c.res.text();
    
    const metadata = `
    <meta property="og:title" content="ShadowLlama - Decentralized Dark Web Proxy">
    <meta property="og:description" content="🌐 Pay-per-second anonymous proxy network with encrypted dead drops, hacking bounties, and AI deck assistants. Tor/I2P hybrid with x402 micropayments.">
    <meta property="og:image" content="https://shadowllama-production.up.railway.app/og-image.png">
    <meta name="description" content="Decentralized dark web proxy + AI-powered underground marketplace with x402 micropayments">
    `;
    
    const modifiedBody = originalBody.replace("</head>", `${metadata}</head>`);
    c.res = new Response(modifiedBody, {
      status: c.res.status,
      headers: c.res.headers,
    });
  }
});

// ============================================================================
// OG IMAGE ENDPOINT
// ============================================================================

app.get("/og-image.png", (c: any) => {
  // Return a simple SVG as PNG alternative
  const svg = `
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
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
    </svg>
  `;
  
  c.header("Content-Type", "image/svg+xml");
  return c.body(svg);
});

// ============================================================================
// ENTRYPOINT 1: Start Proxy Stream
// ============================================================================

addEntrypoint({
  key: "start-proxy-stream",
  description:
    "🔒 Start an anonymous proxy streaming session through Tor/I2P nodes. " +
    "Pay per second for encrypted, routed traffic. No logs, maximum privacy.",
  async handler(ctx: any) {
    const input = ctx.input || {};
    const targetUrl = input.targetUrl || "https://example.com";
    const network = input.network || "tor";
    const duration = input.duration || 60;
    const minNodeReputation = input.minNodeReputation || 0.7;

    const nodes = db.getProxyNodes(minNodeReputation).filter((n: any) => n.network === network);

    if (nodes.length === 0) {
      throw new Error(`No ${network} nodes available with reputation >= ${minNodeReputation}`);
    }

    const selectedNode = nodes[0];
    const estimatedCost = (config.pricing.perSecond * duration) / 1_000_000;

    const sessionId = db.createSession({
      nodeId: selectedNode.id,
      bytesTransferred: 0,
      cost: estimatedCost,
      userId: "user-" + Date.now(),
    });

    const expiresAt = new Date(Date.now() + duration * 1000).toISOString();

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
        expiresAt,
        message: `🔒 Proxy stream established. ${getRandomPhrase()}`,
      },
    };
  },
});

// ============================================================================
// ENTRYPOINT 2: Create Dead Drop
// ============================================================================

addEntrypoint({
  key: "create-dead-drop",
  description:
    "📦 Create an encrypted dead drop - upload encrypted data that others can purchase and download.",
  async handler(ctx: any) {
    const input = ctx.input || {};
    const encryptedData = input.encryptedData || "";
    const price = input.price || 0.05;
    const expiresInHours = input.expiresInHours || 168;
    const maxDownloads = input.maxDownloads || 100;
    const mimeType = input.mimeType || "application/octet-stream";
    const description = input.description;
    const tags = input.tags || [];

    const expiresAt = new Date(Date.now() + expiresInHours * 3600 * 1000);

    const dropId = db.createDeadDrop({
      encryptedData,
      price,
      creator: "anon-" + Date.now(),
      expiresAt,
      maxDownloads,
      metadata: {
        size: encryptedData.length,
        mimeType,
        description,
        tags,
      },
    });

    console.log(`[DEAD DROP] ${getRandomPhrase()}`);

    return {
      output: {
        dropId,
        price: `$${price} USDC`,
        expiresAt: expiresAt.toISOString(),
        accessUrl: `https://shadowllama.network/drop/${dropId}`,
        message: `📦 Dead drop created. ${getRandomPhrase()}`,
      },
    };
  },
});

// ============================================================================
// ENTRYPOINT 3: Purchase Dead Drop
// ============================================================================

addEntrypoint({
  key: "purchase-dead-drop",
  description: "💰 Purchase and download an encrypted dead drop. Payment verified via x402.",
  async handler(ctx: any) {
    const input = ctx.input || {};
    const dropId = input.dropId;

    const drop = db.getDeadDrop(dropId);

    if (!drop) {
      throw new Error("Dead drop not found");
    }

    if (drop.expiresAt < new Date()) {
      throw new Error("Dead drop has expired");
    }

    if (drop.downloads >= drop.maxDownloads) {
      throw new Error("Dead drop has reached maximum downloads");
    }

    db.incrementDeadDropDownload(dropId);

    console.log(`[DEAD DROP] ${getRandomPhrase()}`);

    return {
      output: {
        dropId: drop.id,
        encryptedData: drop.encryptedData,
        mimeType: drop.metadata.mimeType,
        size: drop.metadata.size,
        downloads: drop.downloads + 1,
        message: `✓ Dead drop unlocked. ${getRandomPhrase()}`,
      },
    };
  },
});

// ============================================================================
// ENTRYPOINT 4: List Dead Drops
// ============================================================================

addEntrypoint({
  key: "list-dead-drops",
  description: "📋 Browse available dead drops on the network.",
  async handler(ctx: any) {
    const input = ctx.input || {};
    const limit = input.limit || 20;

    const drops = db.listDeadDrops(limit);

    return {
      output: {
        drops: drops.map((drop: any) => ({
          dropId: drop.id,
          price: `$${drop.price} USDC`,
          size: drop.metadata.size,
          mimeType: drop.metadata.mimeType,
          description: drop.metadata.description,
          tags: drop.metadata.tags || [],
          downloads: drop.downloads,
          maxDownloads: drop.maxDownloads,
          expiresAt: drop.expiresAt.toISOString(),
        })),
        total: drops.length,
        message: `📋 Found ${drops.length} active dead drops`,
      },
    };
  },
});

// ============================================================================
// ENTRYPOINT 5: Post Bounty
// ============================================================================

addEntrypoint({
  key: "post-bounty",
  description: "🎯 Post a hacking bounty or challenge. First valid submission wins.",
  async handler(ctx: any) {
    const input = ctx.input || {};
    const title = input.title || "Untitled Bounty";
    const description = input.description || "";
    const reward = input.reward || 100;
    const expiresInHours = input.expiresInHours || 168;
    const proofRequired = input.proofRequired || "Proof of completion";

    const expiresAt = new Date(Date.now() + expiresInHours * 3600 * 1000);

    const bountyId = db.createBounty({
      title,
      description,
      reward,
      creator: "anon-" + Date.now(),
      expiresAt,
      proofRequired,
    });

    console.log(`[BOUNTY] ${getRandomPhrase()}`);

    return {
      output: {
        bountyId,
        title,
        reward: `$${reward} USDC`,
        expiresAt: expiresAt.toISOString(),
        bountyUrl: `https://shadowllama.network/bounty/${bountyId}`,
        message: `🎯 Bounty posted. ${getRandomPhrase()}`,
      },
    };
  },
});

// ============================================================================
// ENTRYPOINT 6: Submit Bounty Proof
// ============================================================================

addEntrypoint({
  key: "submit-bounty-proof",
  description: "📸 Submit proof for a bounty.",
  async handler(ctx: any) {
    const input = ctx.input || {};
    const bountyId = input.bountyId;
    const proof = input.proof || "";
    const submitterAddress = input.submitterAddress;

    const bounty = db.getBounty(bountyId);

    if (!bounty) {
      throw new Error("Bounty not found");
    }

    if (bounty.status !== "open") {
      throw new Error(`Bounty is ${bounty.status}`);
    }

    if (bounty.expiresAt < new Date()) {
      throw new Error("Bounty has expired");
    }

    const submissionId = db.submitBounty({
      bountyId,
      submitter: submitterAddress,
      proof,
    });

    console.log(`[BOUNTY] ${getRandomPhrase()}`);

    return {
      output: {
        submissionId,
        bountyId,
        status: "pending",
        message: `📸 Proof submitted. ${getRandomPhrase()}`,
      },
    };
  },
});

// ============================================================================
// ENTRYPOINT 7: List Bounties
// ============================================================================

addEntrypoint({
  key: "list-bounties",
  description: "🎯 Browse active bounties and hacking challenges.",
  async handler(ctx: any) {
    const input = ctx.input || {};
    const status = input.status;

    const bounties = db.listBounties(status);

    return {
      output: {
        bounties: bounties.map((bounty: any) => ({
          bountyId: bounty.id,
          title: bounty.title,
          description: bounty.description,
          reward: `$${bounty.reward} USDC`,
          status: bounty.status,
          submissions: bounty.submissions.length,
          expiresAt: bounty.expiresAt.toISOString(),
        })),
        total: bounties.length,
        message: `🎯 Found ${bounties.length} bounties`,
      },
    };
  },
});

// ============================================================================
// ENTRYPOINT 8: AI Deck Query
// ============================================================================

addEntrypoint({
  key: "ai-deck-query",
  description: "🤖 Consult your AI deck assistant.",
  async handler(ctx: any) {
    const input = ctx.input || {};
    const query = input.query || "";
    const model = input.model || "claude";
    const maxTokens = input.maxTokens || 1000;

    const tokensUsed = Math.floor(Math.random() * maxTokens * 0.7 + maxTokens * 0.3);
    const cost = (config.pricing.aiQuery * tokensUsed) / 1_000_000;

    const mockResponses: any = {
      claude: `[CLAUDE DECK]: Analysis complete, chummer. ${query.slice(0, 50)}...`,
      gpt4: `[GPT-4 DECK]: Processing neural pathways...`,
      gemini: `[GEMINI DECK]: Quantum processing engaged...`,
    };

    const response = mockResponses[model] || mockResponses.claude;

    const queryId = db.saveAIQuery({
      query,
      model,
      maxTokens,
      userId: "user-" + Date.now(),
      cost,
      response,
    });

    console.log(`[AI DECK] ${getRandomPhrase()}`);

    return {
      output: {
        queryId,
        model: model.toUpperCase(),
        response,
        tokensUsed,
        cost: `$${cost.toFixed(6)} USDC`,
        message: `🤖 AI oracle consulted. ${getRandomPhrase()}`,
      },
    };
  },
});

// ============================================================================
// ENTRYPOINT 9: Node Status
// ============================================================================

addEntrypoint({
  key: "node-status",
  description: "📊 Check the status and reputation of proxy nodes.",
  async handler(ctx: any) {
    const input = ctx.input || {};
    const network = input.network;
    const minReputation = input.minReputation || 0.5;

    let nodes = db.getProxyNodes(minReputation);

    if (network) {
      nodes = nodes.filter((n: any) => n.network === network);
    }

    const avgReputation = nodes.reduce((sum: number, n: any) => sum + n.reputation, 0) / (nodes.length || 1);

    return {
      output: {
        nodes: nodes.map((node: any) => ({
          nodeId: node.id,
          network: node.network,
          reputation: Math.round(node.reputation * 100) / 100,
          totalSessions: node.totalSessions,
          totalBytes: `${(node.totalBytes / 1024 / 1024).toFixed(2)} MB`,
          earnings: `$${node.earnings.toFixed(4)} USDC`,
          region: node.region,
        })),
        total: nodes.length,
        averageReputation: Math.round(avgReputation * 100) / 100,
        message: `📊 Network status: ${nodes.length} active nodes`,
      },
    };
  },
});

// ============================================================================
// ENTRYPOINT 10: System Info
// ============================================================================

addEntrypoint({
  key: "system-info",
  description: "ℹ️ Get information about the ShadowLlama network.",
  async handler() {
    return {
      output: {
        name: "ShadowLlama",
        version: "1.0.0",
        network: config.payments.network,
        nodeMode: config.node.mode,
        pricing: {
          perMB: `$${(config.pricing.perMB / 1_000_000).toFixed(4)} USDC`,
          perSecond: `$${(config.pricing.perSecond / 1_000_000).toFixed(4)} USDC`,
          deadDrop: `$${(config.pricing.deadDrop / 1_000_000).toFixed(2)} USDC`,
          aiQuery: `$${(config.pricing.aiQuery / 1_000_000).toFixed(2)} USDC`,
          bountyPost: `$${(config.pricing.bountyPost / 1_000_000).toFixed(2)} USDC`,
        },
        capabilities: [
          "Anonymous proxy streaming (Tor/I2P)",
          "Encrypted dead drops",
          "Hacking bounties",
          "AI deck assistants",
          "Pay-per-second micropayments",
          "Zero-log architecture",
        ],
        message: `🌐 Welcome to the Sprawl. ${getRandomPhrase()}`,
      },
    };
  },
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function seedDemoNodes() {
  const demoNodes: Omit<ProxyNode, "lastSeen">[] = [
    {
      id: "tor-exit-nl-001",
      address: "tor://nlexitnode001.onion",
      network: "tor",
      reputation: 0.95,
      totalBytes: 15_000_000_000,
      totalSessions: 1250,
      earnings: 125.5,
      region: "Netherlands",
      capabilities: ["streaming", "high-bandwidth"],
    },
    {
      id: "tor-exit-de-042",
      address: "tor://deexitnode042.onion",
      network: "tor",
      reputation: 0.88,
      totalBytes: 8_500_000_000,
      totalSessions: 820,
      earnings: 89.3,
      region: "Germany",
      capabilities: ["streaming"],
    },
    {
      id: "i2p-relay-jp-007",
      address: "i2p://jprelay007.i2p",
      network: "i2p",
      reputation: 0.92,
      totalBytes: 12_000_000_000,
      totalSessions: 950,
      earnings: 105.8,
      region: "Japan",
      capabilities: ["streaming", "p2p"],
    },
    {
      id: "tor-guard-us-123",
      address: "tor://usguardnode123.onion",
      network: "tor",
      reputation: 0.78,
      totalBytes: 5_200_000_000,
      totalSessions: 450,
      earnings: 52.1,
      region: "United States",
      capabilities: ["guard"],
    },
  ];

  try {
    demoNodes.forEach((node) => {
      const existing = db.getProxyNodes(0).find((n) => n.id === node.id);
      if (!existing) {
        db.addProxyNode(node);
      }
    });
    console.log(`[DB] ✓ Seeded ${demoNodes.length} demo proxy nodes`);
  } catch (err) {
    console.log("[DB] Demo nodes already seeded");
  }
}

// ============================================================================
// START SERVER
// ============================================================================

const PORT = parseInt(process.env.PORT || "3000");
const HOST = process.env.HOST || "0.0.0.0";

serve(
  {
    fetch: app.fetch,
    port: PORT,
    hostname: HOST,
  },
  (info) => {
    console.log(`\n[SERVER] ✓ ShadowLlama running on http://${HOST}:${PORT}`);
    console.log(`[AGENT] ✓ Manifest: http://${HOST}:${PORT}/.well-known/agent.json`);
    console.log(`[AGENT] ✓ Entrypoints: http://${HOST}:${PORT}/entrypoints`);
    console.log(`\n${getRandomPhrase()}\n`);
    console.log("[SYSTEM] Ready to jack into the matrix... 🌐🔒💰\n");
  }
);

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("\n[SYSTEM] Received SIGTERM, shutting down gracefully...");
  db.close();
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("\n[SYSTEM] Received SIGINT, shutting down gracefully...");
  db.close();
  process.exit(0);
});

export default app;
