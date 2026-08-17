import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      '**/node_modules/**',
      // Prisma client: generated code, placed inside src/ since v7.
      'apps/api/src/generated/**',
    ],
  },

  // Config files at each app root, and one-off scripts run standalone via
  // tsx against a live server (not part of the compiled app), sit outside
  // the tsconfig, which only covers src/ — so they get the rules that do
  // not need type information.
  {
    files: [
      'apps/api/*.ts',
      'apps/api/scripts/**/*.ts',
      'apps/api/prisma/**/*.ts',
    ],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      globals: globals.node,
    },
  },

  // API
  {
    files: ['apps/api/src/**/*.ts'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
    ],
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        projectService: {
          // prisma/ sits outside tsconfig.json's rootDir (build-only
          // concern), so it gets a synthetic default project instead.
          allowDefaultProject: ['apps/api/prisma/*.ts'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // Web
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      // `flat.recommended`, not `recommended-latest`: the latter still ships
      // in the legacy ESLint format.
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // shadcn components export the component and its variants from the same
  // file, which this rule flags. It affects hot reload only, and the pattern
  // comes from the registry.
  {
    files: ['apps/web/src/components/ui/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },

  // Must come last: turns off stylistic rules that would fight Prettier.
  prettier,
);
