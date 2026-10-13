import { CitaFiltroDTO, CitaRequestDTO, CitaResponseDTO } from "../../dto/cita.dto";


export interface ICitaService {
    agendarCita(data: CitaRequestDTO): Promise<CitaResponseDTO>;
    listarCitas(filtro: CitaFiltroDTO): Promise<CitaResponseDTO[]>;
}
