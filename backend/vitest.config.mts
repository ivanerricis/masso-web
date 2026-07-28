import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "node",
        include: ["src/**/*.test.ts"],
        // I test non richiedono un database: il query layer viene mockato, così la
        // CI non ha bisogno di un servizio Postgres.
        globals: false,
    },
});
