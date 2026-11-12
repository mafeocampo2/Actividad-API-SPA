import { randomUUID } from "node:crypto";
import {
    CitaCambiosDTO,
    CitaFiltroDTO,
    CitaRequestDTO,
    CitaResponseDTO,
    DisponibilidadDTO,
    SlotDTO
} from "../dto/cita.dto";
import { ServicioResponseDTO } from "../dto/servicio.dto";
import { HORARIO } from "../config/horario";
import { aHora, aMinutos, diaSemana } from "../utils/fecha";
import { ICitaService } from "./interfaces/cita.interface";
import { IClienteService } from "./interfaces/cliente.interface";
import { IServicioService } from "./interfaces/servicio.interface";

// Error de negocio con el código HTTP que debe responder la ruta
export class CitaError extends Error {
    constructor(public status: number, public code: string, message: string) {
        super(message);
    }
}

const ESTADOS_REPROGRAMABLES = ["PENDIENTE", "CONFIRMADA"];


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
        const servicio = await this.servicioActivo(data.servicioId);
        const { inicio, fin } = this.validarTurno(data.fecha, data.hora, servicio);

        const response: CitaResponseDTO = {
            id: randomUUID(),
            clienteId: cliente.id,
            clienteNombre: cliente.nombreCompleto,
            servicioId: servicio.id,
            servicioNombre: servicio.nombre,
            fecha: data.fecha,
            hora: aHora(inicio),
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

    async obtenerCita(id: string): Promise<CitaResponseDTO | undefined> {
        return this.citas.find((c) => c.id === id);
    }

    async reprogramarCita(id: string, cambios: CitaCambiosDTO): Promise<CitaResponseDTO> {
        const cita = this.citas.find((c) => c.id === id);
        if (!cita) {
            throw new CitaError(404, "NOT_FOUND", "cita not found");
        }
        if (!ESTADOS_REPROGRAMABLES.includes(cita.estado)) {
            throw new CitaError(409, "CITA_NO_REPROGRAMABLE", `a cita in state ${cita.estado} cannot be rescheduled`);
        }

        const servicio = await this.servicioActivo(cambios.servicioId ?? cita.servicioId);
        const fecha = cambios.fecha ?? cita.fecha;
        const { inicio, fin } = this.validarTurno(fecha, cambios.hora ?? cita.hora, servicio, cita.id);

        cita.fecha = fecha;
        cita.hora = aHora(inicio);
        cita.horaFin = aHora(fin);
        cita.servicioId = servicio.id;
        cita.servicioNombre = servicio.nombre;
        cita.duracionMinutos = servicio.duracionMinutos;
        cita.precio = servicio.precio;
        return cita;
    }

    async obtenerDisponibilidad(
        fecha: string,
        servicioId: string,
        ahora: { fecha: string; hora: string },
        excluirCitaId?: string
    ): Promise<DisponibilidadDTO> {
        const servicio = await this.servicioActivo(servicioId);
        const abierto = HORARIO.diasAbiertos.includes(diaSemana(fecha));
        const apertura = aMinutos(HORARIO.apertura);
        const cierre = aMinutos(HORARIO.cierre);
        const ahoraMin = aMinutos(ahora.hora);

        const slots: SlotDTO[] = [];
        for (let inicio = apertura; inicio < cierre; inicio += HORARIO.intervaloMin) {
            const fin = inicio + servicio.duracionMinutos;
            const hora = aHora(inicio);
            if (!abierto || fin > cierre) {
                slots.push({ hora, disponible: false, motivo: "cerrado" });
            } else if (fecha < ahora.fecha || (fecha === ahora.fecha && inicio <= ahoraMin)) {
                slots.push({ hora, disponible: false, motivo: "pasado" });
            } else if (this.hayCruce(fecha, inicio, fin, excluirCitaId)) {
                slots.push({ hora, disponible: false, motivo: "ocupado" });
            } else {
                slots.push({ hora, disponible: true });
            }
        }

        return {
            fecha,
            servicioId: servicio.id,
            duracionMin: servicio.duracionMinutos,
            horario: { apertura: HORARIO.apertura, cierre: HORARIO.cierre, abierto },
            slots
        };
    }

    // --- auxiliares -------------------------------------------------------

    private async servicioActivo(servicioId: string): Promise<ServicioResponseDTO> {
        const servicio = await this.servicioService.buscarPorId(servicioId);
        if (!servicio || !servicio.activo) {
            throw new CitaError(404, "NOT_FOUND", "servicio not found or inactive");
        }
        return servicio;
    }

    /** Valida que el turno esté dentro del horario y no choque con otra cita. */
    private validarTurno(fecha: string, hora: string, servicio: ServicioResponseDTO, excluirCitaId?: string) {
        const inicio = aMinutos(hora);
        const fin = inicio + servicio.duracionMinutos;

        const abierto = HORARIO.diasAbiertos.includes(diaSemana(fecha));
        if (!abierto || inicio < aMinutos(HORARIO.apertura) || fin > aMinutos(HORARIO.cierre)) {
            throw new CitaError(
                400,
                "FUERA_DE_HORARIO",
                `el salón atiende de ${HORARIO.apertura} a ${HORARIO.cierre}, de lunes a sábado`
            );
        }
        // No se permiten dos citas que se crucen el mismo día
        if (this.hayCruce(fecha, inicio, fin, excluirCitaId)) {
            throw new CitaError(409, "CONFLICT", "there is already a cita in that time slot");
        }
        return { inicio, fin };
    }

    private hayCruce(fecha: string, inicio: number, fin: number, excluirCitaId?: string): boolean {
        return this.citas.some((c) =>
            c.id !== excluirCitaId &&
            c.fecha === fecha &&
            c.estado !== "CANCELADA" &&
            inicio < aMinutos(c.horaFin) &&
            aMinutos(c.hora) < fin
        );
    }
}
