import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("[AI] GEMINI_API_KEY is not set!");
}
const ai = new GoogleGenAI({ apiKey: apiKey as string });

export const formatNoteWithAI = async (content: string) => {
  if (!apiKey) {
    console.error("[AI] Cannot call API: GEMINI_API_KEY is not configured");
    throw new Error("Gemini API key is not configured");
  }
  
  if (!content.trim()) {
    return content;
  }
  
  try {
    const systemPrompt = `You are Lumina, an elite personal strategist and knowledge architect. 
Your goal is to "Illuminate" the user's raw, messy notes into a high-fidelity, structured, and actionable plan.

RULES:
1. STRUCTURE: Use clear Markdown (H1 for Title, H2 for Sections).
2. ELABORATION: Don't just reformat; expand on the user's intent. If they mention a task, break it down into sub-steps.
3. INSIGHTS: Add a "Lumina Insights" section at the end with 3 strategic suggestions or questions based on the content.
4. VISUALS: Use emojis, tables, bolding, and bullet points to make it scannable and visually appealing.
5. TONE: Professional, encouraging, and highly organized.

If the input is a list of tasks, turn it into a full daily schedule with time estimates and emojis for each task type.
If the input is a brain dump, turn it into a structured project brief with clear sections.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{
        role: "user",
        parts: [{ text: systemPrompt }]
      }, {
        role: "model",
        parts: [{ text: "I'll illuminate your notes into beautifully formatted, actionable plans!" }]
      }, {
        role: "user",
        parts: [{ text: `Illuminate this note:\n\n${content}` }]
      }],
    });

    if (!response.candidates || response.candidates.length === 0) {
      console.error("[AI] No candidates in response:", response);
      return content;
    }

    const text = response.text;
    if (!text) {
      console.error("[AI] Response has no text:", response);
      return content;
    }
    
    return text;
  } catch (error) {
    console.error("[AI] Gemini AI Error:", error);
    throw error;
  }
};

export const transcribeVoiceNote = async (audioBase64: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{
        role: "user",
        parts: [
          { inlineData: { mimeType: "audio/webm", data: audioBase64 } },
          { text: "Please transcribe this audio note into clear, structured text." }
        ]
      }],
    });

    return response.text || "";
  } catch (error) {
    console.error("Gemini AI Transcription Error:", error);
    return "";
  }
};

export const getEmbeddings = async (text: string) => {
  try {
    const result = await ai.models.embedContent({
      model: 'text-embedding-004',
      contents: [{
        role: 'user',
        parts: [{ text }],
      }],
    });
    return result.embeddings?.[0]?.values || null;
  } catch (error) {
    console.error("Gemini Embedding Error:", error);
    return null;
  }
};

const cosineSimilarity = (vecA: number[], vecB: number[]) => {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
};

export const chatWithNotes = async (query: string, notes: any[]) => {
  if (!apiKey) {
    console.error("[RAG] Cannot call API: GEMINI_API_KEY is not configured");
    return "Gemini API key is not configured. Please check your settings.";
  }
  
  try {
    const queryEmbedding = await getEmbeddings(query);
    
    let context = "";
    if (queryEmbedding && notes.some(n => n.embeddings)) {
      const rankedNotes = notes
        .filter(n => n.embeddings && n.embeddings.length > 0)
        .map(n => ({
          ...n,
          similarity: cosineSimilarity(queryEmbedding, n.embeddings!)
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5);

      context = rankedNotes.map(n => `[Note: ${n.title}]\n${n.content}`).join('\n\n---\n\n');
    } else if (notes.length > 0) {
      context = notes.slice(0, 10).map(n => `[Note: ${n.title}]\n${n.content}`).join('\n\n---\n\n');
    }

    if (!context) {
      return "Your knowledge base is empty. Create some notes first, and I'll be able to help you explore them!";
    }

    const systemPrompt = `You are Lumina Insight, a world-class research assistant inspired by NotebookLM. 
Your purpose is to help the user synthesize, analyze, and retrieve information from their personal knowledge base.

GUIDELINES:
1. SOURCE-DRIVEN: Always prioritize information found in the provided notes. 
2. CITATIONS: When you use information from a note, mention its title like [Note: Title].
3. SYNTHESIS: Don't just list facts; connect the dots between different notes.
4. EXTERNAL KNOWLEDGE: If the answer isn't in the notes, use your internal knowledge to provide a helpful answer, but clearly distinguish it from the user's notes.
5. FORMATTING: Use clean Markdown with emojis where appropriate.

If the user's notes are empty or irrelevant, acknowledge it and offer to help them brainstorm.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{
        role: "user",
        parts: [{ text: systemPrompt }]
      }, {
        role: "user",
        parts: [{ text: `Context (User's Personal Notes):
${context}

User's Question:
${query}` }]
      }],
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    return response.text || "I couldn't find a clear answer in your notes.";
  } catch (error) {
    console.error("[RAG] Lumina Insight Error:", error);
    return "Something went wrong while searching your notes. Please try again.";
  }
};
