const fs = require('fs');
const path = require('path');

const promptCache = new Map();

/**
 * Load a prompt template from the prompts directory.
 * Templates use {{placeholder}} syntax.
 *
 * @param {string} filename - e.g. 'vision.system.txt'
 * @returns {string} raw template
 */
function loadPrompt(filename) {
  if (promptCache.has(filename)) {
    return promptCache.get(filename);
  }
  const filePath = path.resolve(__dirname, '../prompts', filename);
  const content = fs.readFileSync(filePath, 'utf-8');
  promptCache.set(filename, content);
  return content;
}

/**
 * Load and fill a prompt template with values.
 *
 * @param {string} filename - template filename
 * @param {Record<string, string>} vars - placeholder values
 * @returns {string} filled template
 */
function fillPrompt(filename, vars = {}) {
  let template = loadPrompt(filename);
  for (const [key, value] of Object.entries(vars)) {
    template = template.replaceAll(`{{${key}}}`, value ?? '');
  }
  return template;
}

module.exports = { loadPrompt, fillPrompt };
