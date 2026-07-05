const supabase = require('../integrations/supabase');

async function handleCreateShare(req, res) {
  const { topic, score, category, competitionLevel, expectedViewsMin, expectedViewsMax, verdict } = req.body;

  if (!topic || score === undefined || !category) {
    return res.status(400).json({ error: 'topic, score, and category are required' });
  }

  try {
    const { data, error } = await supabase
      .from('shared_results')
      .insert({
        topic,
        score,
        category,
        competition_level: competitionLevel,
        expected_views_min: expectedViewsMin,
        expected_views_max: expectedViewsMax,
        verdict,
      })
      .select('id')
      .single();

    if (error) throw error;

    return res.status(200).json({ shareId: data.id });
  } catch (err) {
    console.error('[shareController] create error:', err.message);
    return res.status(500).json({ error: 'Failed to create share' });
  }
}

async function handleGetShare(req, res) {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from('shared_results')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Shared result not found' });
    }

    return res.status(200).json({ result: data });
  } catch (err) {
    console.error('[shareController] get error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch shared result' });
  }
}

module.exports = { handleCreateShare, handleGetShare };