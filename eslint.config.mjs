import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';

/*
 * Configuração única na raiz do workspace, cobrindo os dois apps. Cada um
 * recebe o conjunto de regras que faz sentido para o seu ambiente: a API roda
 * em Node, o front no navegador com React.
 *
 * Os dois usam `recommendedTypeChecked`, que habilita regras apoiadas no
 * compilador — é o que permite pegar coisas como promise não aguardada, algo
 * que análise puramente sintática não alcança. Isso importa especialmente na
 * lógica de reserva, onde uma escrita não aguardada dentro de uma transação
 * quebraria o controle de concorrência de forma silenciosa.
 */
export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/coverage/**', '**/node_modules/**'],
  },

  // API — Node
  {
    files: ['apps/api/**/*.ts'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
    ],
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // Front — navegador + React
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      // `configs.flat.recommended`, e não `configs['recommended-latest']`:
      // este último ainda vem no formato antigo do ESLint, incompatível com
      // a configuração plana.
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

  /*
   * Componentes vindos do registry do shadcn exportam o componente e as suas
   * variantes no mesmo arquivo (ex.: `Button` e `buttonVariants`). A regra
   * `only-export-components` reclama disso porque atrapalha o hot reload —
   * é uma questão de experiência de desenvolvimento, não de correção, e o
   * padrão vem de fora. Desligada só nesta pasta.
   */
  {
    files: ['apps/web/src/components/ui/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },

  /*
   * Precisa ser o último: desliga as regras de estilo do ESLint que
   * conflitariam com o Prettier. Sem isso, os dois brigam pelo mesmo arquivo.
   */
  prettier,
);
