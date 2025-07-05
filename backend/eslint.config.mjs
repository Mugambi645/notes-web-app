import { defineConfig } from 'eslint/config'
import js from '@eslint/js'
import globals from 'globals'
import stylisticJs from '@stylistic/eslint-plugin-js'

export default defineConfig([
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: globals.browser,
    },
    plugins: {
      '@stylistic/js': stylisticJs,
    },
    rules: {
      ...js.configs.recommended.rules,
      '@stylistic/js/indent': ['error', 2],
      '@stylistic/js/linebreak-style': ['error', 'unix'],
      '@stylistic/js/quotes': ['error', 'single'],
      '@stylistic/js/semi': ['error', 'never'],
      eqeqeq: 'error',
      'no-trailing-spaces': 'error',
      'object-curly-spacing': ['error', 'always'],
      'arrow-spacing': ['error', { before: true, after: true }],
    },
    
  },
  { 
    ignores: ['dist/**'], 
  },
])
