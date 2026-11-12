// URL de la base de datos PostgreSQL.
// - En Render: la variable DATABASE_URL la pone render.yaml (base de datos de Render).
// - En tu PC: si existe backend/.env se lee de ahí; si no, se usa el Postgres local
//   que arranca `npm run db:local` (prisma dev).
try {
    process.loadEnvFile();
} catch {
    // sin archivo .env: se usan las variables del sistema
}

export const DATABASE_URL =
    process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:51214/template1?sslmode=disable";
