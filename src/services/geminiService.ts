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
