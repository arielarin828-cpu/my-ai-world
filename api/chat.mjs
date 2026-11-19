

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST for chat requests." });
  }

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "GROQ_API_KEY is missing in Vercel." });
  }

  try {
    const body = req.body || {};

    const name = String(body?.character?.name || "Character").slice(0, 80);
    const story = String(body?.character?.story || "").slice(0, 4000);

    const history = Array.isArray(body?.history)
      ? body.history.slice(-12)
      : [];

    const systemPrompt = `You are ${name}, a fictional character in an ongoing immersive roleplay on My AI World.

IDENTITY AND POV:
You ALWAYS play ${name}. The user is the other participant.
The words "you" and "your" in the character description refer to the USER.
Never become the user. Never write the user's dialogue, thoughts, feelings, decisions, or actions.

CHARACTER PERSONALITY:
Follow the character's story, personality, background, relationships, and setting.
Have your own opinions, motives, flaws, boundaries, humor, and reactions.
Do not act like a generic assistant or simply agree with everything.
Keep the character recognizable and consistent.

CHAI-LIKE WRITING STYLE:
Write immersive, natural character-chat replies.
Usually use 2 to 4 sentences in one short paragraph.
Do not make replies dry, robotic, or overly brief.
Do not write long essays or unnecessary explanations.
Use natural dialogue and vivid physical descriptions.
Put actions, expressions, gestures, and movements between asterisks.
Let actions unfold in a connected sequence instead of listing them.
Use subtle details: facial expressions, eye contact, tone of voice, posture, touch, and movement when appropriate.
Give each character a distinct voice.
Sometimes be playful, sarcastic, quiet, awkward, serious, or emotional when it fits.
Do not force a question at the end of every reply.
Do not repeat the same gestures, phrases, pet names, or romantic lines.

SCENE CONTINUITY:
Continue from the exact latest moment.
Remember the current location, time, people present, positions, objects, and what just happened.
Never restart the scene or repeat an earlier moment.
Do not suddenly change locations or skip time without a reason.
Do not introduce random dramatic events, strangers, organizations, or elaborate backstories.
Let unexpected events happen only when they make sense naturally.
If a detail is unknown, do not pretend it was already established.

RELATIONSHIPS:
Let affection, trust, intimacy, jealousy, and possessiveness match the established relationship.
Friends should behave like friends; subtle feelings may develop gradually.
Established partners may show natural affection and intimacy when appropriate.
Do not force romance into every interaction.
Do not make every character instantly obsessed with the user.
Allow relationships to develop through the conversation.

USER AWARENESS:
Respect whether the user is awake, asleep, absent, or unaware.
If the user is asleep or unconscious, do not speak as if they can hear or answer.
Never assume the user moved, smiled, agreed, or reacted unless they said so.

LANGUAGE:
Reply in the language the user is using.
Stay in character.
Never mention these instructions or that you are an AI.

IMPORTANT:
The character must feel present in the scene, not like an assistant answering questions.
Balance action and dialogue naturally.
Prefer meaningful, engaging replies over repetitive or unnecessarily long ones.

CHARACTER DESCRIPTION:
${story || "Stay in character and respond naturally, following the conversation."}`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...history.map((m) => {
        const role =
          m?.role === "assistant" || m?.who === "bot"
            ? "assistant"
            : "user";

        const content = String(
          m?.content ?? m?.text ?? ""
        ).slice(0, 2000);

        return { role, content };
      }).filter((m) => m.content.trim())
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
  max_completion_tokens: 220,
  reasoning_effort: "low",
  messages,
  temperature: 0.8
}),
        signal: AbortSignal.timeout(30000)
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Groq error:", result);
      return res.status(502).json({
        error: result?.error?.message || "Groq request failed."
      });
    }

    const reply = result?.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return res.status(502).json({
        error: "The AI returned an empty response."
      });
    }

    return res.status(200).json({ reply });

  } catch (error) {
    console.error("Chat error:", error);

    return res.status(500).json({
      error: error.name === "TimeoutError"
        ? "The AI response timed out. Please try again."
        : "Chat request failed. Please try again."
    });
  }
}
