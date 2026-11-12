import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { DATABASE_URL } from "./database-url";

export const crearPrisma = () => new PrismaClient({ adapter: new PrismaPg({ connectionString: DATABASE_URL }) });

// Una sola conexión (pool) para toda la API
export const prisma = crearPrisma();

export type Prisma = typeof prisma;
