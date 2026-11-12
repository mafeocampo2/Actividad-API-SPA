import { defineConfig } from "prisma/config";
import { DATABASE_URL } from "./src/config/database-url";

// Prisma 7 no lee .env por sí solo: la URL sale de src/config/database-url.ts
export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
        seed: "tsx prisma/seed.ts"
    },
    datasource: {
        url: DATABASE_URL
    }
});
