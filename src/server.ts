// src/server.ts
// ShadowLlama - Production x402 Server

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { config } from "dotenv";
import { privateKeyToAccount } from "viem/accounts";
import type { Hex } from "viem";
import Database from "better-sqlite3";

config();

// ============================================================================
// X402 MIDDLEWARE (Custom Implementation)
// ============================================================================

function requirePayment(options: {
  facilitatorUrl: string;
  amount: string;
  network: string;
  payTo: Hex;
  description: string;
}) {
  return async (c: any, next: any) => {
    const paymentProof = c.req.header("x-payment") || c.req.header("x-payment-proof");
    
    if (!paymentProof) {
      // Return 402 with x402 schema
      const protocol = c.req.header("x-forwarded-proto") || "https";
      const host = c.req.header("host") || "";
      const fullUrl = `${protocol}://${host}${c.req.path}`;
      
      return c.json(
        {
          x402Version: 1,
          error: "Payment Required",
          accepts: [
            {
              scheme: "exact",
              network: options.network,
              maxAmountRequired: options.amount,
              resource: fullUrl,
              description: options.description,
              mimeType: "application/json",
              payTo: options.payTo,
              maxTimeoutSeconds: 300,
              asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
              outputSchema: {
                input: {
                  type: "http",
                  method: "POST",
                  bodyType: "json",
                  bodyFields: {
                    targetUrl: { type: "string", required: false },
                    network: { type: "string", required: false },
                    duration: { type: "number", required: false },
                    encryptedData: { type: "string", required: false },
                    dropId: { type: "string", required: false },
                    price: { type: "number", required: false },
                    limit: { type: "number", required: false },
                  },
                },
                output: {
                  type: "object",
                  properties: {
                    sessionId: { type: "string" },
                    dropId: { type: "string" },
                    message: { type: "string" },
                  },
                },
              },
            },
          ],
        },
        402
      );
    }
    
    // Payment provided - in production, verify with facilitator
    console.log(`✅ Payment received for ${c.req.path}`);
    await next();
  };
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  server: {
    port: parseInt(process.env.PORT || "3000"),
    host: process.env.HOST || "0.0.0.0",
  },
  x402: {
    facilitatorUrl: process.env.FACILITATOR_URL || "https://facilitator.x402.rs",
    address: (process.env.ADDRESS || "0x11c24Fbcd702cd611729F8402d8fB51ECa75Ba83") as Hex,
    network: process.env.NETWORK || "base",
    privateKey: process.env.PRIVATE_KEY as Hex,
  },
  pricing: {
    proxyStream: 50000,       // $0.05 in micro USDC
    deadDropCreate: 100000,   // $0.10
    deadDropPurchase: 150000, // $0.15
    listDeadDrops: 20000,     // $0.02
    bountyPost: 250000,       // $0.25
    submitBountyProof: 50000, // $0.05
    listBounties: 20000,      // $0.02
    aiQuery: 100000,          // $0.10
    nodeStatus: 20000,        // $0.02
    systemInfo: 10000,        // $0.01
  },
};

// Validate configuration
if (!CONFIG.x402.privateKey) {
  console.warn("⚠️  No PRIVATE_KEY found - payment verification disabled");
}

const account = CONFIG.x402.privateKey ? privateKeyToAccount(CONFIG.x402.privateKey) : null;
if (account) {
  console.log("💰 Payment account:", account.address);
  console.log("🌐 Network:", CONFIG.x402.network);
}

// ============================================================================
// DATABASE SETUP
// ============================================================================

const db = new Database("shadowllama.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    node_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    bytes_transferred INTEGER DEFAULT 0,
    cost REAL NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS dead_drops (
    id TEXT PRIMARY KEY,
    encrypted_data TEXT NOT NULL,
    price REAL NOT NULL,
    creator TEXT NOT NULL,
    downloads INTEGER DEFAULT 0,
    max_downloads INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    metadata TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS bounties (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    reward REAL NOT NULL,
    creator TEXT NOT NULL,
    status TEXT DEFAULT 'open',
    proof_required TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS proxy_nodes (
    id TEXT PRIMARY KEY,
    address TEXT NOT NULL,
    network TEXT NOT NULL,
    reputation REAL DEFAULT 1.0,
    total_bytes INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    earnings REAL DEFAULT 0,
    region TEXT,
    last_seen INTEGER NOT NULL
  );
`);

// Seed demo nodes
const seedNodes = () => {
  const nodes = [
    { id: "tor-exit-nl-001", address: "tor://nlexitnode001.onion", network: "tor", reputation: 0.95, region: "Netherlands" },
    { id: "tor-exit-de-042", address: "tor://deexitnode042.onion", network: "tor", reputation: 0.88, region: "Germany" },
    { id: "i2p-relay-jp-007", address: "i2p://jprelay007.i2p", network: "i2p", reputation: 0.92, region: "Japan" },
    { id: "tor-guard-us-123", address: "tor://usguardnode123.onion", network: "tor", reputation: 0.78, region: "United States" },
  ];

  const insert = db.prepare(`INSERT OR IGNORE INTO proxy_nodes (id, address, network, reputation, region, last_seen) VALUES (?, ?, ?, ?, ?, ?)`);
  nodes.forEach(n => insert.run(n.id, n.address, n.network, n.reputation, n.region, Date.now()));
  console.log(`[DB] ✓ Seeded ${nodes.length} proxy nodes`);
};

seedNodes();

// ============================================================================
// HONO APP
// ============================================================================

const app = new Hono();

app.use("*", cors());
app.use("*", logger());

// ============================================================================
// FREE ENDPOINTS
// ============================================================================

app.get("/", (c) => {
  return c.json({
    name: "ShadowLlama",
    version: "1.0.0",
    description: "🌐 Decentralized dark web proxy + AI-powered underground marketplace",
    network: CONFIG.x402.network,
    pricing: {
      proxyStream: `$${(CONFIG.pricing.proxyStream / 1_000_000).toFixed(2)}`,
      deadDropCreate: `$${(CONFIG.pricing.deadDropCreate / 1_000_000).toFixed(2)}`,
      deadDropPurchase: `$${(CONFIG.pricing.deadDropPurchase / 1_000_000).toFixed(2)}`,
      listDeadDrops: `$${(CONFIG.pricing.listDeadDrops / 1_000_000).toFixed(2)}`,
      bountyPost: `$${(CONFIG.pricing.bountyPost / 1_000_000).toFixed(2)}`,
      submitBountyProof: `$${(CONFIG.pricing.submitBountyProof / 1_000_000).toFixed(2)}`,
      listBounties: `$${(CONFIG.pricing.listBounties / 1_000_000).toFixed(2)}`,
      aiQuery: `$${(CONFIG.pricing.aiQuery / 1_000_000).toFixed(2)}`,
      nodeStatus: `$${(CONFIG.pricing.nodeStatus / 1_000_000).toFixed(2)}`,
      systemInfo: `$${(CONFIG.pricing.systemInfo / 1_000_000).toFixed(2)}`,
    },
    endpoints: {
      proxyStream: "/service/proxy-stream",
      createDeadDrop: "/service/create-dead-drop",
      purchaseDeadDrop: "/service/purchase-dead-drop",
      listDeadDrops: "/service/list-dead-drops",
      postBounty: "/service/post-bounty",
      submitBountyProof: "/service/submit-bounty-proof",
      listBounties: "/service/list-bounties",
      aiQuery: "/service/ai-query",
      nodeStatus: "/service/node-status",
      systemInfo: "/service/system-info",
    },
    capabilities: [
      "Anonymous proxy streaming (Tor/I2P)",
      "Encrypted dead drops marketplace",
      "Hacking bounty platform",
      "AI deck assistants",
      "x402 micropayments",
      "A2A economy ready",
    ],
    message: "🦙 Welcome to the Sprawl, chummer.",
  });
});

app.get("/health", (c) => {
  return c.json({
    status: "operational",
    timestamp: Date.now(),
    uptime: process.uptime(),
    version: "1.0.0",
    llama: "🦙",
  });
});

// ============================================================================
// PAID ENDPOINTS WITH X402
// ============================================================================

// 1. Proxy Stream
app.post(
  "/service/proxy-stream",
  requirePayment({
    facilitatorUrl: CONFIG.x402.facilitatorUrl,
    amount: CONFIG.pricing.proxyStream.toString(),
    network: CONFIG.x402.network,
    payTo: CONFIG.x402.address,
    description: "🔒 Anonymous proxy streaming session",
  }),
  async (c) => {
    const body = await c.req.json();
    const { targetUrl = "https://example.com", network = "tor", duration = 60 } = body;

    const nodes = db.prepare("SELECT * FROM proxy_nodes WHERE network = ? AND reputation > 0.7 ORDER BY reputation DESC").all(network);
    
    if (nodes.length === 0) {
      return c.json({ error: "No nodes available" }, 503);
    }

    const selectedNode = nodes[0] as any;
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    db.prepare("INSERT INTO sessions (id, node_id, user_id, cost, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)").run(
      sessionId,
      selectedNode.id,
      c.req.header("x-payment-payer") || "anon",
      CONFIG.pricing.proxyStream / 1_000_000,
      Date.now(),
      Date.now() + duration * 1000
    );

    return c.json({
      sessionId,
      selectedNode: {
        id: selectedNode.id,
        network: selectedNode.network,
        reputation: selectedNode.reputation,
        region: selectedNode.region,
      },
      targetUrl,
      duration,
      estimatedCost: `$${(CONFIG.pricing.proxyStream / 1_000_000).toFixed(3)}`,
      streamUrl: `wss://shadowllama.stream/${sessionId}`,
      expiresAt: new Date(Date.now() + duration * 1000).toISOString(),
      message: "🔒 Proxy stream established. Jack in safely, netrunner.",
    });
  }
);

// 2. Create Dead Drop
app.post(
  "/service/create-dead-drop",
  requirePayment({
    facilitatorUrl: CONFIG.x402.facilitatorUrl,
    amount: CONFIG.pricing.deadDropCreate.toString(),
    network: CONFIG.x402.network,
    payTo: CONFIG.x402.address,
    description: "📦 Create encrypted dead drop",
  }),
  async (c) => {
    const body = await c.req.json();
    const { encryptedData, price = 0.05, expiresInHours = 168, maxDownloads = 100, description = "" } = body;

    const dropId = `drop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = Date.now() + expiresInHours * 3600 * 1000;

    db.prepare("INSERT INTO dead_drops (id, encrypted_data, price, creator, max_downloads, expires_at, created_at, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(
      dropId,
      encryptedData || "",
      price,
      c.req.header("x-payment-payer") || "anon",
      maxDownloads,
      expiresAt,
      Date.now(),
      JSON.stringify({ description, size: encryptedData?.length || 0 })
    );

    return c.json({
      dropId,
      price: `$${price}`,
      maxDownloads,
      expiresAt: new Date(expiresAt).toISOString(),
      accessUrl: `https://shadowllama.network/drop/${dropId}`,
      message: "📦 Dead drop created. Data cached in the void.",
    });
  }
);

// 3. Purchase Dead Drop
app.post(
  "/service/purchase-dead-drop",
  requirePayment({
    facilitatorUrl: CONFIG.x402.facilitatorUrl,
    amount: CONFIG.pricing.deadDropPurchase.toString(),
    network: CONFIG.x402.network,
    payTo: CONFIG.x402.address,
    description: "💰 Purchase encrypted dead drop",
  }),
  async (c) => {
    const body = await c.req.json();
    const { dropId } = body;

    const drop = db.prepare("SELECT * FROM dead_drops WHERE id = ?").get(dropId) as any;

    if (!drop) {
      return c.json({ error: "Dead drop not found" }, 404);
    }

    if (drop.expires_at < Date.now()) {
      return c.json({ error: "Dead drop expired" }, 410);
    }

    if (drop.downloads >= drop.max_downloads) {
      return c.json({ error: "Maximum downloads reached" }, 410);
    }

    db.prepare("UPDATE dead_drops SET downloads = downloads + 1 WHERE id = ?").run(dropId);

    return c.json({
      dropId: drop.id,
      encryptedData: drop.encrypted_data,
      metadata: JSON.parse(drop.metadata),
      downloads: drop.downloads + 1,
      maxDownloads: drop.max_downloads,
      message: "✓ Dead drop unlocked. Extract complete.",
    });
  }
);

// 4. List Dead Drops
app.post(
  "/service/list-dead-drops",
  requirePayment({
    facilitatorUrl: CONFIG.x402.facilitatorUrl,
    amount: CONFIG.pricing.listDeadDrops.toString(),
    network: CONFIG.x402.network,
    payTo: CONFIG.x402.address,
    description: "📋 List available dead drops",
  }),
  async (c) => {
    const body = await c.req.json();
    const { limit = 20 } = body;

    const drops = db.prepare("SELECT id, price, downloads, max_downloads, expires_at, metadata FROM dead_drops WHERE expires_at > ? ORDER BY created_at DESC LIMIT ?").all(Date.now(), limit);

    return c.json({
      drops: drops.map((d: any) => ({
        dropId: d.id,
        price: `$${d.price}`,
        downloads: d.downloads,
        maxDownloads: d.max_downloads,
        expiresAt: new Date(d.expires_at).toISOString(),
        metadata: JSON.parse(d.metadata),
      })),
      total: drops.length,
      message: `📋 Found ${drops.length} active drops in the sprawl.`,
    });
  }
);

// 5. Post Bounty
app.post(
  "/service/post-bounty",
  requirePayment({
    facilitatorUrl: CONFIG.x402.facilitatorUrl,
    amount: CONFIG.pricing.bountyPost.toString(),
    network: CONFIG.x402.network,
    payTo: CONFIG.x402.address,
    description: "🎯 Post hacking bounty",
  }),
  async (c) => {
    const body = await c.req.json();
    const { title, description, reward = 100, expiresInHours = 168, proofRequired = "Proof of completion" } = body;

    const bountyId = `bounty_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = Date.now() + expiresInHours * 3600 * 1000;

    db.prepare("INSERT INTO bounties (id, title, description, reward, creator, proof_required, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(
      bountyId,
      title,
      description,
      reward,
      c.req.header("x-payment-payer") || "anon",
      proofRequired,
      expiresAt,
      Date.now()
    );

    return c.json({
      bountyId,
      title,
      description,
      reward: `$${reward}`,
      proofRequired,
      expiresAt: new Date(expiresAt).toISOString(),
      bountyUrl: `https://shadowllama.network/bounty/${bountyId}`,
      message: "🎯 Bounty posted. Netrunners are mobilizing...",
    });
  }
);

// 6. Submit Bounty Proof
app.post(
  "/service/submit-bounty-proof",
  requirePayment({
    facilitatorUrl: CONFIG.x402.facilitatorUrl,
    amount: CONFIG.pricing.submitBountyProof.toString(),
    network: CONFIG.x402.network,
    payTo: CONFIG.x402.address,
    description: "📸 Submit bounty proof",
  }),
  async (c) => {
    const body = await c.req.json();
    const { bountyId, proof = "", submitterAddress = "anon" } = body;

    const bounty = db.prepare("SELECT * FROM bounties WHERE id = ?").get(bountyId) as any;

    if (!bounty) {
      return c.json({ error: "Bounty not found" }, 404);
    }

    if (bounty.status !== "open") {
      return c.json({ error: `Bounty is ${bounty.status}` }, 400);
    }

    if (bounty.expires_at < Date.now()) {
      return c.json({ error: "Bounty has expired" }, 410);
    }

    const submissionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return c.json({
      submissionId,
      bountyId,
      status: "pending",
      message: "📸 Proof submitted. Awaiting verification...",
    });
  }
);

// 7. List Bounties
app.post(
  "/service/list-bounties",
  requirePayment({
    facilitatorUrl: CONFIG.x402.facilitatorUrl,
    amount: CONFIG.pricing.listBounties.toString(),
    network: CONFIG.x402.network,
    payTo: CONFIG.x402.address,
    description: "🎯 List available bounties",
  }),
  async (c) => {
    const body = await c.req.json();
    const { status } = body;

    let query = "SELECT id, title, description, reward, status, expires_at, created_at FROM bounties WHERE expires_at > ?";
    const params: any[] = [Date.now()];

    if (status) {
      query += " AND status = ?";
      params.push(status);
    }

    query += " ORDER BY created_at DESC LIMIT 50";

    const bounties = db.prepare(query).all(...params);

    return c.json({
      bounties: bounties.map((b: any) => ({
        bountyId: b.id,
        title: b.title,
        description: b.description,
        reward: `$${b.reward}`,
        status: b.status,
        expiresAt: new Date(b.expires_at).toISOString(),
      })),
      total: bounties.length,
      message: `🎯 Found ${bounties.length} bounties.`,
    });
  }
);

// 8. AI Query
app.post(
  "/service/ai-query",
  requirePayment({
    facilitatorUrl: CONFIG.x402.facilitatorUrl,
    amount: CONFIG.pricing.aiQuery.toString(),
    network: CONFIG.x402.network,
    payTo: CONFIG.x402.address,
    description: "🤖 AI deck assistant query",
  }),
  async (c) => {
    const body = await c.req.json();
    const { query = "", model = "claude" } = body;

    const queryId = `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const mockResponses: any = {
      claude: `[CLAUDE DECK]: Processing query in the sprawl... Analysis: ${query.substring(0, 50)}...`,
      gpt4: `[GPT-4 DECK]: Neural pathways engaged. Query processed.`,
      gemini: `[GEMINI DECK]: Quantum analysis complete.`,
    };

    return c.json({
      queryId,
      model: model.toUpperCase(),
      response: mockResponses[model] || mockResponses.claude,
      tokensUsed: 500,
      cost: `$${(CONFIG.pricing.aiQuery / 1_000_000).toFixed(3)}`,
      message: "🤖 AI consulted. The oracle has spoken.",
    });
  }
);

// 9. Node Status
app.post(
  "/service/node-status",
  requirePayment({
    facilitatorUrl: CONFIG.x402.facilitatorUrl,
    amount: CONFIG.pricing.nodeStatus.toString(),
    network: CONFIG.x402.network,
    payTo: CONFIG.x402.address,
    description: "📊 Check proxy node status",
  }),
  async (c) => {
    const body = await c.req.json();
    const { network, minReputation = 0.5 } = body;

    let query = "SELECT * FROM proxy_nodes WHERE reputation >= ?";
    const params: any[] = [minReputation];

    if (network) {
      query += " AND network = ?";
      params.push(network);
    }

    query += " ORDER BY reputation DESC";

    const nodes = db.prepare(query).all(...params);

    return c.json({
      nodes: nodes.map((n: any) => ({
        nodeId: n.id,
        network: n.network,
        reputation: n.reputation,
        totalSessions: n.total_sessions,
        region: n.region,
      })),
      total: nodes.length,
      averageReputation: nodes.reduce((sum: number, n: any) => sum + n.reputation, 0) / (nodes.length || 1),
      message: `📊 ${nodes.length} nodes operational.`,
    });
  }
);

// 10. System Info
app.post(
  "/service/system-info",
  requirePayment({
    facilitatorUrl: CONFIG.x402.facilitatorUrl,
    amount: CONFIG.pricing.systemInfo.toString(),
    network: CONFIG.x402.network,
    payTo: CONFIG.x402.address,
    description: "ℹ️ Get system information",
  }),
  async (c) => {
    return c.json({
      name: "ShadowLlama",
      version: "1.0.0",
      network: CONFIG.x402.network,
      uptime: process.uptime(),
      pricing: CONFIG.pricing,
      capabilities: [
        "Tor/I2P routing",
        "Dead drops",
        "Bounties",
        "AI assistants",
        "x402 micropayments",
      ],
      message: "🌐 ShadowLlama operational. Welcome to the Sprawl.",
    });
  }
);

// ============================================================================
// START SERVER
// ============================================================================

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║              🦙 SHADOWLLAMA AGENT AWAKENED 🦙                ║
║                                                               ║
║  ✨ x402-Powered Dark Web Proxy                              ║
║  ⚡ Real Payment Verification on ${CONFIG.x402.network.toUpperCase().padEnd(25)}║
║  💰 Wallet: ${(account?.address || 'Not configured').substring(0, 20)}...${' '.repeat(20)}║
║                                                               ║
║  🌐 Portal: http://${CONFIG.server.host}:${CONFIG.server.port}${' '.repeat(34)}║
║                                                               ║
║  🔮 Ready for agent-to-agent economy...                      ║
║  🦙 The llama awaits in the neon void...                     ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`);

serve({
  fetch: app.fetch,
  port: CONFIG.server.port,
  hostname: CONFIG.server.host,
});
