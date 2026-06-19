import vitest from '@vitest/eslint-plugin';
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import importPlugin from 'eslint-plugin-import';
import playwrightPlugin from 'eslint-plugin-playwright';
import reactDoctor from 'eslint-plugin-react-doctor';
import reactYouMightNotNeedAnEffect from 'eslint-plugin-react-you-might-not-need-an-effect';
import testingLibraryPlugin from 'eslint-plugin-testing-library';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  reactDoctor.configs.recommended,
  reactDoctor.configs.next,
  reactYouMightNotNeedAnEffect.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    plugins: {
      import: importPlugin,
    },
    settings: {
      'import/resolver': {
        typescript: true,
        node: true,
      },
    },
    rules: {
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', ['parent', 'sibling'], 'index', 'type'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/no-duplicates': 'error',
    },
  },
  {
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['**/*.{jsx,tsx}'],
    rules: {
      'react-hooks/exhaustive-deps': 'error',
      'react/boolean-prop-naming': [
        'error',
        {
          rule: '^(is|should|has|can|did|will|as)[A-Z]([A-Za-z0-9]?)+',
          message:
            "Boolean props should start with 'is', 'should', 'has', 'can', 'did', 'will', or 'as'",
        },
      ],
    },
  },
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
        },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
    },
  },
  {
    files: [
      '**/*.{test,spec}.{js,jsx,ts,tsx,mjs,mts,cjs,cts}',
      'tests/unit/**/*.{js,jsx,ts,tsx,mjs,mts,cjs,cts}',
      'tests/integration/**/*.{js,jsx,ts,tsx,mjs,mts,cjs,cts}',
    ],
    ignores: ['tests/e2e/**', 'e2e/**', 'playwright/**'],
    plugins: vitest.configs.recommended.plugins,
    languageOptions: vitest.configs.env.languageOptions,
    rules: {
      ...vitest.configs.recommended.rules,
      'vitest/no-disabled-tests': 'warn',
      'vitest/no-focused-tests': 'error',
    },
  },
  {
    files: [
      '**/*.{test,spec}.{js,jsx,ts,tsx,mjs,mts,cjs,cts}',
      'tests/unit/**/*.{js,jsx,ts,tsx,mjs,mts,cjs,cts}',
      'tests/integration/**/*.{js,jsx,ts,tsx,mjs,mts,cjs,cts}',
    ],
    ignores: ['tests/e2e/**', 'e2e/**', 'playwright/**'],
    ...testingLibraryPlugin.configs['flat/react'],
  },
  {
    files: [
      'tests/e2e/**/*.{js,jsx,ts,tsx,mjs,mts,cjs,cts}',
      'e2e/**/*.{js,jsx,ts,tsx,mjs,mts,cjs,cts}',
      'playwright/**/*.{js,jsx,ts,tsx,mjs,mts,cjs,cts}',
    ],
    ...playwrightPlugin.configs['flat/recommended'],
  },
  {
    // Generated shadcn/ui primitives are vendored source. They intentionally
    // co-export variant helpers (e.g. `buttonVariants`) and follow upstream
    // composition/a11y patterns that trip some strict rules. Exempt those rules
    // here only; app code keeps full strictness. Mirrors the `components/ui/**`
    // exemption in react-doctor.config.json.
    files: ['components/ui/**/*.{jsx,tsx}'],
    rules: {
      'react-doctor/only-export-components': 'off',
      'react-doctor/no-multi-comp': 'off',
      'react-doctor/prefer-tag-over-role': 'off',
      'react-doctor/click-events-have-key-events': 'off',
      'react-doctor/label-has-associated-control': 'off',
      'react-doctor/rerender-memo-before-early-return': 'off',
      'react-doctor/react-compiler-no-manual-memoization': 'off',
      'react-doctor/no-array-index-as-key': 'off',
      // Recharts-based `chart.tsx` is vendored upstream source: it injects theme
      // CSS via `dangerouslySetInnerHTML`, imports recharts eagerly, reads context
      // with `useContext`, and uses upstream filter().map()/inline-context patterns.
      'react-doctor/prefer-dynamic-import': 'off',
      'react-doctor/no-react19-deprecated-apis': 'off',
      'react-doctor/jsx-no-constructed-context-values': 'off',
      'react-doctor/no-danger': 'off',
      'react-doctor/js-combine-iterations': 'off',
      'react/boolean-prop-naming': 'off',
    },
  },
  eslintConfigPrettier,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    '.agents/**',
    '.claude/**',
    'coverage/**',
    'playwright-report/**',
    'test-results/**',
  ]),
]);

export default eslintConfig;
