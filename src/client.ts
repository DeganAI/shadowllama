// client.ts
import { config } from "dotenv";
import type { Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { decodeXPaymentResponse, wrapFetchWithPayment } from "x402-fetch";

config();

const SERVICE_URL = process.env.SERVICE_URL || "http://localhost:4021";
const PRIVATE_KEY = process.env.PRIVATE_KEY as Hex;

if (!PRIVATE_KEY) {
  console.error("Missing PRIVATE_KEY environment variable");
  process.exit(1);
}

const account = privateKeyToAccount(PRIVATE_KEY);
const fetchWithPayment = wrapFetchWithPayment(fetch, account);

console.log("🦙 ShadowLlama Client");
console.log("💰 Account:", account.address);
console.log("🌐 Service:", SERVICE_URL);

async function testProxyStream() {
  console.log("\n🔒 Testing Proxy Stream...");
  
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
  console.log("✓ Response:", result);

  const paymentInfo = decodeXPaymentResponse(response.headers.get("x-payment-response") || "");
  console.log("💳 Payment:", paymentInfo);
}

async function testDeadDrop() {
  console.log("\n📦 Testing Dead Drop...");
  
  // Create
  const createResponse = await fetchWithPayment(`${SERVICE_URL}/service/create-dead-drop`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      encryptedData: "U2VjcmV0IERhdGE=",
      price: 0.05,
      expiresInHours: 24,
      description: "Test encrypted payload",
    }),
  });

  const created = await createResponse.json();
  console.log("✓ Created:", created.dropId);

  // List
  const listResponse = await fetchWithPayment(`${SERVICE_URL}/service/list-dead-drops`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ limit: 10 }),
  });

  const list = await listResponse.json();
  console.log("✓ Listed:", list.total, "drops");
}

async function runTests() {
  try {
    await testProxyStream();
    await testDeadDrop();
    console.log("\n✅ All tests passed!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

runTests();
