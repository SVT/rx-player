/**
 * Require all files returned by a require.context call
 * @param {Function} requireContext - Return of a require.context.
 * @return {Array} - Array containing every modules.
 */
const requireAll = function(requireContext) {
  return requireContext.keys().forEach(requireContext);
};

//requireAll(require.context("./scenarios", true, /\.js$/));
require('./scenarios/dash_live_no_timeline.js');
