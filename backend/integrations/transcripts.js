const { YoutubeTranscript } = require('youtube-transcript');

async function getVideoTranscripts(videoIds) {
  const results = [];

  for (const videoId of videoIds.slice(0, 3)) {
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
      if (!transcript?.length) continue;

      const text = transcript
        .map(t => t.text)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 1500);

      results.push({ videoId, text });
      await new Promise(r => setTimeout(r, 300));
    } catch {
      // transcript unavailable — skip silently
    }
  }

  return results;
}

module.exports = { getVideoTranscripts };