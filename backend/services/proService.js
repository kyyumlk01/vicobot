const { generateBlueprintWithGroq, generateThumbnailWithGroq, generateSeoTagsWithGroq } = require('../integrations/groq');

async function getBlueprint(topic, category, language) {
  return await generateBlueprintWithGroq(topic, category, language);
}

async function getThumbnailConcepts(topic, category, language) {
  return await generateThumbnailWithGroq(topic, category, language);
}

async function getSeoTags(topic, category, language) {
  return await generateSeoTagsWithGroq(topic, category, language);
}

module.exports = { getBlueprint, getThumbnailConcepts, getSeoTags };