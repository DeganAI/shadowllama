// src/client.ts
import { config } from "dotenv";
import type { Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { decodeXPaymentResponse, wrapFetchWithPayment } from "x402-fetch";

config();

const SERVICE_URL = process.env.SERVICE_URL || "http://localhost:3000";
const PRIVATE_KEY = process.env.PRIVATE_KEY as Hex;

if (!PRIVATE_KEY) {
  console.error("❌ Missing PRIVATE_KEY in .env");
  process.exit(1);
}

const account = privateKeyToAccount(PRIVATE_KEY);
const fetchWithPayment = wrapFetchWithPayment(fetch, account);

console.log("🦙 ShadowLlama Test Client");
console.log("💰 Account:", account.address);
console.log("🌐 Service:", SERVICE_URL);

async function testProxyStream() {
  console.log("\n🔒 Testing Proxy Stream ($0.05)...");
  
  const response = await fetchWithPayment(`${SERVICE_URL}/service/proxy-stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      targetUrl: "https://example.onion",
      network: "tor",
      duration: 300,
    }),
  });

  const result = await response.json();
  console.log("✓ Session:", result.sessionId);
  console.log("✓ Node:", result.selectedNode.id, "-", result.selectedNode.region);
  console.log("✓ Cost:", result.estimatedCost);

  const paymentInfo = decodeXPaymentResponse(response.headers.get("x-payment-response") || "");
  if (paymentInfo) {
    console.log("💳 Tx:", paymentInfo.transaction);
  }
}

async function testDeadDrop() {
  console.log("\n📦 Testing Dead Drop ($0.10)...");
  
  const createResponse = await fetchWithPayment(`${SERVICE_URL}/service/create-dead-drop`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      encryptedData: Buffer.from("Secret whistleblower data").toString("base64"),
      price: 0.05,
      expiresInHours: 24,
      maxDownloads: 10,
      description: "Confidential corporate documents",
    }),
  });

  const created = await createResponse.json();
  console.log("✓ Created drop:", created.dropId);
  console.log("✓ Price:", created.price);
  console.log("✓ Expires:", created.expiresAt);
}

async function runTests() {
  try {
    // Health check (free)
    console.log("\n❤️  Health Check (FREE)...");
    const health = await fetch(`${SERVICE_URL}/health`).then(r => r.json());
    console.log("✓ Status:", health.status);

    // Service info (free)
    console.log("\nℹ️  Service Info (FREE)...");
    const info = await fetch(`${SERVICE_URL}/`).then(r => r.json());
    console.log("✓ Name:", info.name);
    console.log("✓ Endpoints:", Object.keys(info.endpoints).length);

    // Paid tests
    await testProxyStream();
    await testDeadDrop();

    console.log("\n✅ All tests passed! ShadowLlama is operational.");
  } catch (error: any) {
    console.error("\n❌ Test failed:", error.message);
    if (error.cause) console.error("Cause:", error.cause);
  }
}

const mode = process.argv[2];

if (mode === "examples") {
  runTests();
} else {
  console.log("Usage: bun run src/client.ts examples");
}
