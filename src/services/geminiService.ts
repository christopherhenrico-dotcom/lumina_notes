import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export const formatNoteWithAI = async (content: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a professional note-taking assistant. Convert the following plain text into a beautifully formatted Markdown note. Use headings, bullet points, bold text, and code blocks where appropriate to make it structured and easy to read. Preserve all the original information but organize it better.

Text to format:
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

export const chatWithNotes = async (query: string, notes: { title: string, content: string }[]) => {
  try {
    const context = notes.map(n => `Title: ${n.title}\nContent: ${n.content}`).join('\n\n---\n\n');
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are Lumina Insight, an AI assistant that helps users understand their own notes. Use the provided context (which are the user's notes) to answer their question. If the answer isn't in the notes, say so politely but try to offer a helpful general perspective if relevant.

Context (User's Notes):
${context}

User Question:
${query}`,
    });

    return response.text || "I couldn't find an answer in your notes.";
  } catch (error) {
    console.error("Lumina Insight Error:", error);
    return "Something went wrong while searching your notes.";
  }
};
