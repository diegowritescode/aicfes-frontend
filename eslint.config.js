import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    /* The React Native app, which this config reached by accident:
       the block above declares `globals.browser` and a files glob
       over every .ts and .tsx in the repo, so it has been linting
       Metro code with web rules since movil/ was created.

       One rule actually conflicts. `require()` is how Metro resolves
       a static asset: it returns an asset id the bundler rewrites,
       and an `import` does not do the same thing. The rule is right
       about web code and wrong here, so it is off for this directory
       rather than worked around in the four places that load a
       sound.

       The rest of the recommended set still applies, including
       react-hooks/rules-of-hooks — which is what caught a
       conditional `useAmigos()` in jugar.tsx that no local check
       would have found. */
    files: ["movil/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
);
