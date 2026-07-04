// ESLint v9 flat config. Verified via `npx eslint --version` post-install.
// Source: https://eslint.org/docs/latest/use/configure/configuration-files

import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/.husky/**",
      "**/coverage/**",
      "**/data/**",
      "apps/demo-host/dist/**",
    ],
  },
  // Non-type-aware baseline (cheap; works for everything including the config file and tests).
  js.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-console": ["error", { allow: ["error", "warn"] }],
      eqeqeq: ["error", "always"],
    },
  },
  // Type-aware strict config: applied only to real source TS in packages/ and apps/.
  // Tests and config files get the cheap rules above; type-aware rules need projectService.
  {
    files: ["packages/**/*.ts", "apps/**/*.ts"],
    ignores: ["**/__tests__/**", "**/*.test.ts"],
    extends: [...tseslint.configs.strictTypeChecked, ...tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
    },
  },
  // Test files: relax a few rules that fight vitest patterns.
  {
    files: ["**/*.test.ts", "**/__tests__/**/*.ts"],
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-console": "off",
    },
  },
);
