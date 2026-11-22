/**
 * Expo 58 compiles with SWC and no longer installs babel-preset-expo.
 * NativeWind still needs Babel, so the preset is an explicit
 * dependency: without it Metro fails with
 * `Cannot find module 'babel-preset-expo'` and nothing bundles.
 */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  };
};
