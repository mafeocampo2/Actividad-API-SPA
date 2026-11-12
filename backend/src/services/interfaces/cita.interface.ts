import {
    CitaCambiosDTO,
    CitaFiltroDTO,
    CitaRequestDTO,
    CitaResponseDTO,
    DisponibilidadDTO,
    EstadoCierre
} from "../../dto/cita.dto";


export interface ICitaService {
    agendarCita(data: CitaRequestDTO): Promise<CitaResponseDTO>;
    listarCitas(filtro: CitaFiltroDTO): Promise<CitaResponseDTO[]>;
    obtenerCita(id: string): Promise<CitaResponseDTO | undefined>;
    reprogramarCita(id: string, cambios: CitaCambiosDTO): Promise<CitaResponseDTO>;
    cambiarEstado(id: string, estado: EstadoCierre, motivoCancelacion?: string): Promise<CitaResponseDTO>;
    obtenerDisponibilidad(
        fecha: string,
        servicioId: string,
        ahora: { fecha: string; hora: string },
        excluirCitaId?: string
    ): Promise<DisponibilidadDTO>;
}
