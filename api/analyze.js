// Vercel serverless function — proxies Gemini API, keeps key secure
// SETUP: Vercel → Settings → Environment Variables → GEMINI_API_KEY

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const { text, funMode } = req.body || {};

    if (!text?.trim()) {
        return res.status(400).json({ error: 'No text provided.' });
    }
    if (text.length > 3000) {
        return res.status(400).json({ error: 'Message too long. Please limit to 3000 characters.' });
    }

    const prompt = `You are an expert communication analyst and emotional intelligence coach.

Analyze the following message and return ONLY a valid JSON object — no markdown, no explanation, just raw JSON.

Message:
"""
${text.replace(/"/g, "'")}
"""

Return this exact JSON structure:
{
  "tone": "choose the single best from: Passive Aggressive, Polite Avoidance, Genuine Appreciation, Angry Customer, Defensive, Manipulative, Corporate Jargon, Friendly, Anxious, Threatening, Sarcastic, Dismissive, Urgent, Professional, Gaslighting",
  "tone_emoji": "single most fitting emoji for this tone",
  "tone_description": "1-2 sentences describing the tone in plain English — be specific and insightful",
  "hidden_meaning": "what the sender probably really means, in conversational plain English — be honest, specific, and a little brave",
  "risk_level": "Low, Medium, or High — based on relationship damage or escalation potential",
  "risk_score": integer from 0 to 100,
  "suggested_reply": "a calm, professional, de-escalating reply the recipient could send — specific and ready to use",
  "rewrite_professional": "rewrite of the original message in clear, formal, professional tone — same intent, better delivery",
  "rewrite_warm": "rewrite in warm, friendly, emotionally intelligent tone — make it feel human",
  "rewrite_direct": "rewrite in confident, direct, no-fluff tone — get to the point without being rude",
  "fun_interpretation": "${funMode ? 'a witty, relatable, humorous translation of what this message REALLY means — be funny, max 2 sentences. Think meme energy.' : ''}"
}

Scoring guide for risk_score:
0-25 = Low (friendly, professional, no tension)
26-55 = Medium (subtle frustration, passive aggression, mild conflict)
56-80 = High (clear anger, threats, escalation signals)
81-100 = Critical (legal threats, abuse, severe escalation)`;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: funMode ? 0.85 : 0.2,
                        maxOutputTokens: 1024,
                    },
                }),
            }
        );

        if (!response.ok) {
            const err = await response.text();
            console.error('[ReadTheRoom] Gemini error:', err);
            throw new Error('Gemini API error');
        }

        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        // Extract JSON from response (handles markdown code blocks)
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON in Gemini response');

        const result = JSON.parse(jsonMatch[0]);

        // Validate required fields
        if (!result.tone || !result.risk_level) throw new Error('Incomplete response');

        return res.status(200).json(result);

    } catch (err) {
        console.error('[ReadTheRoom] Error:', err.message);
        return res.status(500).json({ error: 'Analysis failed. Please try again.' });
    }
}
