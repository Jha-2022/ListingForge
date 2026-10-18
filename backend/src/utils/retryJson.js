const { z } = require('zod');
const logger = require('./logger');
const AppError = require('./AppError');

/**
 * Call a function that returns JSON from a model, validate with Zod schema,
 * and retry up to maxRetries times with error feedback on failure.
 *
 * @param {object} options
 * @param {Function} options.callFn - async () => string (raw model response)
 * @param {z.ZodSchema} options.schema - Zod schema to validate against
 * @param {Function} [options.retryCallFn] - async (errorFeedback: string) => string
 * @param {number} [options.maxRetries=2] - max retry attempts
 * @returns {Promise<object>} validated data
 */
async function retryJson({ callFn, schema, retryCallFn, maxRetries = 2 }) {
  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    let raw;
    try {
      if (attempt === 0) {
        raw = await callFn();
      } else if (retryCallFn) {
        const errorMsg = `Your previous response failed validation. Error: ${lastError}. Please fix the JSON and try again.`;
        logger.warn({ attempt, error: lastError }, 'Retrying model call with error feedback');
        raw = await retryCallFn(errorMsg);
      } else {
        raw = await callFn();
      }
    } catch (err) {
      lastError = err.message;
      logger.error({ attempt, error: err.message }, 'Model call failed');
      if (attempt === maxRetries) {
        throw new AppError(`Model call failed after ${maxRetries + 1} attempts: ${err.message}`, 502);
      }
      continue;
    }

    // Try to parse JSON from the response
    let parsed;
    try {
      // Handle case where response might have markdown code fences
      let jsonStr = raw;
      const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (fenceMatch) {
        jsonStr = fenceMatch[1].trim();
      }
      parsed = JSON.parse(jsonStr);
    } catch (err) {
      lastError = `Invalid JSON: ${err.message}. Raw response starts with: ${raw.substring(0, 200)}`;
      logger.warn({ attempt, error: lastError }, 'Failed to parse JSON from model');
      if (attempt === maxRetries) {
        throw new AppError(`Model returned invalid JSON after ${maxRetries + 1} attempts`, 502);
      }
      continue;
    }

    // Validate with Zod
    const result = schema.safeParse(parsed);
    if (result.success) {
      return result.data;
    }

    lastError = JSON.stringify(result.error.flatten().fieldErrors);
    logger.warn({ attempt, errors: result.error.flatten().fieldErrors }, 'Zod validation failed');
    if (attempt === maxRetries) {
      throw new AppError(`Model output failed schema validation after ${maxRetries + 1} attempts: ${lastError}`, 502);
    }
  }

  throw new AppError('Unexpected error in retryJson', 500);
}

module.exports = { retryJson };
