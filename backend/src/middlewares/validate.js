const AppError = require('../utils/AppError');

/**
 * Creates a Zod validation middleware.
 * Validates req.body by default, or a specified source.
 *
 * @param {import('zod').ZodSchema} schema
 * @param {'body' | 'query' | 'params'} source
 */
function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      return next(new AppError('Validation error', 400, errors));
    }
    req[source] = result.data;
    next();
  };
}

module.exports = validate;
