import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist",
      "node_modules",
      "drizzle/migrations",
      "drizzle/meta",
      "client/public/__manus__",
      "client/src/_core/**",
      "client/src/components/ui/**",
      "client/src/components/ManusDialog.tsx",
      "client/src/hooks/**",
      "client/src/pages/ComponentShowcase.tsx",
      "server/_core/**",
      "server/storage.ts",
      "vite.config.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["client/**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks, "react-refresh": reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  },
  {
    files: ["server/**/*.{ts,tsx}", "drizzle/**/*.ts", "shared/**/*.ts"],
    rules: { "@typescript-eslint/no-explicit-any": "error" },
  }
);
