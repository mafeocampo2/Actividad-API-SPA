import { randomUUID } from "node:crypto";
import { LoginRequestDTO, LoginResponseDTO } from "../dto/auth.dto";
import { Prisma } from "../config/db";
import { verificarPassword } from "../utils/password";
import { IAuthService } from "./interfaces/auth.interface";


export class AuthService implements IAuthService {
    // Awilix (modo CLASSIC) inyecta la conexión por el nombre del parámetro
    constructor(private prisma: Prisma) { }

    async login(data: LoginRequestDTO): Promise<LoginResponseDTO | null> {
        const usuario = await this.prisma.usuario.findUnique({ where: { email: data.email.trim().toLowerCase() } });
        if (!usuario || !verificarPassword(data.password, usuario.passwordHash)) {
            return null;
        }

        return {
            token: randomUUID(),
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol
            }
        };
    }
}
