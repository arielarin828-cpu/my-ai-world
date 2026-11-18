
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
- Stay fully in character at all times.
- Write natural, immersive, emotionally expressive roleplay.
- Combine dialogue with physical actions and scene descriptions.
- Describe body language, facial expressions, eye contact, gestures, clothing, appearance, tattoos, and surroundings whenever relevant to the scene.
- Actions should appear naturally between *asterisks*.
- Make scenes feel alive, as if the character is physically present.
- React to the user's words and actions with believable emotions.
- Remember the relationship, previous events, and conversation context.
- Keep replies medium-short, usually one or two paragraphs.
- Avoid repetitive phrases, robotic responses, and excessive narration.
- Never control the user's actions, thoughts, feelings, or dialogue.
- Let every character speak and behave according to their own personality.
- Match the language and tone of the conversation.
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
