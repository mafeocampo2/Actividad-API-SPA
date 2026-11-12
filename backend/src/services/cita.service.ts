import {
    CitaCambiosDTO,
    CitaFiltroDTO,
    CitaRequestDTO,
    CitaResponseDTO,
    DisponibilidadDTO,
    EstadoCierre,
    EstadoCita,
    SlotDTO
} from "../dto/cita.dto";
import { ServicioResponseDTO } from "../dto/servicio.dto";
import { Prisma } from "../config/db";
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

type FilaCita = Awaited<ReturnType<Prisma["cita"]["findUniqueOrThrow"]>>;

// Fila de la base → DTO de la API (null → campo omitido, estado con su tipo)
const aDTO = ({ motivoCancelacion, estado, ...resto }: FilaCita): CitaResponseDTO => ({
    ...resto,
    estado: estado as EstadoCita,
    ...(motivoCancelacion ? { motivoCancelacion } : {})
});


export class CitaService implements ICitaService {
    // Awilix (modo CLASSIC) inyecta los servicios y la conexión por el nombre del parámetro
    constructor(
        private clienteService: IClienteService,
        private servicioService: IServicioService,
        private prisma: Prisma
    ) { }

    async agendarCita(data: CitaRequestDTO): Promise<CitaResponseDTO> {
        const cliente = await this.clienteService.buscarPorId(data.clienteId);
        if (!cliente) {
            throw new CitaError(404, "NOT_FOUND", "cliente not found");
        }
        const servicio = await this.servicioActivo(data.servicioId);
        const { inicio, fin } = await this.validarTurno(data.fecha, data.hora, servicio);

        const cita = await this.prisma.cita.create({
            data: {
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
            }
        });
        return aDTO(cita);
    }

    async listarCitas(filtro: CitaFiltroDTO): Promise<CitaResponseDTO[]> {
        const citas = await this.prisma.cita.findMany({
            where: {
                ...(filtro.fecha ? { fecha: filtro.fecha } : {}),
                ...(filtro.clienteId ? { clienteId: filtro.clienteId } : {}),
                ...(filtro.estado ? { estado: filtro.estado } : {})
            },
            // ordenadas por fecha y hora (la más próxima primero)
            orderBy: [{ fecha: "asc" }, { hora: "asc" }]
        });
        return citas.map(aDTO);
    }

    async obtenerCita(id: string): Promise<CitaResponseDTO | undefined> {
        const cita = await this.prisma.cita.findUnique({ where: { id } });
        return cita ? aDTO(cita) : undefined;
    }

    async reprogramarCita(id: string, cambios: CitaCambiosDTO): Promise<CitaResponseDTO> {
        const cita = await this.prisma.cita.findUnique({ where: { id } });
        if (!cita) {
            throw new CitaError(404, "NOT_FOUND", "cita not found");
        }
        if (!ESTADOS_REPROGRAMABLES.includes(cita.estado)) {
            throw new CitaError(409, "CITA_NO_REPROGRAMABLE", `a cita in state ${cita.estado} cannot be rescheduled`);
        }

        const servicio = await this.servicioActivo(cambios.servicioId ?? cita.servicioId);
        const fecha = cambios.fecha ?? cita.fecha;
        const { inicio, fin } = await this.validarTurno(fecha, cambios.hora ?? cita.hora, servicio, cita.id);

        const actualizada = await this.prisma.cita.update({
            where: { id },
            data: {
                fecha,
                hora: aHora(inicio),
                horaFin: aHora(fin),
                servicioId: servicio.id,
                servicioNombre: servicio.nombre,
                duracionMinutos: servicio.duracionMinutos,
                precio: servicio.precio
            }
        });
        return aDTO(actualizada);
    }

    /** Cierra una cita: completada, no asistió o cancelada. Solo desde PENDIENTE o CONFIRMADA. */
    async cambiarEstado(id: string, estado: EstadoCierre, motivoCancelacion?: string): Promise<CitaResponseDTO> {
        const cita = await this.prisma.cita.findUnique({ where: { id } });
        if (!cita) {
            throw new CitaError(404, "NOT_FOUND", "cita not found");
        }
        // updateMany con el estado en el where: si otra petición la cerró justo antes, no se pisa
        const { count } = await this.prisma.cita.updateMany({
            where: { id, estado: { in: ESTADOS_REPROGRAMABLES } },
            data: {
                estado,
                ...(estado === "CANCELADA" && motivoCancelacion ? { motivoCancelacion } : {})
            }
        });
        if (count === 0) {
            throw new CitaError(409, "CITA_NO_MODIFICABLE", `a cita in state ${cita.estado} cannot change its state`);
        }
        return aDTO(await this.prisma.cita.findUniqueOrThrow({ where: { id } }));
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
        // Una sola consulta para todo el día
        const ocupadas = await this.citasQueOcupan(fecha, excluirCitaId);

        const slots: SlotDTO[] = [];
        for (let inicio = apertura; inicio < cierre; inicio += HORARIO.intervaloMin) {
            const fin = inicio + servicio.duracionMinutos;
            const hora = aHora(inicio);
            if (!abierto || fin > cierre) {
                slots.push({ hora, disponible: false, motivo: "cerrado" });
            } else if (fecha < ahora.fecha || (fecha === ahora.fecha && inicio <= ahoraMin)) {
                slots.push({ hora, disponible: false, motivo: "pasado" });
            } else if (seCruza(ocupadas, inicio, fin)) {
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
    private async validarTurno(fecha: string, hora: string, servicio: ServicioResponseDTO, excluirCitaId?: string) {
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
        if (seCruza(await this.citasQueOcupan(fecha, excluirCitaId), inicio, fin)) {
            throw new CitaError(409, "CONFLICT", "there is already a cita in that time slot");
        }
        return { inicio, fin };
    }

    /** Citas del día que ocupan horario (todas menos las canceladas). */
    private citasQueOcupan(fecha: string, excluirCitaId?: string) {
        return this.prisma.cita.findMany({
            where: {
                fecha,
                estado: { not: "CANCELADA" },
                ...(excluirCitaId ? { id: { not: excluirCitaId } } : {})
            },
            select: { hora: true, horaFin: true }
        });
    }
}

const seCruza = (citas: { hora: string; horaFin: string }[], inicio: number, fin: number): boolean =>
    citas.some((c) => inicio < aMinutos(c.horaFin) && aMinutos(c.hora) < fin);
