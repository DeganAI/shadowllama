// src/db/index.ts
// ShadowLlama Database Layer

import Database from "better-sqlite3";
import { nanoid } from "nanoid";

// ============================================================================
// TYPES
// ============================================================================

export interface ProxyNode {
  id: string;
  address: string;
  network: "tor" | "i2p" | "clearnet";
  reputation: number;
  totalBytes: number;
  totalSessions: number;
  earnings: number;
  region?: string;
  capabilities: string[];
  lastSeen: number;
}

export interface Session {
  id: string;
  nodeId: string;
  userId: string;
  bytesTransferred: number;
  cost: number;
  createdAt: number;
  expiresAt: number;
}

export interface DeadDrop {
  id: string;
  encryptedData: string;
  price: number;
  creator: string;
  downloads: number;
  maxDownloads: number;
  expiresAt: Date;
  createdAt: number;
  metadata: {
    size: number;
    mimeType: string;
    description?: string;
    tags?: string[];
  };
}

export interface Bounty {
  id: string;
  title: string;
  description: string;
  reward: number;
  creator: string;
  status: "open" | "claimed" | "completed" | "expired";
  proofRequired: string;
  expiresAt: Date;
  createdAt: number;
  submissions: BountySubmission[];
}

export interface BountySubmission {
  id: string;
  bountyId: string;
  submitter: string;
  proof: string;
  status: "pending" | "approved" | "rejected";
  createdAt: number;
}

export interface AIQuery {
  id: string;
  userId: string;
  query: string;
  model: string;
  maxTokens: number;
  response: string;
  cost: number;
  createdAt: number;
}

// ============================================================================
// DATABASE CLASS
// ============================================================================

export class ShadowLlamaDB {
  private db: Database.Database;

  constructor(filename: string = "shadowllama.db") {
    this.db = new Database(filename);
    this.init();
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  private init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS proxy_nodes (
        id TEXT PRIMARY KEY,
        address TEXT NOT NULL,
        network TEXT NOT NULL,
        reputation REAL DEFAULT 1.0,
        total_bytes INTEGER DEFAULT 0,
        total_sessions INTEGER DEFAULT 0,
        earnings REAL DEFAULT 0,
        region TEXT,
        capabilities TEXT NOT NULL,
        last_seen INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        node_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        bytes_transferred INTEGER DEFAULT 0,
        cost REAL NOT NULL,
        created_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL,
        FOREIGN KEY (node_id) REFERENCES proxy_nodes(id)
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

      CREATE TABLE IF NOT EXISTS bounty_submissions (
        id TEXT PRIMARY KEY,
        bounty_id TEXT NOT NULL,
        submitter TEXT NOT NULL,
        proof TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at INTEGER NOT NULL,
        FOREIGN KEY (bounty_id) REFERENCES bounties(id)
      );

      CREATE TABLE IF NOT EXISTS ai_queries (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        query TEXT NOT NULL,
        model TEXT NOT NULL,
        max_tokens INTEGER NOT NULL,
        response TEXT NOT NULL,
        cost REAL NOT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_dead_drops_expires ON dead_drops(expires_at);
      CREATE INDEX IF NOT EXISTS idx_bounties_status ON bounties(status);
      CREATE INDEX IF NOT EXISTS idx_bounties_expires ON bounties(expires_at);
      CREATE INDEX IF NOT EXISTS idx_nodes_network ON proxy_nodes(network);
      CREATE INDEX IF NOT EXISTS idx_nodes_reputation ON proxy_nodes(reputation);
    `);
  }

  // ============================================================================
  // PROXY NODES
  // ============================================================================

  addProxyNode(node: Omit<ProxyNode, "lastSeen">): void {
    const stmt = this.db.prepare(`
      INSERT INTO proxy_nodes (id, address, network, reputation, total_bytes, total_sessions, earnings, region, capabilities, last_seen)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      node.id,
      node.address,
      node.network,
      node.reputation,
      node.totalBytes || 0,
      node.totalSessions || 0,
      node.earnings || 0,
      node.region || null,
      JSON.stringify(node.capabilities),
      Date.now()
    );
  }

  getProxyNodes(minReputation: number = 0): ProxyNode[] {
    const stmt = this.db.prepare(`
      SELECT * FROM proxy_nodes 
      WHERE reputation >= ? 
      ORDER BY reputation DESC
    `);

    const rows = stmt.all(minReputation) as any[];

    return rows.map(row => ({
      id: row.id,
      address: row.address,
      network: row.network as "tor" | "i2p" | "clearnet",
      reputation: row.reputation,
      totalBytes: row.total_bytes,
      totalSessions: row.total_sessions,
      earnings: row.earnings,
      region: row.region,
      capabilities: JSON.parse(row.capabilities),
      lastSeen: row.last_seen,
    }));
  }

  updateNodeStats(nodeId: string, bytesTransferred: number, earnings: number): void {
    const stmt = this.db.prepare(`
      UPDATE proxy_nodes 
      SET total_bytes = total_bytes + ?,
          total_sessions = total_sessions + 1,
          earnings = earnings + ?,
          last_seen = ?
      WHERE id = ?
    `);

    stmt.run(bytesTransferred, earnings, Date.now(), nodeId);
  }

  // ============================================================================
  // SESSIONS
  // ============================================================================

  createSession(data: {
    nodeId: string;
    userId: string;
    bytesTransferred: number;
    cost: number;
  }): string {
    const sessionId = nanoid();
    const now = Date.now();
    const expiresAt = now + 3600 * 1000; // 1 hour

    const stmt = this.db.prepare(`
      INSERT INTO sessions (id, node_id, user_id, bytes_transferred, cost, created_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      sessionId,
      data.nodeId,
      data.userId,
      data.bytesTransferred,
      data.cost,
      now,
      expiresAt
    );

    return sessionId;
  }

  getSession(sessionId: string): Session | null {
    const stmt = this.db.prepare("SELECT * FROM sessions WHERE id = ?");
    const row = stmt.get(sessionId) as any;

    if (!row) return null;

    return {
      id: row.id,
      nodeId: row.node_id,
      userId: row.user_id,
      bytesTransferred: row.bytes_transferred,
      cost: row.cost,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
    };
  }

  // ============================================================================
  // DEAD DROPS
  // ============================================================================

  createDeadDrop(data: {
    encryptedData: string;
    price: number;
    creator: string;
    expiresAt: Date;
    maxDownloads: number;
    metadata: {
      size: number;
      mimeType: string;
      description?: string;
      tags?: string[];
    };
  }): string {
    const dropId = nanoid();

    const stmt = this.db.prepare(`
      INSERT INTO dead_drops (id, encrypted_data, price, creator, max_downloads, expires_at, created_at, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      dropId,
      data.encryptedData,
      data.price,
      data.creator,
      data.maxDownloads,
      data.expiresAt.getTime(),
      Date.now(),
      JSON.stringify(data.metadata)
    );

    return dropId;
  }

  getDeadDrop(dropId: string): DeadDrop | null {
    const stmt = this.db.prepare("SELECT * FROM dead_drops WHERE id = ?");
    const row = stmt.get(dropId) as any;

    if (!row) return null;

    return {
      id: row.id,
      encryptedData: row.encrypted_data,
      price: row.price,
      creator: row.creator,
      downloads: row.downloads,
      maxDownloads: row.max_downloads,
      expiresAt: new Date(row.expires_at),
      createdAt: row.created_at,
      metadata: JSON.parse(row.metadata),
    };
  }

  listDeadDrops(limit: number = 20): DeadDrop[] {
    const stmt = this.db.prepare(`
      SELECT * FROM dead_drops 
      WHERE expires_at > ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `);

    const rows = stmt.all(Date.now(), limit) as any[];

    return rows.map(row => ({
      id: row.id,
      encryptedData: row.encrypted_data,
      price: row.price,
      creator: row.creator,
      downloads: row.downloads,
      maxDownloads: row.max_downloads,
      expiresAt: new Date(row.expires_at),
      createdAt: row.created_at,
      metadata: JSON.parse(row.metadata),
    }));
  }

  incrementDeadDropDownload(dropId: string): void {
    const stmt = this.db.prepare("UPDATE dead_drops SET downloads = downloads + 1 WHERE id = ?");
    stmt.run(dropId);
  }

  // ============================================================================
  // BOUNTIES
  // ============================================================================

  createBounty(data: {
    title: string;
    description: string;
    reward: number;
    creator: string;
    expiresAt: Date;
    proofRequired: string;
  }): string {
    const bountyId = nanoid();

    const stmt = this.db.prepare(`
      INSERT INTO bounties (id, title, description, reward, creator, proof_required, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      bountyId,
      data.title,
      data.description,
      data.reward,
      data.creator,
      data.proofRequired,
      data.expiresAt.getTime(),
      Date.now()
    );

    return bountyId;
  }

  getBounty(bountyId: string): Bounty | null {
    const bountyStmt = this.db.prepare("SELECT * FROM bounties WHERE id = ?");
    const bountyRow = bountyStmt.get(bountyId) as any;

    if (!bountyRow) return null;

    const submissionsStmt = this.db.prepare("SELECT * FROM bounty_submissions WHERE bounty_id = ?");
    const submissionRows = submissionsStmt.all(bountyId) as any[];

    return {
      id: bountyRow.id,
      title: bountyRow.title,
      description: bountyRow.description,
      reward: bountyRow.reward,
      creator: bountyRow.creator,
      status: bountyRow.status,
      proofRequired: bountyRow.proof_required,
      expiresAt: new Date(bountyRow.expires_at),
      createdAt: bountyRow.created_at,
      submissions: submissionRows.map(row => ({
        id: row.id,
        bountyId: row.bounty_id,
        submitter: row.submitter,
        proof: row.proof,
        status: row.status,
        createdAt: row.created_at,
      })),
    };
  }

  listBounties(status?: string): Bounty[] {
    let query = `
      SELECT * FROM bounties 
      WHERE expires_at > ?
    `;
    const params: any[] = [Date.now()];

    if (status) {
      query += " AND status = ?";
      params.push(status);
    }

    query += " ORDER BY created_at DESC LIMIT 50";

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map(row => {
      const submissionsStmt = this.db.prepare("SELECT * FROM bounty_submissions WHERE bounty_id = ?");
      const submissionRows = submissionsStmt.all(row.id) as any[];

      return {
        id: row.id,
        title: row.title,
        description: row.description,
        reward: row.reward,
        creator: row.creator,
        status: row.status,
        proofRequired: row.proof_required,
        expiresAt: new Date(row.expires_at),
        createdAt: row.created_at,
        submissions: submissionRows.map(subRow => ({
          id: subRow.id,
          bountyId: subRow.bounty_id,
          submitter: subRow.submitter,
          proof: subRow.proof,
          status: subRow.status,
          createdAt: subRow.created_at,
        })),
      };
    });
  }

  submitBounty(data: {
    bountyId: string;
    submitter: string;
    proof: string;
  }): string {
    const submissionId = nanoid();

    const stmt = this.db.prepare(`
      INSERT INTO bounty_submissions (id, bounty_id, submitter, proof, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(
      submissionId,
      data.bountyId,
      data.submitter,
      data.proof,
      Date.now()
    );

    return submissionId;
  }

  updateBountyStatus(bountyId: string, status: "open" | "claimed" | "completed" | "expired"): void {
    const stmt = this.db.prepare("UPDATE bounties SET status = ? WHERE id = ?");
    stmt.run(status, bountyId);
  }

  // ============================================================================
  // AI QUERIES
  // ============================================================================

  saveAIQuery(data: {
    userId: string;
    query: string;
    model: string;
    maxTokens: number;
    response: string;
    cost: number;
  }): string {
    const queryId = nanoid();

    const stmt = this.db.prepare(`
      INSERT INTO ai_queries (id, user_id, query, model, max_tokens, response, cost, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      queryId,
      data.userId,
      data.query,
      data.model,
      data.maxTokens,
      data.response,
      data.cost,
      Date.now()
    );

    return queryId;
  }

  getAIQuery(queryId: string): AIQuery | null {
    const stmt = this.db.prepare("SELECT * FROM ai_queries WHERE id = ?");
    const row = stmt.get(queryId) as any;

    if (!row) return null;

    return {
      id: row.id,
      userId: row.user_id,
      query: row.query,
      model: row.model,
      maxTokens: row.max_tokens,
      response: row.response,
      cost: row.cost,
      createdAt: row.created_at,
    };
  }

  getUserAIQueries(userId: string, limit: number = 50): AIQuery[] {
    const stmt = this.db.prepare(`
      SELECT * FROM ai_queries 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `);

    const rows = stmt.all(userId, limit) as any[];

    return rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      query: row.query,
      model: row.model,
      maxTokens: row.max_tokens,
      response: row.response,
      cost: row.cost,
      createdAt: row.created_at,
    }));
  }

  // ============================================================================
  // UTILITY
  // ============================================================================

  close(): void {
    this.db.close();
  }

  // Clean up expired data
  cleanup(): void {
    const now = Date.now();

    // Delete expired sessions
    this.db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(now);

    // Delete expired dead drops
    this.db.prepare("DELETE FROM dead_drops WHERE expires_at < ?").run(now);

    // Update expired bounties
    this.db.prepare("UPDATE bounties SET status = 'expired' WHERE expires_at < ? AND status = 'open'").run(now);

    console.log("[DB] Cleanup completed");
  }

  // Get database stats
  getStats(): any {
    return {
      nodes: this.db.prepare("SELECT COUNT(*) as count FROM proxy_nodes").get(),
      sessions: this.db.prepare("SELECT COUNT(*) as count FROM sessions").get(),
      deadDrops: this.db.prepare("SELECT COUNT(*) as count FROM dead_drops WHERE expires_at > ?").get(Date.now()),
      bounties: this.db.prepare("SELECT COUNT(*) as count FROM bounties WHERE expires_at > ?").get(Date.now()),
      aiQueries: this.db.prepare("SELECT COUNT(*) as count FROM ai_queries").get(),
    };
  }
}

// Export singleton instance
export const db = new ShadowLlamaDB();

// Periodic cleanup (every hour)
setInterval(() => {
  db.cleanup();
}, 3600 * 1000);
