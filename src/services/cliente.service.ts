import { randomUUID } from "node:crypto";
import { ClienteRequestDTO, ClienteResponseDTO } from "../dto/cliente.dto";
import { IClienteService } from "./interfaces/cliente.interface";


export class ClienteService implements IClienteService {
    // Almacenamiento en memoria (mientras no haya base de datos)
    private clientes: ClienteResponseDTO[] = [];

    constructor() { }

    async crearCliente(data: ClienteRequestDTO): Promise<ClienteResponseDTO> {
        const response: ClienteResponseDTO = {
            id: randomUUID(),
            nombre: data.nombre,
            apellido: data.apellido,
            nombreCompleto: `${data.nombre} ${data.apellido}`,
            telefono: data.telefono,
            email: data.email.toLowerCase(),
            activo: true,
            fechaRegistro: new Date().toISOString()
        };
        this.clientes.push(response);
        return response;
    }

    async buscarPorId(id: string): Promise<ClienteResponseDTO | undefined> {
        return this.clientes.find((c) => c.id === id);
    }

    async existeEmail(email: string): Promise<boolean> {
        return this.clientes.some((c) => c.email === email.toLowerCase());
    }
}
