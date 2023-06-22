module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
    node: true,
  },
  extends: ['eslint:recommended', 'prettier'],
  plugins: ['prettier'],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  globals: {
    DEBUG: true,
    JITSI_PUBLIC_URL: true,
    WBO_PUBLIC_URL: true,
  },
  rules: {
    'prettier/prettier': ['error'],
    'linebreak-style': ['error', 'unix'],
    semi: ['error', 'always'],
    'no-unused-vars': ['error'],
    camelcase: 'off',
    'prefer-const': [2, { destructuring: 'any' }],
    'no-duplicate-imports': ['error', { includeExports: true }],
  },
};
