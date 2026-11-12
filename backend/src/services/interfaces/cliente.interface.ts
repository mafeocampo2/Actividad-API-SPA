import { ClienteRequestDTO, ClienteResponseDTO } from "../../dto/cliente.dto";


export interface IClienteService {
    crearCliente(data: ClienteRequestDTO): Promise<ClienteResponseDTO>;
    listarClientes(): Promise<ClienteResponseDTO[]>;
    buscarClientes(q: string): Promise<ClienteResponseDTO[]>;
    buscarPorId(id: string): Promise<ClienteResponseDTO | undefined>;
    actualizarCliente(id: string, data: ClienteRequestDTO): Promise<ClienteResponseDTO | undefined>;
    eliminarCliente(id: string): Promise<boolean>;
    existeEmail(email: string, excluirId?: string): Promise<boolean>;
}
