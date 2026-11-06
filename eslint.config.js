import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // `motion` (framer-motion) só aparece como <motion.div>; sem o plugin
      // react/jsx-uses-vars o ESLint não enxerga esse uso e acusava falso positivo.
      'no-unused-vars': ['error', { varsIgnorePattern: '^(motion$|[A-Z_])' }],
      // Regra nova do react-hooks: acusa setState dentro de useEffect, mas é o padrão
      // usado aqui para carregar dados ao montar e para preencher formulários a partir
      // da clínica. Fica como aviso até esses pontos serem refatorados com calma.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  {
    // Contexto exporta o Provider e o hook no mesmo arquivo (padrão do React).
    files: ['src/context/**/*.{js,jsx}'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
])
