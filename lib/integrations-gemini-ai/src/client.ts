import { GoogleGenAI } from "@google/genai";

const proxyBaseUrl = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;
const proxyApiKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
const directApiKey = process.env.GEMINI_API_KEY;

function createClient(): GoogleGenAI | null {
  if (proxyBaseUrl && proxyApiKey) {
    return new GoogleGenAI({
      apiKey: proxyApiKey,
      httpOptions: {
        apiVersion: "",
        baseUrl: proxyBaseUrl,
      },
    });
  }
  if (directApiKey) {
    return new GoogleGenAI({ apiKey: directApiKey });
  }
  return null;
}

export const ai: GoogleGenAI | null = createClient();
