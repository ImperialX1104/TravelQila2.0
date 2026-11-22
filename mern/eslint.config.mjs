import nextVitals from "eslint-config-next/core-web-vitals";
import { defineConfig, globalIgnores } from "eslint/config";

const nextConfig = Array.isArray(nextVitals) ? nextVitals : [nextVitals];

export default defineConfig([
  ...nextConfig,
  globalIgnores([".next/**", "node_modules/**", "coverage/**", "playwright-report/**", "test-results/**"])
]);
