import { randomUUID } from "node:crypto";
import { CitaFiltroDTO, CitaRequestDTO, CitaResponseDTO } from "../dto/cita.dto";
import { ICitaService } from "./interfaces/cita.interface";
import { IClienteService } from "./interfaces/cliente.interface";
import { IServicioService } from "./interfaces/servicio.interface";

// Error de negocio con el código HTTP que debe responder la ruta
export class CitaError extends Error {
    constructor(public status: number, public code: string, message: string) {
        super(message);
    }
}

const aMinutos = (hora: string): number => {
    const [h, m] = hora.split(":").map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
};

const aHora = (minutos: number): string => {
    const h = Math.floor(minutos / 60).toString().padStart(2, "0");
    const m = (minutos % 60).toString().padStart(2, "0");
    return `${h}:${m}`;
};


export class CitaService implements ICitaService {
    // Almacenamiento en memoria (mientras no haya base de datos)
    private citas: CitaResponseDTO[] = [];

    // Awilix (modo CLASSIC) inyecta los servicios por el nombre del parámetro
    constructor(
        private clienteService: IClienteService,
        private servicioService: IServicioService
    ) { }

    async agendarCita(data: CitaRequestDTO): Promise<CitaResponseDTO> {
        const cliente = await this.clienteService.buscarPorId(data.clienteId);
        if (!cliente) {
            throw new CitaError(404, "NOT_FOUND", "cliente not found");
        }

        const servicio = await this.servicioService.buscarPorId(data.servicioId);
        if (!servicio || !servicio.activo) {
            throw new CitaError(404, "NOT_FOUND", "servicio not found or inactive");
        }

        const inicio = aMinutos(data.hora);
        const fin = inicio + servicio.duracionMinutos;

        // No se permiten dos citas que se crucen el mismo día
        const cruce = this.citas.some((c) =>
            c.fecha === data.fecha &&
            c.estado !== "CANCELADA" &&
            inicio < aMinutos(c.horaFin) &&
            aMinutos(c.hora) < fin
        );
        if (cruce) {
            throw new CitaError(409, "CONFLICT", "there is already a cita in that time slot");
        }

        const response: CitaResponseDTO = {
            id: randomUUID(),
            clienteId: cliente.id,
            clienteNombre: cliente.nombreCompleto,
            servicioId: servicio.id,
            servicioNombre: servicio.nombre,
            fecha: data.fecha,
            hora: data.hora,
            horaFin: aHora(fin),
            duracionMinutos: servicio.duracionMinutos,
            precio: servicio.precio,
            estado: "PENDIENTE",
            notas: data.notas ?? "",
            fechaCreacion: new Date().toISOString()
        };
        this.citas.push(response);
        return response;
    }

    async listarCitas(filtro: CitaFiltroDTO): Promise<CitaResponseDTO[]> {
        return this.citas
            .filter((c) => !filtro.fecha || c.fecha === filtro.fecha)
            .filter((c) => !filtro.clienteId || c.clienteId === filtro.clienteId)
            .filter((c) => !filtro.estado || c.estado === filtro.estado)
            // ordenadas por fecha y hora (la más próxima primero)
            .sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`));
    }
}
