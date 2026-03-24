const API_KEY = process.env.OPEN_ROUTER_API_KEY;
const BASE_URL = "https://openrouter.ai/api/v1";

if (!API_KEY) {
  console.error("[AI] OPEN_ROUTER_API_KEY is not set!");
}

const RATE_LIMIT_WINDOW = 60000;
const MAX_REQUESTS = 5;
const requestTimestamps: number[] = [];

const checkRateLimit = () => {
  const now = Date.now();
  const recentRequests = requestTimestamps.filter(t => now - t < RATE_LIMIT_WINDOW);
  requestTimestamps.length = 0;
  requestTimestamps.push(...recentRequests);
  
  if (requestTimestamps.length >= MAX_REQUESTS) {
    const oldestRequest = requestTimestamps[0];
    const waitTime = Math.ceil((oldestRequest + RATE_LIMIT_WINDOW - now) / 1000);
    throw new Error(`Rate limit reached. Please wait ${waitTime} seconds.`);
  }
  
  requestTimestamps.push(now);
};

const chatCompletion = async (messages: { role: string; content: string }[], model = "anthropic/claude-3-haiku") => {
  if (!API_KEY) {
    throw new Error("OpenRouter API key is not configured");
  }

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
};

export const formatNoteWithAI = async (content: string) => {
  if (!API_KEY) {
    console.error("[AI] Cannot call API: OPEN_ROUTER_API_KEY is not configured");
    throw new Error("OpenRouter API key is not configured");
  }
  
  if (!content.trim()) {
    return content;
  }
  
  checkRateLimit();
  
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

    const text = await chatCompletion([
      { role: "system", content: systemPrompt },
      { role: "user", content: `Illuminate this note:\n\n${content}` },
    ]);

    return text || content;
  } catch (error) {
    console.error("[AI] OpenRouter Error:", error);
    throw error;
  }
};

export const transcribeVoiceNote = async (audioBase64: string) => {
  try {
    const text = await chatCompletion([
      { role: "user", content: `[Audio data: ${audioBase64.substring(0, 100)}...] Please transcribe this audio note into clear, structured text.` },
    ], "anthropic/claude-3-haiku");
    return text || "";
  } catch (error) {
    console.error("Voice Transcription Error:", error);
    return "";
  }
};

export const getEmbeddings = async (text: string): Promise<number[] | null> => {
  return null;
};

export const chatWithNotes = async (query: string, notes: any[]) => {
  if (!API_KEY) {
    console.error("[RAG] Cannot call API: OPEN_ROUTER_API_KEY is not configured");
    return "OpenRouter API key is not configured. Please check your settings.";
  }
  
  try {
    checkRateLimit();
    
    let context = "";
    if (notes.length > 0) {
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

    const text = await chatCompletion([
      { role: "system", content: systemPrompt },
      { role: "user", content: `Context (User's Personal Notes):
${context}

User's Question:
${query}` },
    ]);

    return text || "I couldn't find a clear answer in your notes.";
  } catch (error) {
    console.error("[RAG] Lumina Insight Error:", error);
    return "Something went wrong while searching your notes. Please try again.";
  }
};
