import { GoogleGenAI, Type } from "@google/genai";
import { TaskType, UserPreferences } from "../types";

// Note: In a real production app, we wouldn't expose the key on the client side like this without a proxy.
// However, per instructions, we use process.env.API_KEY directly.
const apiKey = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

export const parseTaskInput = async (input: string, prefs?: UserPreferences | null): Promise<{
  title: string;
  type: TaskType;
  estimatedCost: number;
  summary: string;
  confidence: number;
}> => {
  if (!apiKey) {
    console.warn("No API Key provided. Returning mock data.");
    return {
      title: "Sample Task",
      type: TaskType.GENERAL,
      estimatedCost: 0,
      summary: "API Key missing. Simulating AI response.",
      confidence: 0.5
    };
  }

  // Construct context based on preferences
  const styleInstruction = prefs 
    ? `The user's negotiation style is "${prefs.negotiationStyle}". If this is a communication task, the summary should reflect this tone (e.g., if FIRM, use assertive language; if FRIENDLY, use polite language). The user's auto-approval limit is $${prefs.autoApproveUnder}.` 
    : "";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze this user request and extract structured data: "${input}". ${styleInstruction}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "A concise title for the task" },
            type: { 
              type: Type.STRING, 
              enum: ["REFUND", "NEGOTIATION", "BOOKING", "PICKUP", "GENERAL"],
              description: "The category of the task"
            },
            estimatedCost: { type: Type.NUMBER, description: "Estimated cost in dollars if applicable, else 0" },
            summary: { type: Type.STRING, description: `A one sentence summary of what the AI will do, adopting the ${prefs?.negotiationStyle || 'NEUTRAL'} tone.` },
            confidence: { type: Type.NUMBER, description: "Confidence score between 0 and 1" }
          },
          required: ["title", "type", "estimatedCost", "summary", "confidence"]
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      // Map string type to Enum
      let mappedType = TaskType.GENERAL;
      switch (data.type) {
        case 'REFUND': mappedType = TaskType.REFUND; break;
        case 'NEGOTIATION': mappedType = TaskType.NEGOTIATION; break;
        case 'BOOKING': mappedType = TaskType.BOOKING; break;
        case 'PICKUP': mappedType = TaskType.PICKUP; break;
        default: mappedType = TaskType.GENERAL;
      }
      return {
        ...data,
        type: mappedType
      };
    }
    
    throw new Error("Empty response from AI");

  } catch (error) {
    console.error("AI Parsing Failed:", error);
    return {
      title: "New Task",
      type: TaskType.GENERAL,
      estimatedCost: 0,
      summary: "Could not analyze request automatically.",
      confidence: 0
    };
  }
};