import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client";

// Misma ruta por defecto que prisma.config.ts: backend/prisma/dev.db
// (el backend se arranca desde la carpeta backend/). Se puede cambiar con DATABASE_URL.
export const DATABASE_URL = process.env.DATABASE_URL ?? `file:${path.join(process.cwd(), "prisma", "dev.db")}`;

export const crearPrisma = () => new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: DATABASE_URL }) });

// Una sola conexión para toda la API
export const prisma = crearPrisma();

export type Prisma = typeof prisma;
