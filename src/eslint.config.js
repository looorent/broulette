import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import jsxA11y from "eslint-plugin-jsx-a11y";
import prettierConfig from "eslint-config-prettier";

export default tseslint.config(
  { ignores: ["dist", ".react-router", "build", "public"] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      // Disables ESLint rules that conflict with Prettier
      prettierConfig,
    ],
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        // Enable Browser globals (window, document) AND Node globals (process)
        // This is essential for SSR apps where code might run in both places.
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "react": react,
      "jsx-a11y": jsxA11y,
    },
    settings: {
      react: {
        version: "detect", // Automatically detect the React version
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,

      // React 17+ doesn"t need "import React from "react""
      "react/react-in-jsx-scope": "off",

      // Enforce dependency arrays in useEffect (Crucial for Router v7 loaders/actions)
      "react-hooks/exhaustive-deps": "warn",

      "@typescript-eslint/no-explicit-any": "off",

      "react-refresh/only-export-components": [
        "warn",
        {
          allowConstantExport: true,
          allowExportNames: ["loader", "shouldRevalidate"]
        }
      ],

      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          "args": "all",
          "argsIgnorePattern": "^_",
          "caughtErrors": "all",
          "caughtErrorsIgnorePattern": "^_",
          "destructuredArrayIgnorePattern": "^_",
          "varsIgnorePattern": "^_",
          "ignoreRestSiblings": true
        }
      ],

      // Optional: Turn off prop-types if you are using TypeScript
      "react/prop-types": "off",
    },
  }
);
