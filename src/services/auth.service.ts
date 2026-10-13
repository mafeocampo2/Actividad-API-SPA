import { randomUUID } from "node:crypto";
import { LoginRequestDTO, LoginResponseDTO } from "../dto/auth.dto";
import { IAuthService } from "./interfaces/auth.interface";

// Usuarios de prueba (en memoria, mientras no haya base de datos)
const usuarios = [
    { id: "u-1", nombre: "Mafe Ocampo", email: "admin@miapp.com", password: "123456", rol: "admin" }
];


export class AuthService implements IAuthService {
    constructor() { }

    async login(data: LoginRequestDTO): Promise<LoginResponseDTO | null> {
        const usuario = usuarios.find(
            (u) => u.email === data.email.toLowerCase() && u.password === data.password
        );
        if (!usuario) {
            return null;
        }

        const response: LoginResponseDTO = {
            token: randomUUID(),
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol
            }
        };
        return response;
    }
}
