import { GoogleGenAI, Type } from "@google/genai";
import { TaskType, UserPreferences } from "../types";

// MATCHING VITE CONFIG: Ensure we use the exact variable name defined in vite.config.ts
const apiKey = process.env.GEMINI_API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

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
  if (!apiKey) {
    console.warn("No GEMINI_API_KEY provided. Returning mock data.");
    // Fail-safe mock for review mode if API key is missing
    return {
      title: "Sample Task (No API Key)",
      type: TaskType.GENERAL,
      estimatedCost: 0,
      summary: "Please configure GEMINI_API_KEY to enable real AI analysis.",
      confidence: 0
    };
  }

  // Construct context based on preferences
  const styleInstruction = prefs 
    ? `The user's negotiation style is "${prefs.negotiationStyle}". Auto-approval limit is $${prefs.autoApproveUnder}.` 
    : "";

  try {
    // Construct the parts array for Multimodal (Text + Optional Image)
    const parts: any[] = [];
    
    // 1. Add Image if present
    if (imageBase64) {
      // Remove data URL header if present (e.g., "data:image/jpeg;base64,")
      const cleanBase64 = imageBase64.split(',')[1] || imageBase64;
      parts.push({
        inlineData: {
          mimeType: "image/jpeg", // Assuming JPEG for simplicity, Gemini handles most standard formats
          data: cleanBase64
        }
      });
      parts.push({ text: "Analyze this image and the user's request. Identify any items, dates, or costs visible." });
    }

    // 2. Add Text Prompt
    parts.push({ 
      text: `Analyze this request and extract structured data: "${input}". ${styleInstruction}` 
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts }, // Pass the array of parts
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
      let mappedType = TaskType.GENERAL;
      switch (data.type) {
        case 'REFUND': mappedType = TaskType.REFUND; break;
        case 'NEGOTIATION': mappedType = TaskType.NEGOTIATION; break;
        case 'BOOKING': mappedType = TaskType.BOOKING; break;
        case 'PICKUP': mappedType = TaskType.PICKUP; break;
        default: mappedType = TaskType.GENERAL;
      }
      return { ...data, type: mappedType };
    }
    
    throw new Error("Empty response from AI");

  } catch (error) {
    console.error("AI Parsing Failed:", error);
    return {
      title: "New Task",
      type: TaskType.GENERAL,
      estimatedCost: 0,
      summary: "Could not analyze request. Please try again.",
      confidence: 0
    };
  }
};