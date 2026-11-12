// Datos iniciales: usuario administrador y catálogo de servicios.
// Se puede correr varias veces sin duplicar nada:  npm run db:seed
import { crearPrisma } from "../src/config/db";
import { hashPassword } from "../src/utils/password";

const prisma = crearPrisma();

const SERVICIOS = [
    { id: "s-1", nombre: "Corte de cabello", descripcion: "Corte y peinado", duracionMinutos: 45, precio: 35000, activo: true },
    { id: "s-2", nombre: "Manicure", descripcion: "Limpieza y esmaltado de uñas de manos", duracionMinutos: 60, precio: 30000, activo: true },
    { id: "s-3", nombre: "Pedicure", descripcion: "Limpieza y esmaltado de uñas de pies", duracionMinutos: 60, precio: 35000, activo: true },
    { id: "s-4", nombre: "Tinte", descripcion: "Coloración completa", duracionMinutos: 120, precio: 90000, activo: true },
    { id: "s-5", nombre: "Masaje relajante", descripcion: "Masaje de cuerpo completo", duracionMinutos: 60, precio: 80000, activo: false }
];

async function main() {
    // Usuario de prueba: admin@miapp.com / 123456 (solo se crea si no existe)
    await prisma.usuario.upsert({
        where: { email: "admin@miapp.com" },
        update: {},
        create: {
            id: "u-1",
            nombre: "Mafe Ocampo",
            email: "admin@miapp.com",
            passwordHash: hashPassword("123456"),
            rol: "admin"
        }
    });

    for (const servicio of SERVICIOS) {
        await prisma.servicio.upsert({ where: { id: servicio.id }, update: servicio, create: servicio });
    }

    console.log(`Seed listo: 1 usuario y ${SERVICIOS.length} servicios`);
}

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
