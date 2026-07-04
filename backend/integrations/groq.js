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

async function generateBlueprintWithGroq(topic, category, language) {
  const langInstruction = language === 'hindi'
    ? 'Respond in Hindi/Hinglish mixed language.'
    : 'Respond in English.';

  const prompt = `You are an expert YouTube scriptwriter for Indian creators.

Create a detailed video blueprint for this topic and return ONLY a valid JSON object, no markdown, no explanation.

Topic: "${topic}"
Category: ${category}
${langInstruction}

Return exactly this JSON structure:
{
  "hook": "<compelling opening line or question, first 5 seconds>",
  "structure": [
    { "section": "<section name>", "duration": "<estimated duration>", "description": "<what to cover>" },
    { "section": "<section name>", "duration": "<estimated duration>", "description": "<what to cover>" },
    { "section": "<section name>", "duration": "<estimated duration>", "description": "<what to cover>" },
    { "section": "<section name>", "duration": "<estimated duration>", "description": "<what to cover>" },
    { "section": "<section name>", "duration": "<estimated duration>", "description": "<what to cover>" }
  ],
  "cta": "<call to action for end of video>",
  "recommendedLength": "<recommended video length>",
  "toneStyle": "<recommended tone/style for this topic>"
}`;

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 1200,
  });

  const raw = response.choices[0]?.message?.content || '';
  const cleaned = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

async function generateThumbnailWithGroq(topic, category, language) {
  const langInstruction = language === 'hindi'
    ? 'Respond in Hindi/Hinglish mixed language.'
    : 'Respond in English.';

  const prompt = `You are an expert YouTube thumbnail designer for Indian creators.

Generate thumbnail concepts for this topic and return ONLY a valid JSON object, no markdown, no explanation.

Topic: "${topic}"
Category: ${category}
${langInstruction}

Return exactly this JSON structure:
{
  "concepts": [
    {
      "style": "<thumbnail style name>",
      "mainText": "<bold text on thumbnail, max 4 words>",
      "subText": "<smaller supporting text, optional>",
      "visualDescription": "<what the visual/background should look like>",
      "colorScheme": "<recommended colors>",
      "emotion": "<emotion this thumbnail should trigger>"
    },
    {
      "style": "<thumbnail style name>",
      "mainText": "<bold text on thumbnail, max 4 words>",
      "subText": "<smaller supporting text, optional>",
      "visualDescription": "<what the visual/background should look like>",
      "colorScheme": "<recommended colors>",
      "emotion": "<emotion this thumbnail should trigger>"
    },
    {
      "style": "<thumbnail style name>",
      "mainText": "<bold text on thumbnail, max 4 words>",
      "subText": "<smaller supporting text, optional>",
      "visualDescription": "<what the visual/background should look like>",
      "colorScheme": "<recommended colors>",
      "emotion": "<emotion this thumbnail should trigger>"
    }
  ],
  "generalTips": ["<tip 1>", "<tip 2>", "<tip 3>"]
}`;

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
    max_tokens: 1200,
  });

  const raw = response.choices[0]?.message?.content || '';
  const cleaned = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

async function generateSeoTagsWithGroq(topic, category, language) {
  const langInstruction = language === 'hindi'
    ? 'Respond in Hindi/Hinglish mixed language.'
    : 'Respond in English.';

  const prompt = `You are an expert YouTube SEO specialist for Indian creators.

Generate SEO tags and description for this topic and return ONLY a valid JSON object, no markdown, no explanation.

Topic: "${topic}"
Category: ${category}
${langInstruction}

Return exactly this JSON structure:
{
  "tags": ["<tag1>", "<tag2>", "<tag3>", "<tag4>", "<tag5>", "<tag6>", "<tag7>", "<tag8>", "<tag9>", "<tag10>", "<tag11>", "<tag12>", "<tag13>", "<tag14>", "<tag15>"],
  "descriptionTemplate": "<YouTube description template with placeholders like [YOUR LINK], [TIMESTAMP], etc - 150-200 words>",
  "pinnedComment": "<engaging pinned comment to boost engagement>"
}`;

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 1000,
  });

  const raw = response.choices[0]?.message?.content || '';
  const cleaned = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

module.exports = {
  analyzeTopicWithGroq,
  generateBlueprintWithGroq,
  generateThumbnailWithGroq,
  generateSeoTagsWithGroq,
};