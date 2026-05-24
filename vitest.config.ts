import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    env: {
      VITE_LOG_LEVEL: "warn",
      // ky/undici reject relative URLs as unparseable. Without an absolute
      // base, /auth/me requests in tests throw before reaching MSW and the
      // AuthProvider's catch swallows the failure — tests appear to pass
      // while every API call silently 500s.
      VITE_API_URL: "http://localhost/api",
    },
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/test/**",
        "src/**/*.d.ts",
        "src/routeTree.gen.ts",
        "src/main.tsx",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
