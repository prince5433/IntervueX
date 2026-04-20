/*
 * Natural-Language File Comment:
 * File Role: Project-wide linting rules define karta hai (Next.js + custom ignore patterns).
 * Project Flow Link: 'eslint.config.mjs' code quality checks ka central config point hai.
 * Read Order: imports -> config array -> ignores -> export.
 */
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
