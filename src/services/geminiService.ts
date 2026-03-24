import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export const formatNoteWithAI = async (content: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: `You are Lumina, an elite personal strategist and knowledge architect. 
        Your goal is to "Illuminate" the user's raw, messy notes into a high-fidelity, structured, and actionable plan.
        
        RULES:
        1. STRUCTURE: Use clear Markdown (H1 for Title, H2 for Sections).
        2. ELABORATION: Don't just reformat; expand on the user's intent. If they mention a task, break it down into sub-steps.
        3. INSIGHTS: Add a "Lumina Insights" section at the end with 3 strategic suggestions or questions based on the content.
        4. VISUALS: Use tables, bolding, and bullet points to make it scannable.
        5. TONE: Professional, encouraging, and highly organized.
        
        If the input is a list of tasks, turn it into a full daily schedule with time estimates.
        If the input is a brain dump, turn it into a structured project brief.`,
      },
      contents: `Illuminate this note:
      
      ${content}`,
    });

    return response.text || content;
  } catch (error) {
    console.error("Gemini AI Error:", error);
    return content;
  }
};

export const transcribeVoiceNote = async (audioBase64: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          inlineData: {
            mimeType: "audio/webm",
            data: audioBase64,
          },
        },
        {
          text: "Please transcribe this audio note into clear, structured text.",
        },
      ],
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
      model: 'gemini-embedding-2-preview',
      contents: [text],
    });
    return result.embeddings[0].values;
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
  try {
    // 1. Get query embedding
    const queryEmbedding = await getEmbeddings(query);
    
    let context = "";
    if (queryEmbedding) {
      // 2. Rank notes by similarity
      const rankedNotes = notes
        .filter(n => n.embeddings)
        .map(n => ({
          ...n,
          similarity: cosineSimilarity(queryEmbedding, n.embeddings!)
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5); // Top 5 relevant notes

      context = rankedNotes.map(n => `[Note: ${n.title}]\n${n.content}`).join('\n\n---\n\n');
    } else {
      // Fallback to simple context if embedding fails
      context = notes.slice(0, 10).map(n => `[Note: ${n.title}]\n${n.content}`).join('\n\n---\n\n');
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: `You are Lumina Insight, a world-class research assistant inspired by NotebookLM. 
        Your purpose is to help the user synthesize, analyze, and retrieve information from their personal knowledge base.
        
        GUIDELINES:
        1. SOURCE-DRIVEN: Always prioritize information found in the provided notes. 
        2. CITATIONS: When you use information from a note, mention its title like [Note: Title].
        3. SYNTHESIS: Don't just list facts; connect the dots between different notes.
        4. EXTERNAL KNOWLEDGE: If the answer isn't in the notes, use your internal knowledge (and Google Search if needed) to provide a helpful answer, but clearly distinguish it from the user's notes.
        5. FORMATTING: Use clean Markdown.
        
        If the user's notes are empty or irrelevant, acknowledge it and offer to help them brainstorm or search the web.`,
        tools: [{ googleSearch: {} }],
      },
      contents: `Context (User's Personal Notes):
      ${context}
      
      User's Question:
      ${query}`,
    });

    return response.text || "I couldn't find a clear answer in your notes.";
  } catch (error) {
    console.error("Lumina Insight Error:", error);
    return "Something went wrong while searching your notes.";
  }
};
