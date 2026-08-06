import { GoogleGenAI, type Content, type Tool } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_API_KEY,
})

export async function generateResponse(content:Content[], tools:Tool[]) {
  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash", 
    contents: content,
    config:{
      tools: tools
    }
  });

  return response
}