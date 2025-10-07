module.exports = {
  root: true,
  extends: [
    '@react-native',
    '@react-native/eslint-config',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  env: {
    'react-native/react-native': true,
  },
  rules: {
    // Disable some rules that might be too strict for development
    '@typescript-eslint/no-unused-vars': 'warn',
    'react-native/no-inline-styles': 'warn',
    'react/no-unstable-nested-components': 'warn',
    // Allow console.log in development
    'no-console': 'off',
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        '@typescript-eslint/no-shadow': ['error'],
        'no-shadow': 'off',
        'no-undef': 'off',
      },
    },
  ],
}; 