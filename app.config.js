// Lets the web build be served from a sub-path (e.g. GitHub Pages at /RaceTracker).
// Set BASE_URL when building; leave it unset for root hosting.
module.exports = ({ config }) =>
  process.env.BASE_URL
    ? { ...config, experiments: { ...config.experiments, baseUrl: process.env.BASE_URL } }
    : config;
