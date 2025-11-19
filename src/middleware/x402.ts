// src/middleware/x402.ts
import { config } from "../config/index.js";

export interface PaymentRequirementOptions {
  amount: number;
  description: string;
}

/**
 * Middleware to require x402 payment for an endpoint
 * Handles both GET and POST - returns 402 if no payment provided
 */
export function requirePayment(options: PaymentRequirementOptions) {
  return async (c: any, next: any) => {
    const paymentProof = c.req.header("x-payment-proof") || c.req.header("x-payment");
    
    // If no payment, return 402 with full x402 schema (for both GET and POST)
    if (!paymentProof) {
      const protocol = c.req.header("x-forwarded-proto") || "https";
      const host = c.req.header("host") || "";
      const fullUrl = `${protocol}://${host}${c.req.path}`;
      
      const microAmount = Math.floor(options.amount * 1_000_000).toString();
      
      return c.json(
        {
          x402Version: 1,
          error: "Payment Required",
          accepts: [
            {
              scheme: "exact",
              network: "base",
              maxAmountRequired: microAmount,
              resource: fullUrl,
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
                      properties: {
                        targetUrl: {
                          type: "string",
                          required: false,
                          description: "Target URL (for proxy)",
                        },
                        network: {
                          type: "string",
                          required: false,
                          description: "Network type (tor/i2p/clearnet)",
                          enum: ["tor", "i2p", "clearnet"],
                        },
                        duration: {
                          type: "number",
                          required: false,
                          description: "Duration in seconds",
                        },
                        encryptedData: {
                          type: "string",
                          required: false,
                          description: "Encrypted data for dead drops",
                        },
                        dropId: {
                          type: "string",
                          required: false,
                          description: "Dead drop ID",
                        },
                        title: {
                          type: "string",
                          required: false,
                          description: "Bounty title",
                        },
                        reward: {
                          type: "number",
                          required: false,
                          description: "Bounty reward amount",
                        },
                        query: {
                          type: "string",
                          required: false,
                          description: "AI query text",
                        },
                        model: {
                          type: "string",
                          required: false,
                          description: "AI model to use",
                          enum: ["claude", "gpt4", "gemini"],
                        },
                      },
                    },
                  },
                },
                output: {
                  output: {
                    type: "object",
                    description: "Response data from the endpoint",
                    properties: {
                      sessionId: { type: "string" },
                      dropId: { type: "string" },
                      bountyId: { type: "string" },
                      message: { type: "string" },
                    },
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
    console.log(`✅ Payment received for ${c.req.path}`);
    await next();
  };
}
