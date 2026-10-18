/**
 * Wraps an async Express route handler to catch promise rejections.
 * @param {Function} fn - async (req, res, next) => ...
 * @returns {Function}
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
