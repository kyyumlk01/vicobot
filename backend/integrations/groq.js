const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const ANGLES = [
  'Focus on a unique beginner-friendly angle that most creators miss.',
  'Focus on a controversial or counterintuitive take on this topic.',
  'Focus on the most trending and viral potential angle for this topic.',
];

async function analyzeTopicWithGroq(topic, category, language, variation = 0) {
  const langInstruction = language === 'hindi'
    ? 'Respond in Hindi/Hinglish mixed language.'
    : 'Respond in English.';

  const angleHint = ANGLES[variation % ANGLES.length];

  const prompt = `You are an expert YouTube content strategist for Indian creators.

Analyze this YouTube topic and return ONLY a valid JSON object, no markdown, no explanation.

Topic: "${topic}"
Category: ${category}
Angle: ${angleHint}
${langInstruction}

Return exactly this JSON structure:
{
  "demandScore": <number 0-100>,
  "expectedViewsMin": <number>,
  "expectedViewsMax": <number>,
  "competitionLevel": "<Easy|Medium|Hard>",
  "uploadDay": "<best day to upload>",
  "uploadTime": "<best time like 6-8 PM>",
  "analysis": "<2-3 sentences about why this topic has potential>",
  "contentGaps": ["<gap 1>", "<gap 2>", "<gap 3>"],
  "titleIdeas": ["<title 1>", "<title 2>", "<title 3>", "<title 4>", "<title 5>"],
  "verdict": "<1 sentence final recommendation>"
}`;

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7 + variation * 0.1,
    max_tokens: 1000,
  });

  const raw = response.choices[0]?.message?.content || '';
  const cleaned = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

module.exports = { analyzeTopicWithGroq };