module.exports = {
  root: false,
  ignorePatterns: ['projects/**/*', '.eslintrc.js'],
  overrides: [
    {
      files: ['*.ts', '*.js'],
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: __dirname,
        createDefaultProgram: true
      },
      extends: [
        'plugin:@angular-eslint/recommended',
        'plugin:@angular-eslint/template/process-inline-templates',
        'plugin:prettier/recommended'
      ],
      rules: {
        'prettier/prettier': [
          'error',
          {
            endOfLine: 'auto'
          }
        ],
        '@angular-eslint/directive-selector': [
          'error',
          {
            type: 'attribute',
            style: 'camelCase'
          }
        ],
        '@angular-eslint/component-selector': [
          'error',
          {
            type: 'element',
            style: 'kebab-case'
          }
        ],
        '@angular-eslint/no-empty-lifecycle-method': ['warn'], // TODO enable in the future
        '@angular-eslint/component-class-suffix': ['warn'], // TODO enable in the future
        '@angular-eslint/no-output-on-prefix': ['warn'], // TODO enable in the future
        '@typescript-eslint/no-explicit-any': ['warn'], // TODO enable in the future
        'no-relative-import-paths/no-relative-import-paths': [
          'error',
          {
            allowSameFolder: true,
            allowedDepth: 1,
            rootDir: 'src',
            prefix: '@'
          }
        ]
      }
    },
    {
      files: ['*.html'],
      extends: [
        'plugin:@angular-eslint/template/recommended',
        'plugin:prettier/recommended'
      ],
      rules: {}
    }
  ],
  plugins: ['@typescript-eslint', 'no-relative-import-paths']
};
