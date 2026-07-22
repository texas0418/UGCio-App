const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'node_modules/**', 'ios/**', 'android/**', '.expo/**'],
  },
  {
    // Deterministic guards against common LLM failure modes:
    // sprawling functions, deep nesting, and unstructured complexity.
    rules: {
      // NOTE: Dundue also sets 'react-hooks/purity': 'warn', but that rule needs
      // eslint-plugin-react-hooks >= 6 and eslint-config-expo ~10 (Expo SDK 54)
      // pins 5.x, where it does not exist. Re-add when upgrading Expo.
      complexity: ['error', 15],
      'max-depth': ['error', 5],
      'max-lines-per-function': [
        'error',
        { max: 300, skipBlankLines: true, skipComments: true },
      ],
      'max-lines': ['error', { max: 1000, skipBlankLines: true, skipComments: true }],
    },
  },
]);
