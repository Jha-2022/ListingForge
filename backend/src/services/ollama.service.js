const { env } = require('../config/env');
const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

const OLLAMA_BASE = env.OLLAMA_BASE_URL;

/**
 * Check if Ollama is reachable and the configured model is available.
 * @returns {Promise<{ollamaRunning: boolean, modelAvailable: boolean, models: string[], configuredModel: string}>}
 */
async function checkStatus() {
  const result = {
    ollamaRunning: false,
    modelAvailable: false,
    models: [],
    configuredModel: env.VLM_MODEL,
  };

  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`);
    if (!res.ok) return result;
    result.ollamaRunning = true;

    const data = await res.json();
    result.models = (data.models || []).map((m) => m.name);
    result.modelAvailable = result.models.some(
      (m) => m === env.VLM_MODEL || m.startsWith(`${env.VLM_MODEL}:`) || env.VLM_MODEL.startsWith(m)
    );
  } catch (err) {
    logger.warn({ error: err.message }, 'Ollama not reachable');
  }

  return result;
}

/**
 * Send a chat completion request to Ollama.
 * @param {object} options
 * @param {Array<{role: string, content: string, images?: string[]}>} options.messages
 * @param {object} [options.format] - JSON schema for structured output
 * @param {number} [options.temperature=0.7]
 * @returns {Promise<string>} the assistant's response content
 */
async function chat({ messages, format, temperature = 0.7 }) {
  const body = {
    model: env.VLM_MODEL,
    messages,
    stream: false,
    options: {
      temperature,
      num_predict: 4096,
    },
  };

  if (format) {
    body.format = format;
  }

  logger.debug({ model: env.VLM_MODEL, messageCount: messages.length }, 'Sending chat request to Ollama');

  let res;
  try {
    res = await fetch(`${OLLAMA_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new AppError(`Cannot connect to Ollama at ${OLLAMA_BASE}: ${err.message}`, 502);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error');
    throw new AppError(`Ollama returned ${res.status}: ${text}`, 502);
  }

  const data = await res.json();
  const content = data.message?.content;

  if (!content) {
    throw new AppError('Ollama returned an empty response', 502);
  }

  logger.debug({ responseLength: content.length, totalDuration: data.total_duration }, 'Ollama response received');
  return content;
}

module.exports = { checkStatus, chat };
