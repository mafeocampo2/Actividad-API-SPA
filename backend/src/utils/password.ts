import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

// Contraseñas con scrypt (incluido en Node). Formato guardado: "salt:hash" en hexadecimal.

export const hashPassword = (password: string): string => {
    const salt = randomBytes(16).toString("hex");
    const hash = scryptSync(password, salt, 64).toString("hex");
    return `${salt}:${hash}`;
};

export const verificarPassword = (password: string, guardado: string): boolean => {
    const [salt, hash] = guardado.split(":");
    if (!salt || !hash) return false;
    const esperado = Buffer.from(hash, "hex");
    const calculado = scryptSync(password, salt, esperado.length);
    return calculado.length === esperado.length && timingSafeEqual(calculado, esperado);
};
