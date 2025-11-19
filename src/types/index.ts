// src/types/index.ts
// ShadowLlama Type Definitions

export interface X402Response {
  x402Version: number;
  error?: string;
  accepts?: Array<X402Accept>;
  payer?: string;
}

export interface X402Accept {
  scheme: "exact";
  network: "base" | "ethereum" | "solana";
  maxAmountRequired: string;
  resource: string;
  description: string;
  mimeType: string;
  payTo: string;
  maxTimeoutSeconds: number;
  asset: string;
  outputSchema?: {
    input: {
      type: "http";
      method: "GET" | "POST";
      bodyType?: "json" | "form-data" | "multipart-form-data" | "text" | "binary";
      queryParams?: Record<string, FieldDef>;
      bodyFields?: Record<string, FieldDef>;
      headerFields?: Record<string, FieldDef>;
    };
    output?: Record<string, any>;
  };
  extra?: Record<string, any>;
}

export interface FieldDef {
  type?: string;
  required?: boolean | string[];
  description?: string;
  enum?: string[];
  properties?: Record<string, FieldDef>;
}

// Proxy Types
export interface ProxyNode {
  id: string;
  address: string;
  network: "tor" | "i2p" | "clearnet";
  reputation: number;
  totalBytes: number;
  totalSessions: number;
  earnings: number;
  lastSeen: Date;
  region?: string;
  capabilities: string[];
}

export interface ProxySession {
  id: string;
  nodeId: string;
  startTime: Date;
  endTime?: Date;
  bytesTransferred: number;
  cost: number;
  paymentTxHash?: string;
  userId: string;
}

// Dead Drop Types
export interface DeadDrop {
  id: string;
  encryptedData: string;
  price: number;
  creator: string;
  createdAt: Date;
  expiresAt: Date;
  downloads: number;
  maxDownloads: number;
  metadata: {
    size: number;
    mimeType: string;
    description?: string;
    tags?: string[];
  };
}

// Bounty Types
export interface Bounty {
  id: string;
  title: string;
  description: string;
  reward: number;
  creator: string;
  createdAt: Date;
  expiresAt: Date;
  status: "open" | "claimed" | "completed" | "expired";
  submissions: BountySubmission[];
  proofRequired: string;
}

export interface BountySubmission {
  id: string;
  bountyId: string;
  submitter: string;
  proof: string;
  submittedAt: Date;
  status: "pending" | "approved" | "rejected";
  paymentTxHash?: string;
}

// AI Deck Types
export interface AIDeckQuery {
  id: string;
  query: string;
  model: "claude" | "gpt4" | "gemini";
  maxTokens: number;
  userId: string;
  cost: number;
  response?: string;
  timestamp: Date;
}

// Data Feed Types
export interface DataFeed {
  id: string;
  source: string;
  category: "leak" | "market" | "whistleblow" | "iot" | "darknet";
  pricePerItem: number;
  items: DataFeedItem[];
  reputation: number;
}

export interface DataFeedItem {
  id: string;
  feedId: string;
  data: string;
  timestamp: Date;
  price: number;
  purchased: boolean;
}

// Streaming Types
export interface StreamSession {
  id: string;
  type: "proxy" | "data" | "ai";
  startedAt: Date;
  lastHeartbeat: Date;
  bytesStreamed: number;
  costAccumulated: number;
  active: boolean;
}

// Payment Types
export interface PaymentProof {
  network: "base" | "ethereum" | "solana";
  txHash: string;
  amount: string;
  from: string;
  to: string;
  timestamp: number;
  verified: boolean;
}

// Node Reputation Types
export interface ReputationScore {
  nodeId: string;
  score: number;
  successfulSessions: number;
  failedSessions: number;
  totalEarnings: number;
  slashes: number;
  lastUpdated: Date;
}

// Cyberpunk UI Types
export interface MatrixEffect {
  enabled: boolean;
  speed: number;
  density: number;
  color: string;
}

export interface SyntheticVoice {
  enabled: boolean;
  pitch: number;
  rate: number;
  phrases: string[];
}

// Config Types
export interface ShadowLlamaConfig {
  payments: {
    baseAddress: string;
    solanaAddress: string;
    ethAddress: string;
    network: string;
    facilitatorUrl: string;
  };
  pricing: {
    perMB: number;
    perSecond: number;
    deadDrop: number;
    aiQuery: number;
    bountyPost: number;
  };
  node: {
    mode: "full" | "relay" | "exit";
    id: string;
    minReputation: number;
  };
  security: {
    maxStreamDuration: number;
    maxFileSize: number;
    rateLimitRequests: number;
    rateLimitWindow: number;
  };
  ai: {
    anthropicKey?: string;
    openaiKey?: string;
  };
}
