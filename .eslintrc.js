module.exports = {
  root: true,
  env: {
    jest: true,
    es6: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
  ],
  overrides: [{
    files: ['*.ts', '*.tsx'],
    // @see https://stackoverflow.com/questions/58510287/parseroptions-project-has-been-set-for-typescript-eslint-parser/64488474
    parserOptions: {
      project: [
        './tsconfig.json',
        './tsconfig.test.json',
      ],
    },
  }],
  rules: {
    indent: 'off',
    '@typescript-eslint/indent': ['error', 2],
  },
};
