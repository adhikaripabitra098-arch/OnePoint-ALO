import { TaskType, UserPreferences } from "../types";

// Key removed for security as requested.
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

export const parseTaskInputOpenAI = async (input: string, prefs?: UserPreferences | null): Promise<{
  title: string;
  type: TaskType;
  estimatedCost: number;
  summary: string;
  confidence: number;
}> => {
  if (!OPENAI_API_KEY) {
    console.warn("No OpenAI API Key provided.");
    return {
      title: "New Task",
      type: TaskType.GENERAL,
      estimatedCost: 0,
      summary: "AI Key missing. Please provide key to analyze.",
      confidence: 0
    };
  }

  // Construct context based on preferences
  const styleInstruction = prefs 
    ? `The user's negotiation style is "${prefs.negotiationStyle}". If the task involves communication, reflect this tone (e.g., FIRM = assertive, FRIENDLY = polite).` 
    : "Use a neutral, professional tone.";

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", 
        messages: [
          {
            role: "system",
            content: `You are an AI assistant for a life OS app. Analyze the user's request and return a JSON object with the following fields:
            - title: A concise title.
            - type: One of ["REFUND", "NEGOTIATION", "BOOKING", "PICKUP", "GENERAL"].
            - estimatedCost: A number representing cost in dollars (0 if none or unknown).
            - summary: A short summary of the action. ${styleInstruction}
            - confidence: A number between 0 and 1 indicating certainty.
            
            Return ONLY valid JSON, no markdown formatting.`
          },
          {
            role: "user",
            content: input
          }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message.content) {
      let content = data.choices[0].message.content;
      content = content.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const parsed = JSON.parse(content);
      
      let mappedType = TaskType.GENERAL;
      switch (parsed.type?.toUpperCase()) {
        case 'REFUND': mappedType = TaskType.REFUND; break;
        case 'NEGOTIATION': mappedType = TaskType.NEGOTIATION; break;
        case 'BOOKING': mappedType = TaskType.BOOKING; break;
        case 'PICKUP': mappedType = TaskType.PICKUP; break;
        default: mappedType = TaskType.GENERAL;
      }

      return {
        title: parsed.title || "New Task",
        type: mappedType,
        estimatedCost: Number(parsed.estimatedCost) || 0,
        summary: parsed.summary || "No summary provided",
        confidence: Number(parsed.confidence) || 0.5
      };
    }

    throw new Error("Invalid response structure from OpenAI");

  } catch (error) {
    console.error("OpenAI Analysis Failed:", error);
    return {
      title: "New Task",
      type: TaskType.GENERAL,
      estimatedCost: 0,
      summary: "Could not analyze request via OpenAI.",
      confidence: 0
    };
  }
};