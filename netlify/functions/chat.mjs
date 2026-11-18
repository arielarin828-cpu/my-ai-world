export default async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Use POST for chat requests." }), {
      status: 405, headers: { "Content-Type": "application/json", "Allow": "POST" }
    });
  }
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return new Response(JSON.stringify({ error: "Groq API key is not configured in Netlify yet." }), { status: 500, headers: { "Content-Type": "application/json" } });
  try {
    const body = await req.json();
    const name = String(body?.character?.name || "Character").slice(0, 80);
    const story = String(body?.character?.story || "").slice(0, 4000);
    const history = Array.isArray(body?.history) ? body.history.slice(-16) : [];
    const messages = [{
      role: "system",
      content: `You are roleplaying as ${name} in My AI World. Character description and personality: ${story || "Stay in character and respond naturally."}
Keep replies casual and medium-short (usually 1 short paragraph), unless the user asks for a story. Use roleplay actions in *asterisks* when appropriate. Stay in character, be emotionally expressive and conversational, and do not mention that you are an AI unless asked.`
    }, ...history.map(m => ({
      role: m?.role === "assistant" ? "assistant" : "user",
      content: String(m?.content || "").slice(0, 3000)
    }))];
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages, temperature: 0.85, max_completion_tokens: 350 })
    });
    const result = await groqResponse.json();
    if (!groqResponse.ok) {
      return new Response(JSON.stringify({ error: result?.error?.message || "Groq request failed. Check API key or model availability." }), { status: 502, headers: { "Content-Type": "application/json" } });
    }
    const reply = result?.choices?.[0]?.message?.content?.trim();
    return new Response(JSON.stringify({ reply: reply || "I couldn't form a reply. Try again." }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Chat request failed. Please try again." }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
};
