import { ClienteRequestDTO, ClienteResponseDTO } from "../../dto/cliente.dto";


export interface IClienteService {
    crearCliente(data: ClienteRequestDTO): Promise<ClienteResponseDTO>;
    buscarPorId(id: string): Promise<ClienteResponseDTO | undefined>;
    existeEmail(email: string): Promise<boolean>;
}
