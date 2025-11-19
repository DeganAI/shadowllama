// src/db/index.ts
// Database Management for ShadowLlama

import Database from "better-sqlite3";
import { nanoid } from "nanoid";
import type {
  ProxyNode,
  ProxySession,
  DeadDrop,
  Bounty,
  BountySubmission,
  AIDeckQuery,
  DataFeed,
  ReputationScore,
} from "../types/index.js";

export class ShadowLlamaDB {
  private db: Database.Database;

  constructor(dbPath: string = "./data/shadowllama.db") {
    this.db = new Database(dbPath);
    this.initTables();
  }

  private initTables() {
    // Proxy Nodes Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS proxy_nodes (
        id TEXT PRIMARY KEY,
        address TEXT NOT NULL,
        network TEXT NOT NULL,
        reputation REAL DEFAULT 1.0,
        total_bytes INTEGER DEFAULT 0,
        total_sessions INTEGER DEFAULT 0,
        earnings REAL DEFAULT 0,
        last_seen INTEGER NOT NULL,
        region TEXT,
        capabilities TEXT
      )
    `);

    // Proxy Sessions Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS proxy_sessions (
        id TEXT PRIMARY KEY,
        node_id TEXT NOT NULL,
        start_time INTEGER NOT NULL,
        end_time INTEGER,
        bytes_transferred INTEGER DEFAULT 0,
        cost REAL DEFAULT 0,
        payment_tx_hash TEXT,
        user_id TEXT NOT NULL,
        FOREIGN KEY (node_id) REFERENCES proxy_nodes(id)
      )
    `);

    // Dead Drops Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS dead_drops (
        id TEXT PRIMARY KEY,
        encrypted_data TEXT NOT NULL,
        price REAL NOT NULL,
        creator TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL,
        downloads INTEGER DEFAULT 0,
        max_downloads INTEGER NOT NULL,
        size INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        description TEXT,
        tags TEXT
      )
    `);

    // Bounties Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS bounties (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        reward REAL NOT NULL,
        creator TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL,
        status TEXT DEFAULT 'open',
        proof_required TEXT NOT NULL
      )
    `);

    // Bounty Submissions Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS bounty_submissions (
        id TEXT PRIMARY KEY,
        bounty_id TEXT NOT NULL,
        submitter TEXT NOT NULL,
        proof TEXT NOT NULL,
        submitted_at INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        payment_tx_hash TEXT,
        FOREIGN KEY (bounty_id) REFERENCES bounties(id)
      )
    `);

    // AI Deck Queries Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ai_deck_queries (
        id TEXT PRIMARY KEY,
        query TEXT NOT NULL,
        model TEXT NOT NULL,
        max_tokens INTEGER NOT NULL,
        user_id TEXT NOT NULL,
        cost REAL NOT NULL,
        response TEXT,
        timestamp INTEGER NOT NULL
      )
    `);

    // Data Feeds Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS data_feeds (
        id TEXT PRIMARY KEY,
        source TEXT NOT NULL,
        category TEXT NOT NULL,
        price_per_item REAL NOT NULL,
        reputation REAL DEFAULT 1.0
      )
    `);

    // Reputation Scores Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS reputation_scores (
        node_id TEXT PRIMARY KEY,
        score REAL DEFAULT 1.0,
        successful_sessions INTEGER DEFAULT 0,
        failed_sessions INTEGER DEFAULT 0,
        total_earnings REAL DEFAULT 0,
        slashes INTEGER DEFAULT 0,
        last_updated INTEGER NOT NULL
      )
    `);

    console.log("[DB] ✓ Database tables initialized");
  }

  // ============================================================================
  // PROXY NODE OPERATIONS
  // ============================================================================

  addProxyNode(node: Omit<ProxyNode, "lastSeen"> & { lastSeen?: Date }): string {
    const id = nanoid();
    const stmt = this.db.prepare(`
      INSERT INTO proxy_nodes (id, address, network, reputation, total_bytes, 
        total_sessions, earnings, last_seen, region, capabilities)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      node.address,
      node.network,
      node.reputation || 1.0,
      node.totalBytes || 0,
      node.totalSessions || 0,
      node.earnings || 0,
      Date.now(),
      node.region || null,
      JSON.stringify(node.capabilities || [])
    );

    return id;
  }

  getProxyNodes(minReputation: number = 0.5): ProxyNode[] {
    const stmt = this.db.prepare(`
      SELECT * FROM proxy_nodes 
      WHERE reputation >= ? 
      ORDER BY reputation DESC, total_sessions DESC
    `);

    return stmt.all(minReputation).map(this.rowToProxyNode);
  }

  updateNodeReputation(nodeId: string, newReputation: number) {
    const stmt = this.db.prepare(`
      UPDATE proxy_nodes 
      SET reputation = ?, last_seen = ?
      WHERE id = ?
    `);
    stmt.run(newReputation, Date.now(), nodeId);
  }

  // ============================================================================
  // SESSION OPERATIONS
  // ============================================================================

  createSession(session: Omit<ProxySession, "id" | "startTime">): string {
    const id = nanoid();
    const stmt = this.db.prepare(`
      INSERT INTO proxy_sessions (id, node_id, start_time, bytes_transferred, 
        cost, user_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      session.nodeId,
      Date.now(),
      session.bytesTransferred || 0,
      session.cost || 0,
      session.userId
    );

    return id;
  }

  updateSession(sessionId: string, bytesTransferred: number, cost: number) {
    const stmt = this.db.prepare(`
      UPDATE proxy_sessions 
      SET bytes_transferred = ?, cost = ?, end_time = ?
      WHERE id = ?
    `);
    stmt.run(bytesTransferred, cost, Date.now(), sessionId);
  }

  completeSession(sessionId: string, paymentTxHash: string) {
    const stmt = this.db.prepare(`
      UPDATE proxy_sessions 
      SET end_time = ?, payment_tx_hash = ?
      WHERE id = ?
    `);
    stmt.run(Date.now(), paymentTxHash, sessionId);
  }

  // ============================================================================
  // DEAD DROP OPERATIONS
  // ============================================================================

  createDeadDrop(drop: Omit<DeadDrop, "id" | "createdAt" | "downloads">): string {
    const id = nanoid();
    const stmt = this.db.prepare(`
      INSERT INTO dead_drops (id, encrypted_data, price, creator, created_at, 
        expires_at, max_downloads, size, mime_type, description, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      drop.encryptedData,
      drop.price,
      drop.creator,
      Date.now(),
      drop.expiresAt.getTime(),
      drop.maxDownloads,
      drop.metadata.size,
      drop.metadata.mimeType,
      drop.metadata.description || null,
      JSON.stringify(drop.metadata.tags || [])
    );

    return id;
  }

  getDeadDrop(dropId: string): DeadDrop | null {
    const stmt = this.db.prepare("SELECT * FROM dead_drops WHERE id = ?");
    const row = stmt.get(dropId);
    return row ? this.rowToDeadDrop(row as any) : null;
  }

  incrementDeadDropDownload(dropId: string) {
    const stmt = this.db.prepare(`
      UPDATE dead_drops 
      SET downloads = downloads + 1 
      WHERE id = ?
    `);
    stmt.run(dropId);
  }

  listDeadDrops(limit: number = 50): DeadDrop[] {
    const stmt = this.db.prepare(`
      SELECT * FROM dead_drops 
      WHERE expires_at > ? AND downloads < max_downloads
      ORDER BY created_at DESC 
      LIMIT ?
    `);

    return stmt.all(Date.now(), limit).map(this.rowToDeadDrop);
  }

  // ============================================================================
  // BOUNTY OPERATIONS
  // ============================================================================

  createBounty(bounty: Omit<Bounty, "id" | "createdAt" | "status" | "submissions">): string {
    const id = nanoid();
    const stmt = this.db.prepare(`
      INSERT INTO bounties (id, title, description, reward, creator, created_at, 
        expires_at, proof_required)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      bounty.title,
      bounty.description,
      bounty.reward,
      bounty.creator,
      Date.now(),
      bounty.expiresAt.getTime(),
      bounty.proofRequired
    );

    return id;
  }

  getBounty(bountyId: string): Bounty | null {
    const stmt = this.db.prepare("SELECT * FROM bounties WHERE id = ?");
    const row = stmt.get(bountyId);
    if (!row) return null;

    const bounty = this.rowToBounty(row as any);
    bounty.submissions = this.getBountySubmissions(bountyId);
    return bounty;
  }

  listBounties(status?: string): Bounty[] {
    const query = status
      ? "SELECT * FROM bounties WHERE status = ? ORDER BY created_at DESC"
      : "SELECT * FROM bounties ORDER BY created_at DESC";

    const stmt = this.db.prepare(query);
    const rows = status ? stmt.all(status) : stmt.all();

    return rows.map((row) => {
      const bounty = this.rowToBounty(row as any);
      bounty.submissions = this.getBountySubmissions(bounty.id);
      return bounty;
    });
  }

  submitBounty(submission: Omit<BountySubmission, "id" | "submittedAt" | "status">): string {
    const id = nanoid();
    const stmt = this.db.prepare(`
      INSERT INTO bounty_submissions (id, bounty_id, submitter, proof, submitted_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(id, submission.bountyId, submission.submitter, submission.proof, Date.now());
    return id;
  }

  getBountySubmissions(bountyId: string): BountySubmission[] {
    const stmt = this.db.prepare(`
      SELECT * FROM bounty_submissions 
      WHERE bounty_id = ? 
      ORDER BY submitted_at DESC
    `);

    return stmt.all(bountyId).map(this.rowToBountySubmission);
  }

  approveBountySubmission(submissionId: string, paymentTxHash: string) {
    const stmt = this.db.prepare(`
      UPDATE bounty_submissions 
      SET status = 'approved', payment_tx_hash = ?
      WHERE id = ?
    `);
    stmt.run(paymentTxHash, submissionId);

    // Update bounty status
    const submission = this.db
      .prepare("SELECT bounty_id FROM bounty_submissions WHERE id = ?")
      .get(submissionId) as any;

    if (submission) {
      this.db
        .prepare("UPDATE bounties SET status = 'completed' WHERE id = ?")
        .run(submission.bounty_id);
    }
  }

  // ============================================================================
  // AI DECK OPERATIONS
  // ============================================================================

  saveAIQuery(query: Omit<AIDeckQuery, "id" | "timestamp">): string {
    const id = nanoid();
    const stmt = this.db.prepare(`
      INSERT INTO ai_deck_queries (id, query, model, max_tokens, user_id, cost, 
        response, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      query.query,
      query.model,
      query.maxTokens,
      query.userId,
      query.cost,
      query.response || null,
      Date.now()
    );

    return id;
  }

  getUserAIQueries(userId: string, limit: number = 20): AIDeckQuery[] {
    const stmt = this.db.prepare(`
      SELECT * FROM ai_deck_queries 
      WHERE user_id = ? 
      ORDER BY timestamp DESC 
      LIMIT ?
    `);

    return stmt.all(userId, limit).map(this.rowToAIDeckQuery);
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private rowToProxyNode(row: any): ProxyNode {
    return {
      id: row.id,
      address: row.address,
      network: row.network,
      reputation: row.reputation,
      totalBytes: row.total_bytes,
      totalSessions: row.total_sessions,
      earnings: row.earnings,
      lastSeen: new Date(row.last_seen),
      region: row.region,
      capabilities: JSON.parse(row.capabilities || "[]"),
    };
  }

  private rowToDeadDrop(row: any): DeadDrop {
    return {
      id: row.id,
      encryptedData: row.encrypted_data,
      price: row.price,
      creator: row.creator,
      createdAt: new Date(row.created_at),
      expiresAt: new Date(row.expires_at),
      downloads: row.downloads,
      maxDownloads: row.max_downloads,
      metadata: {
        size: row.size,
        mimeType: row.mime_type,
        description: row.description,
        tags: JSON.parse(row.tags || "[]"),
      },
    };
  }

  private rowToBounty(row: any): Bounty {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      reward: row.reward,
      creator: row.creator,
      createdAt: new Date(row.created_at),
      expiresAt: new Date(row.expires_at),
      status: row.status,
      submissions: [],
      proofRequired: row.proof_required,
    };
  }

  private rowToBountySubmission(row: any): BountySubmission {
    return {
      id: row.id,
      bountyId: row.bounty_id,
      submitter: row.submitter,
      proof: row.proof,
      submittedAt: new Date(row.submitted_at),
      status: row.status,
      paymentTxHash: row.payment_tx_hash,
    };
  }

  private rowToAIDeckQuery(row: any): AIDeckQuery {
    return {
      id: row.id,
      query: row.query,
      model: row.model,
      maxTokens: row.max_tokens,
      userId: row.user_id,
      cost: row.cost,
      response: row.response,
      timestamp: new Date(row.timestamp),
    };
  }

  close() {
    this.db.close();
  }
}
