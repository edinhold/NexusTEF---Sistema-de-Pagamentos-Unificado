import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";

// Fix: Initializing GoogleGenAI with exactly the named parameter and process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getSmartInsights = async (transactions: Transaction[]) => {
  const prompt = `
    Analise estas transações de um sistema TEF com integração fiscal:
    ${JSON.stringify(transactions)}
    
    Como um consultor especialista em varejo brasileiro (NFC-e e PIX), forneça 3 insights:
    1. Resumo de conversão PIX vs Outros.
    2. Identificação de notas em contingência ou falhas fiscais.
    3. Sugestão estratégica para redução de impostos ou melhoria de checkout.
    
    Escreva de forma executiva, em Português do Brasil, use emojis moderadamente.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // Fix: Access response.text directly (it is a property, not a method)
    return response.text || "Gerando novos insights fiscais...";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Insights temporariamente indisponíveis.";
  }
};