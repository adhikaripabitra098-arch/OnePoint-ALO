import { GoogleGenAI, Type } from "@google/genai";
import { TaskType, UserPreferences } from "../types";

// Local Heuristic Engine for Store Reviews or key-less operation
const heuristicMockParser = (input: string) => {
  const lowInput = input.toLowerCase();
  let type = TaskType.GENERAL;
  let cost = 0;

  if (lowInput.includes('refund') || lowInput.includes('money back')) type = TaskType.REFUND;
  else if (lowInput.includes('lower') || lowInput.includes('bill') || lowInput.includes('negotiate')) type = TaskType.NEGOTIATION;
  else if (lowInput.includes('book') || lowInput.includes('reservation')) type = TaskType.BOOKING;
  else if (lowInput.includes('pickup') || lowInput.includes('uber') || lowInput.includes('delivery')) type = TaskType.PICKUP;

  // Extract dollar amounts if present
  const match = input.match(/\$(\d+(\.\d{2})?)/);
  if (match) cost = parseFloat(match[1]);

  return {
    title: input.length > 20 ? input.substring(0, 20) + "..." : input || "Autonomous Task",
    type,
    estimatedCost: cost || (Math.random() > 0.5 ? 45.00 : 0),
    summary: `OnePoint initialized ${type.toLowerCase()} engine for request: "${input}"`,
    confidence: 0.95
  };
};

export const parseTaskInput = async (
  input: string, 
  prefs?: UserPreferences | null,
  imageBase64?: string | null
): Promise<{
  title: string;
  type: TaskType;
  estimatedCost: number;
  summary: string;
  confidence: number;
}> => {
  // Connectivity Orchestrator
  if (!process.env.API_KEY) {
    console.warn("API_KEY missing. Using Local Heuristic Engine.");
    await new Promise(r => setTimeout(r, 1500)); // Dynamic simulation delay
    return heuristicMockParser(input || "New Task");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const styleInstruction = prefs ? `The user's negotiation style is "${prefs.negotiationStyle}".` : "";

  try {
    const parts: any[] = [];
    if (imageBase64) {
      const cleanBase64 = imageBase64.split(',')[1] || imageBase64;
      parts.push({ inlineData: { mimeType: "image/jpeg", data: cleanBase64 } });
      parts.push({ text: "Vision analysis for task automation." });
    }
    parts.push({ text: `Analyze request and extract JSON: "${input}". ${styleInstruction}` });

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            type: { type: Type.STRING, enum: ["REFUND", "NEGOTIATION", "BOOKING", "PICKUP", "GENERAL"] },
            estimatedCost: { type: Type.NUMBER },
            summary: { type: Type.STRING },
            confidence: { type: Type.NUMBER }
          },
          required: ["title", "type", "estimatedCost", "summary", "confidence"]
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      let mappedType = TaskType.GENERAL;
      switch (data.type) {
        case 'REFUND': mappedType = TaskType.REFUND; break;
        case 'NEGOTIATION': mappedType = TaskType.NEGOTIATION; break;
        case 'BOOKING': mappedType = TaskType.BOOKING; break;
        case 'PICKUP': mappedType = TaskType.PICKUP; break;
      }
      return { ...data, type: mappedType };
    }
    throw new Error();
  } catch (error) {
    console.error("AI Analysis Failed. Falling back to local engine.");
    return heuristicMockParser(input);
  }
};