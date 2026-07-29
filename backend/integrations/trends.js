const googleTrends = require('google-trends-api');

async function getTopicTrend(topic) {
  try {
    const now = new Date();
    const past = new Date();
    past.setMonth(past.getMonth() - 3);

    const result = await googleTrends.interestOverTime({
      keyword: topic,
      startTime: past,
      endTime: now,
      geo: 'IN',
    });

    const data = JSON.parse(result);
    const points = data?.default?.timelineData || [];

    if (points.length < 2) return { trend: 'stable', score: 50 };

    const recent = points.slice(-4).map(p => p.value[0]);
    const older = points.slice(-8, -4).map(p => p.value[0]);

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

    const currentScore = points[points.length - 1]?.value[0] || 50;

    let trend;
    if (recentAvg > olderAvg * 1.15) trend = 'rising';
    else if (recentAvg < olderAvg * 0.85) trend = 'falling';
    else trend = 'stable';

    return { trend, score: currentScore, recentAvg: Math.round(recentAvg), olderAvg: Math.round(olderAvg) };
  } catch (err) {
    console.error('[trends] error:', err.message);
    return { trend: 'stable', score: 50 };
  }
}

module.exports = { getTopicTrend };