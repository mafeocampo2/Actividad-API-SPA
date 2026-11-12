import { ServicioResponseDTO } from "../../dto/servicio.dto";


export interface IServicioService {
    listarServicios(soloActivos: boolean): Promise<ServicioResponseDTO[]>;
    buscarPorId(id: string): Promise<ServicioResponseDTO | undefined>;
}
