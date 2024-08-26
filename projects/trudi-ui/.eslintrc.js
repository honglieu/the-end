module.exports = {
  extends: '../../.eslintrc.js',
  ignorePatterns: ['!**/*'],
  overrides: [
    {
      files: ['*.ts'],
      rules: {
        '@angular-eslint/directive-selector': [
          'warn',
          {
            type: 'attribute',
            prefix: '',
            style: 'camelCase'
          }
        ],
        '@angular-eslint/component-selector': [
          'error',
          {
            type: 'element',
            prefix: '',
            style: 'kebab-case'
          }
        ]
      }
    },
    {
      files: ['*.html'],
      rules: {}
    }
  ]
};
