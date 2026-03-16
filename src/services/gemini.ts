import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getMiningInsights(stats: { hashrate: number; efficiency: number; temperature: number }) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `As an AI Mining Assistant, analyze these current mining stats: 
      Hashrate: ${stats.hashrate} TH/s
      Efficiency: ${stats.efficiency}%
      Temperature: ${stats.temperature}°C
      
      Provide a short, punchy insight (max 2 sentences) about the current mining state and a "pro tip" for optimization.`,
    });
    return response.text;
  } catch (error) {
    console.error("Error fetching mining insights:", error);
    return "AI insights currently unavailable. Keep mining!";
  }
}
