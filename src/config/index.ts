// src/config/index.ts
// Configuration Management for ShadowLlama

import type { ShadowLlamaConfig } from "../types/index.js";

export function loadConfig(): ShadowLlamaConfig {
  return {
    payments: {
      baseAddress: process.env.PAY_TO_ADDRESS_BASE || "0x11c24Fbcd702cd611729F8402d8fB51ECa75Ba83",
      solanaAddress: process.env.PAY_TO_ADDRESS_SOLANA || "2x4BRUreTFZCaCKbGKVXFYD5p2ZUBpYaYjuYsw9KYhf3",
      ethAddress: process.env.PAY_TO_ADDRESS_ETH || "0x11c24Fbcd702cd611729F8402d8fB51ECa75Ba83",
      network: process.env.NETWORK || "base",
      facilitatorUrl: process.env.FACILITATOR_URL || "https://facilitator.x402.org",
    },
    pricing: {
      perMB: parseInt(process.env.PRICE_PER_MB || "1000"),
      perSecond: parseInt(process.env.PRICE_PER_SECOND || "100"),
      deadDrop: parseInt(process.env.PRICE_DEAD_DROP || "50000"),
      aiQuery: parseInt(process.env.PRICE_AI_QUERY || "25000"),
      bountyPost: parseInt(process.env.PRICE_BOUNTY_POST || "100000"),
    },
    node: {
      mode: (process.env.NODE_MODE as "full" | "relay" | "exit") || "full",
      id: process.env.NODE_ID || generateNodeId(),
      minReputation: parseFloat(process.env.NODE_REPUTATION_MIN || "0.5"),
    },
    security: {
      maxStreamDuration: parseInt(process.env.MAX_STREAM_DURATION || "3600"),
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE || "104857600"),
      rateLimitRequests: parseInt(process.env.RATE_LIMIT_REQUESTS || "100"),
      rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || "60"),
    },
    ai: {
      anthropicKey: process.env.ANTHROPIC_API_KEY,
      openaiKey: process.env.OPENAI_API_KEY,
    },
  };
}

function generateNodeId(): string {
  return `node-${Math.random().toString(36).substring(2, 15)}`;
}

export const config = loadConfig();

// ASCII Art Banner
export const BANNER = `
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║   ███████╗██╗  ██╗ █████╗ ██████╗  ██████╗ ██╗    ██╗           ║
║   ██╔════╝██║  ██║██╔══██╗██╔══██╗██╔═══██╗██║    ██║           ║
║   ███████╗███████║███████║██║  ██║██║   ██║██║ █╗ ██║           ║
║   ╚════██║██╔══██║██╔══██║██║  ██║██║   ██║██║███╗██║           ║
║   ███████║██║  ██║██║  ██║██████╔╝╚██████╔╝╚███╔███╔╝           ║
║   ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝  ╚═════╝  ╚══╝╚══╝            ║
║                                                                   ║
║   ██╗     ██╗      █████╗ ███╗   ███╗ █████╗                    ║
║   ██║     ██║     ██╔══██╗████╗ ████║██╔══██╗                   ║
║   ██║     ██║     ███████║██╔████╔██║███████║                   ║
║   ██║     ██║     ██╔══██║██║╚██╔╝██║██╔══██║                   ║
║   ███████╗███████╗██║  ██║██║ ╚═╝ ██║██║  ██║                   ║
║   ╚══════╝╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝                   ║
║                                                                   ║
║   🌐 Decentralized Dark Web Proxy + AI Marketplace               ║
║   💰 Pay-Per-Second Streaming • x402 Micropayments               ║
║   🔒 Tor/I2P Hybrid • Zero Logs • Maximum Privacy                ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝

[SYSTEM] Jacking into the matrix...
[NETWORK] ${config.node.mode.toUpperCase()} node initializing...
[PAYMENT] x402 protocol active on ${config.payments.network}
[CRYPTO] Pay address: ${config.payments.baseAddress.substring(0, 10)}...
`;

export const CYBERPUNK_PHRASES = [
  "Chummer, that'll cost you...",
  "ICE detected. Paying to breach...",
  "Neural link established. Streaming data...",
  "Corp firewall bypassed. Payment confirmed.",
  "Dead drop unlocked. Extracting payload...",
  "AI oracle consulted. Tokens burning...",
  "Bounty posted. Netrunners mobilizing...",
  "Reputation updated. Trust protocols engaged.",
  "Proxy node selected. Route obfuscated.",
  "Payment verified. Access granted, cowboy.",
];

export function getRandomPhrase(): string {
  return CYBERPUNK_PHRASES[Math.floor(Math.random() * CYBERPUNK_PHRASES.length)];
}
