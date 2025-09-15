// eslint.config.js
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
    rules: {
      // Turn off explicit any rule project-wide
      "@typescript-eslint/no-explicit-any": "off",

      // Relax unused vars so `_prefixed` variables don't trigger errors.
      // Keep it as a warning for visibility, not an error.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_",
          "caughtErrorsIgnorePattern": "^_"
        }
      ],

      // If you still want to treat general no-unused-vars as error, keep eslint's default off and use TS rule above.
      "no-unused-vars": "off"
    },
  },
];

export default eslintConfig;
