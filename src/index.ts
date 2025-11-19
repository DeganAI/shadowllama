// src/index.ts
// ShadowLlama Main Application - Cyberpunk Dark Web Proxy

import { createAgentApp } from "@lucid-dreams/agent-kit";
import { z } from "zod";
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

const { app, addEntrypoint, config: agentConfig } = createAgentApp(
  {
    name: "shadowllama-agent",
    version: "1.0.0",
    description:
      "🌐 Decentralized pay-per-second dark web proxy + AI-powered underground marketplace. Tor/I2P hybrid with x402 micropayments.",
    instructions:
      "ShadowLlama is a cyberpunk-themed decentralized proxy network where every byte costs crypto. " +
      "Users pay per second for anonymous routing through Tor/I2P nodes, access AI oracles, " +
      "post bounties for hacking challenges, and trade in encrypted dead drops. " +
      "All payments are instant via x402 protocol. Zero logs, maximum privacy.",
  },
  {
    defaultPrice: config.pricing.perSecond.toString(),
    payToAddress: config.payments.baseAddress,
    network: config.payments.network as "base",
    facilitatorUrl: config.payments.facilitatorUrl,
  }
);

// ============================================================================
// ENTRYPOINT 1: Start Proxy Stream
// ============================================================================

addEntrypoint({
  key: "start-proxy-stream",
  description:
    "🔒 Start an anonymous proxy streaming session through Tor/I2P nodes. " +
    "Pay per second for encrypted, routed traffic. No logs, maximum privacy.",
  inputSchema: z.object({
    targetUrl: z
      .string()
      .url()
      .describe("The destination URL to access through the proxy"),
    network: z
      .enum(["tor", "i2p", "clearnet"])
      .default("tor")
      .describe("Anonymity network to use"),
    duration: z
      .number()
      .min(1)
      .max(3600)
      .default(60)
      .describe("Streaming duration in seconds (max 1 hour)"),
    minNodeReputation: z
      .number()
      .min(0)
      .max(1)
      .default(0.7)
      .describe("Minimum reputation score for proxy nodes (0-1)"),
  }),
  outputSchema: z.object({
    sessionId: z.string(),
    selectedNode: z.object({
      id: z.string(),
      network: z.string(),
      reputation: z.number(),
      region: z.string().optional(),
    }),
    estimatedCost: z.string(),
    streamUrl: z.string(),
    expiresAt: z.string(),
    message: z.string(),
  }),
  async handler(input) {
    const { targetUrl, network, duration, minNodeReputation } = input;

    // Get available nodes
    const nodes = db.getProxyNodes(minNodeReputation).filter((n) => n.network === network);

    if (nodes.length === 0) {
      throw new Error(`No ${network} nodes available with reputation >= ${minNodeReputation}`);
    }

    // Select best node (highest reputation)
    const selectedNode = nodes[0];

    // Calculate cost
    const estimatedCost = (config.pricing.perSecond * duration) / 1_000_000;

    // Create session
    const sessionId = db.createSession({
      nodeId: selectedNode.id,
      bytesTransferred: 0,
      cost: estimatedCost,
      userId: "user-" + Date.now(),
    });

    const expiresAt = new Date(Date.now() + duration * 1000).toISOString();

    console.log(`[PROXY] ${getRandomPhrase()}`);
    console.log(`[PROXY] Session ${sessionId} started via node ${selectedNode.id}`);

    return {
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
    };
  },
});

// ============================================================================
// ENTRYPOINT 2: Create Dead Drop
// ============================================================================

addEntrypoint({
  key: "create-dead-drop",
  description:
    "📦 Create an encrypted dead drop - upload encrypted data that others can purchase and download. " +
    "Perfect for whistleblowing, data leaks, or secure file sharing.",
  inputSchema: z.object({
    encryptedData: z.string().describe("Base64 encoded encrypted data"),
    price: z.number().min(0).describe("Price in USDC (e.g., 0.50 for $0.50)"),
    expiresInHours: z.number().min(1).max(720).default(168).describe("Expires in N hours (default 1 week)"),
    maxDownloads: z.number().min(1).default(100).describe("Maximum number of downloads allowed"),
    mimeType: z.string().default("application/octet-stream"),
    description: z.string().optional().describe("Optional description of the drop"),
    tags: z.array(z.string()).optional().describe("Optional tags for discovery"),
  }),
  outputSchema: z.object({
    dropId: z.string(),
    price: z.string(),
    expiresAt: z.string(),
    accessUrl: z.string(),
    message: z.string(),
  }),
  async handler(input) {
    const { encryptedData, price, expiresInHours, maxDownloads, mimeType, description, tags } =
      input;

    // Calculate expiration
    const expiresAt = new Date(Date.now() + expiresInHours * 3600 * 1000);

    // Create dead drop
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
    console.log(`[DEAD DROP] Created drop ${dropId} - Price: $${price} USDC`);

    return {
      dropId,
      price: `$${price} USDC`,
      expiresAt: expiresAt.toISOString(),
      accessUrl: `https://shadowllama.network/drop/${dropId}`,
      message: `📦 Dead drop created. ${getRandomPhrase()}`,
    };
  },
});

// ============================================================================
// ENTRYPOINT 3: Purchase Dead Drop
// ============================================================================

addEntrypoint({
  key: "purchase-dead-drop",
  description:
    "💰 Purchase and download an encrypted dead drop. Payment verified via x402 before unlocking data.",
  inputSchema: z.object({
    dropId: z.string().describe("The ID of the dead drop to purchase"),
  }),
  outputSchema: z.object({
    dropId: z.string(),
    encryptedData: z.string(),
    mimeType: z.string(),
    size: z.number(),
    downloads: z.number(),
    message: z.string(),
  }),
  async handler(input) {
    const { dropId } = input;

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

    // Increment downloads
    db.incrementDeadDropDownload(dropId);

    console.log(`[DEAD DROP] ${getRandomPhrase()}`);
    console.log(`[DEAD DROP] Drop ${dropId} purchased and unlocked`);

    return {
      dropId: drop.id,
      encryptedData: drop.encryptedData,
      mimeType: drop.metadata.mimeType,
      size: drop.metadata.size,
      downloads: drop.downloads + 1,
      message: `✓ Dead drop unlocked. ${getRandomPhrase()}`,
    };
  },
});

// ============================================================================
// ENTRYPOINT 4: List Dead Drops
// ============================================================================

addEntrypoint({
  key: "list-dead-drops",
  description: "📋 Browse available dead drops on the network. Discover leaked data, files, and secrets.",
  inputSchema: z.object({
    limit: z.number().min(1).max(100).default(20).describe("Number of drops to return"),
  }),
  outputSchema: z.object({
    drops: z.array(
      z.object({
        dropId: z.string(),
        price: z.string(),
        size: z.number(),
        mimeType: z.string(),
        description: z.string().optional(),
        tags: z.array(z.string()),
        downloads: z.number(),
        maxDownloads: z.number(),
        expiresAt: z.string(),
      })
    ),
    total: z.number(),
    message: z.string(),
  }),
  async handler(input) {
    const { limit } = input;

    const drops = db.listDeadDrops(limit);

    return {
      drops: drops.map((drop) => ({
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
    };
  },
});

// ============================================================================
// ENTRYPOINT 5: Post Bounty
// ============================================================================

addEntrypoint({
  key: "post-bounty",
  description:
    "🎯 Post a hacking bounty or challenge. Offer rewards for exploits, data breaches, or completing missions. " +
    "First valid submission wins.",
  inputSchema: z.object({
    title: z.string().min(5).max(200).describe("Bounty title"),
    description: z.string().min(20).describe("Detailed description of the bounty/challenge"),
    reward: z.number().min(1).describe("Reward in USDC"),
    expiresInHours: z.number().min(1).max(720).default(168).describe("Time limit in hours"),
    proofRequired: z
      .string()
      .describe("What proof is required (e.g., 'screenshot of admin panel', 'leaked database')"),
  }),
  outputSchema: z.object({
    bountyId: z.string(),
    title: z.string(),
    reward: z.string(),
    expiresAt: z.string(),
    bountyUrl: z.string(),
    message: z.string(),
  }),
  async handler(input) {
    const { title, description, reward, expiresInHours, proofRequired } = input;

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
    console.log(`[BOUNTY] Posted bounty ${bountyId} - Reward: $${reward} USDC`);

    return {
      bountyId,
      title,
      reward: `$${reward} USDC`,
      expiresAt: expiresAt.toISOString(),
      bountyUrl: `https://shadowllama.network/bounty/${bountyId}`,
      message: `🎯 Bounty posted. Netrunners are mobilizing... ${getRandomPhrase()}`,
    };
  },
});

// ============================================================================
// ENTRYPOINT 6: Submit Bounty Proof
// ============================================================================

addEntrypoint({
  key: "submit-bounty-proof",
  description: "📸 Submit proof for a bounty. If accepted, rewards are paid out automatically via x402.",
  inputSchema: z.object({
    bountyId: z.string().describe("The bounty ID to submit proof for"),
    proof: z.string().describe("Your proof (URL, screenshot, data, etc.)"),
    submitterAddress: z.string().describe("Your payment address for reward"),
  }),
  outputSchema: z.object({
    submissionId: z.string(),
    bountyId: z.string(),
    status: z.string(),
    message: z.string(),
  }),
  async handler(input) {
    const { bountyId, proof, submitterAddress } = input;

    const bounty = db.getBounty(bountyId);

    if (!bounty) {
      throw new Error("Bounty not found");
    }

    if (bounty.status !== "open") {
      throw new Error(`Bounty is ${bounty.status}, not accepting submissions`);
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
    console.log(`[BOUNTY] Submission ${submissionId} received for bounty ${bountyId}`);

    return {
      submissionId,
      bountyId,
      status: "pending",
      message: `📸 Proof submitted. Awaiting verification... ${getRandomPhrase()}`,
    };
  },
});

// ============================================================================
// ENTRYPOINT 7: List Bounties
// ============================================================================

addEntrypoint({
  key: "list-bounties",
  description: "🎯 Browse active bounties and hacking challenges. Find your next mission.",
  inputSchema: z.object({
    status: z.enum(["open", "claimed", "completed", "expired"]).optional().describe("Filter by status"),
  }),
  outputSchema: z.object({
    bounties: z.array(
      z.object({
        bountyId: z.string(),
        title: z.string(),
        description: z.string(),
        reward: z.string(),
        status: z.string(),
        submissions: z.number(),
        expiresAt: z.string(),
      })
    ),
    total: z.number(),
    message: z.string(),
  }),
  async handler(input) {
    const { status } = input;

    const bounties = db.listBounties(status);

    return {
      bounties: bounties.map((bounty) => ({
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
    };
  },
});

// ============================================================================
// ENTRYPOINT 8: AI Deck Query
// ============================================================================

addEntrypoint({
  key: "ai-deck-query",
  description:
    "🤖 Consult your AI deck assistant. Ask Claude, GPT-4, or Gemini to navigate the dark web for you. " +
    "Pay per token used.",
  inputSchema: z.object({
    query: z.string().min(5).describe("Your question or command for the AI"),
    model: z.enum(["claude", "gpt4", "gemini"]).default("claude").describe("Which AI model to use"),
    maxTokens: z.number().min(100).max(4000).default(1000).describe("Maximum tokens to generate"),
  }),
  outputSchema: z.object({
    queryId: z.string(),
    model: z.string(),
    response: z.string(),
    tokensUsed: z.number(),
    cost: z.string(),
    message: z.string(),
  }),
  async handler(input) {
    const { query, model, maxTokens } = input;

    // Calculate cost (simplified - real implementation would call actual AI)
    const tokensUsed = Math.floor(Math.random() * maxTokens * 0.7 + maxTokens * 0.3);
    const cost = (config.pricing.aiQuery * tokensUsed) / 1_000_000;

    // Mock AI response (in production, call real AI APIs)
    const mockResponses = {
      claude: `[CLAUDE DECK]: Analysis complete, chummer. ${query} requires careful consideration. The data suggests...`,
      gpt4: `[GPT-4 DECK]: Processing neural pathways... Query resolved. Based on shadow net intel...`,
      gemini: `[GEMINI DECK]: Quantum processing engaged. Your query about ${query.slice(0, 30)}... yielding results...`,
    };

    const response = mockResponses[model];

    const queryId = db.saveAIQuery({
      query,
      model,
      maxTokens,
      userId: "user-" + Date.now(),
      cost,
      response,
    });

    console.log(`[AI DECK] ${getRandomPhrase()}`);
    console.log(`[AI DECK] Query ${queryId} processed by ${model.toUpperCase()}`);

    return {
      queryId,
      model: model.toUpperCase(),
      response,
      tokensUsed,
      cost: `$${cost.toFixed(6)} USDC`,
      message: `🤖 AI oracle consulted. ${getRandomPhrase()}`,
    };
  },
});

// ============================================================================
// ENTRYPOINT 9: Node Status & Reputation
// ============================================================================

addEntrypoint({
  key: "node-status",
  description: "📊 Check the status and reputation of proxy nodes on the network.",
  inputSchema: z.object({
    network: z.enum(["tor", "i2p", "clearnet"]).optional().describe("Filter by network type"),
    minReputation: z.number().min(0).max(1).default(0.5).describe("Minimum reputation threshold"),
  }),
  outputSchema: z.object({
    nodes: z.array(
      z.object({
        nodeId: z.string(),
        network: z.string(),
        reputation: z.number(),
        totalSessions: z.number(),
        totalBytes: z.string(),
        earnings: z.string(),
        region: z.string().optional(),
      })
    ),
    total: z.number(),
    averageReputation: z.number(),
    message: z.string(),
  }),
  async handler(input) {
    const { network, minReputation } = input;

    let nodes = db.getProxyNodes(minReputation);

    if (network) {
      nodes = nodes.filter((n) => n.network === network);
    }

    const avgReputation =
      nodes.reduce((sum, n) => sum + n.reputation, 0) / (nodes.length || 1);

    return {
      nodes: nodes.map((node) => ({
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
    };
  },
});

// ============================================================================
// ENTRYPOINT 10: System Info (Free)
// ============================================================================

addEntrypoint({
  key: "system-info",
  description: "ℹ️ Get information about the ShadowLlama network. No payment required.",
  inputSchema: z.object({}),
  outputSchema: z.object({
    name: z.string(),
    version: z.string(),
    network: z.string(),
    nodeMode: z.string(),
    pricing: z.object({
      perMB: z.string(),
      perSecond: z.string(),
      deadDrop: z.string(),
      aiQuery: z.string(),
      bountyPost: z.string(),
    }),
    capabilities: z.array(z.string()),
    message: z.string(),
  }),
  requiresPayment: false,
  async handler() {
    return {
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
