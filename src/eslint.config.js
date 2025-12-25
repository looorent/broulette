import js from "@eslint/js";
import eslintParserTypeScript from "@typescript-eslint/parser";
import { defineConfig } from "eslint/config";
import prettierConfig from "eslint-config-prettier";
import eslintPluginBetterTailwindcss from "eslint-plugin-better-tailwindcss";
import importPlugin from "eslint-plugin-import";
import jsxA11y from "eslint-plugin-jsx-a11y";
import promise from "eslint-plugin-promise";
import react from "eslint-plugin-react";
import reactCompiler from "eslint-plugin-react-compiler";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";


export default defineConfig(
  { ignores: ["dist", ".react-router", "build", "public"] },
  {
    files: ["**/*.{ts,tsx,cts,mts}"],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      promise.configs["flat/recommended"],
      prettierConfig,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parser: eslintParserTypeScript,
      parserOptions: {
        project: true
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "react": react,
      "jsx-a11y": jsxA11y,
      "import": importPlugin,
      "react-compiler": reactCompiler,
      "better-tailwindcss": eslintPluginBetterTailwindcss,
    },
    settings: {
      react: { version: "detect" },
      "import/resolver": {
        typescript: { alwaysTryTypes: true, project: "./tsconfig.json" },
        node: true,
      },
      "better-tailwindcss": {
        "entryPoint": "app/app.css"
      }
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      ...importPlugin.configs.recommended.rules,
      ...importPlugin.configs.typescript.rules,
      ...eslintPluginBetterTailwindcss.configs["recommended-warn"].rules,
      "react-compiler/react-compiler": "error",
      "react/react-in-jsx-scope": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "react/no-unescaped-entities": "off",
      "react-hooks/exhaustive-deps": "warn",
      "react-refresh/only-export-components": [
        "warn",
        {
          allowConstantExport: true,
          allowExportNames: [
            "loader", "action", "clientLoader", "clientAction", "headers",
            "links", "meta", "handle", "shouldRevalidate", "ErrorBoundary",
            "HydrateFallback", "layout"
          ],
        },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "all",
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        }
      ],
      "react/prop-types": "off",

      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            ["sibling", "parent"],
            "index",
            "unknown",
          ],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ]
    }
  },
  {
    files: ["**/*.{jsx,tsx}"],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    plugins: {
      "better-tailwindcss": eslintPluginBetterTailwindcss
    },
    rules: {
      ...eslintPluginBetterTailwindcss.configs["recommended-warn"].rules
    },
    settings: {
      "better-tailwindcss": {
        entryPoint: "app/app.css",
      }
    }
  }
);
