import path from "node:path";
import { defineConfig } from "prisma/config";

// Prisma 7 no lee .env por sí solo. Si DATABASE_URL no está definida se usa
// el archivo prisma/dev.db de esta carpeta (los comandos se corren desde backend/).
const url = process.env.DATABASE_URL ?? `file:${path.join(process.cwd(), "prisma", "dev.db")}`;

export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
        seed: "tsx prisma/seed.ts"
    },
    datasource: {
        url
    }
});
