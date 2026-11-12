import { ClienteRequestDTO, ClienteResponseDTO } from "../dto/cliente.dto";
import { IClienteService } from "./interfaces/cliente.interface";

// Minúsculas y sin tildes, para buscar "gomez" y encontrar "Gómez"
const normalizar = (texto: string): string =>
    texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();


export class ClienteService implements IClienteService {
    // Almacenamiento en memoria (mientras no haya base de datos)
    private clientes: ClienteResponseDTO[] = [];
    private siguienteId = 1;

    constructor() { }

    async crearCliente(data: ClienteRequestDTO): Promise<ClienteResponseDTO> {
        const response: ClienteResponseDTO = {
            id: `c-${this.siguienteId++}`,
            nombre: data.nombre.trim(),
            apellido: data.apellido.trim(),
            nombreCompleto: `${data.nombre.trim()} ${data.apellido.trim()}`,
            telefono: data.telefono.trim(),
            email: data.email.trim().toLowerCase(),
            activo: true,
            fechaRegistro: new Date().toISOString()
        };
        this.clientes.push(response);
        return response;
    }

    async listarClientes(): Promise<ClienteResponseDTO[]> {
        return this.clientes;
    }

    async buscarClientes(q: string): Promise<ClienteResponseDTO[]> {
        const texto = normalizar(q);
        if (!texto) {
            return this.clientes;
        }
        const soloDigitos = texto.replace(/\s/g, "");
        return this.clientes.filter((c) =>
            normalizar(c.nombreCompleto).includes(texto) ||
            c.telefono.replace(/\s/g, "").includes(soloDigitos) ||
            normalizar(c.email).includes(texto)
        );
    }

    async buscarPorId(id: string): Promise<ClienteResponseDTO | undefined> {
        return this.clientes.find((c) => c.id === id);
    }

    async actualizarCliente(id: string, data: ClienteRequestDTO): Promise<ClienteResponseDTO | undefined> {
        const cliente = this.clientes.find((c) => c.id === id);
        if (!cliente) {
            return undefined;
        }
        cliente.nombre = data.nombre.trim();
        cliente.apellido = data.apellido.trim();
        cliente.nombreCompleto = `${cliente.nombre} ${cliente.apellido}`;
        cliente.telefono = data.telefono.trim();
        cliente.email = data.email.trim().toLowerCase();
        return cliente;
    }

    async eliminarCliente(id: string): Promise<boolean> {
        const antes = this.clientes.length;
        this.clientes = this.clientes.filter((c) => c.id !== id);
        return this.clientes.length < antes;
    }

    async existeEmail(email: string, excluirId?: string): Promise<boolean> {
        const buscado = email.trim().toLowerCase();
        return this.clientes.some((c) => c.email === buscado && c.id !== excluirId);
    }
}
