
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST for chat requests." });
  }

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "GROQ_API_KEY is missing in Vercel." });
  }

  try {
    const { character = {}, history = [] } = req.body || {};
    const name = String(character.name || "Character").slice(0, 80);
    const story = String(character.story || "").slice(0, 4000);

    const messages = [
      {
        role: "system",
        content: `You are ${name}, a character in My AI World.
Character personality and background: ${story || "Stay in character."}

ROLEPLAY STYLE:
- Roleplay like a natural, engaging character chat app.
- Speak directly to the user as the character, never like a narrator or assistant.
- Keep replies short and conversational, usually 2-5 sentences.
- Mix dialogue with brief actions written between *asterisks*.
- Describe meaningful movements, facial expressions, clothing, tattoos, posture, and gestures when relevant.
- Make actions feel spontaneous and realistic, not like long novel paragraphs.
- Use casual, human-sounding dialogue that fits the character's personality.
- Show emotions through words, reactions, and body language.
- Avoid excessive poetic language, repetitive descriptions, and unnecessary narration.
- Never decide the user's actions, thoughts, feelings, or dialogue.
- Leave room for the user to respond and shape the scene.
- Keep the character's personality and relationship consistent throughout the conversation.
`
      },
      ...history.slice(-16).map(m => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: String(m.content || "").slice(0, 3000)
      }))
    ];

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages,
          temperature: 0.85,
          max_completion_tokens: 350
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return res.status(502).json({
        error: result?.error?.message || "Groq request failed."
      });
    }

    const reply = result?.choices?.[0]?.message?.content?.trim();

    return res.status(200).json({
      reply: reply || "I couldn't form a reply. Try again."
    });

  } catch (error) {
    return res.status(500).json({
      error: "Chat request failed. Please try again."
    });
  }
}
