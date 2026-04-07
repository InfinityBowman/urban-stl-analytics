//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  {
    ignores: [
      '.output/**',
      'python/**',
      'eslint.config.js',
      'prettier.config.js',
      'vite.config.ts',
    ],
  },
  ...tanstackConfig,
]
