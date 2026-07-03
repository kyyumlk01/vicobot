const supabase = require('../integrations/supabase');

async function saveTopicForUser(userId, topic, score, category) {
  const { data: existing } = await supabase
    .from('saved_topics')
    .select('id')
    .eq('user_id', userId)
    .eq('topic', topic)
    .single();

  if (existing) {
    return { alreadySaved: true };
  }

  const { error } = await supabase
    .from('saved_topics')
    .insert({ user_id: userId, topic, score, category });

  if (error) throw new Error('Failed to save topic');

  return { alreadySaved: false };
}

async function getSavedTopics(userId) {
  const { data, error } = await supabase
    .from('saved_topics')
    .select('id, topic, score, category, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) throw new Error('Failed to fetch saved topics');

  return data;
}

async function deleteSavedTopic(userId, topicId) {
  const { error } = await supabase
    .from('saved_topics')
    .delete()
    .eq('id', topicId)
    .eq('user_id', userId);

  if (error) throw new Error('Failed to delete topic');
}

module.exports = { saveTopicForUser, getSavedTopics, deleteSavedTopic };