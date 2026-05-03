import { GoogleGenAI, Modality } from "@google/genai";

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

const ai = createClient();

export async function generateImage(
  prompt: string
): Promise<{ b64_json: string; mimeType: string }> {
  if (!ai) {
    throw new Error("Gemini AI is not configured. Set GEMINI_API_KEY environment secret.");
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    },
  });

  const candidate = response.candidates?.[0];
  const imagePart = candidate?.content?.parts?.find(
    (part: { inlineData?: { data?: string; mimeType?: string } }) => part.inlineData
  );

  if (!imagePart?.inlineData?.data) {
    throw new Error("No image data in response");
  }

  return {
    b64_json: imagePart.inlineData.data,
    mimeType: imagePart.inlineData.mimeType || "image/png",
  };
}
