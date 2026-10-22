import { defineConfig } from "vitest/config";

export default defineConfig({
    server: {
        port: 5173,
        strictPort: true,
    },
    test: {
        environment: "node",
        include: ["src/**/*.test.ts"],
        passWithNoTests: true,
    },
});
