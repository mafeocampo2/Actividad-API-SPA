import { Response, Router } from "express";
import { CitaCambiosDTO, CitaFiltroDTO, CitaRequestDTO, EstadoCierre, EstadoCita } from "../../dto/cita.dto";
import { container } from "../../config/containers";
import { CitaError, CitaService } from "../../services/cita.service";
import { HORA_REGEX, esFechaValida } from "../../utils/fecha";

export const citaRouter = Router();

const badRequest = (res: Response, message: string) => res.status(400).json({ code: "BAD_REQUEST", message });

// Responde los errores de negocio (CitaError) con su código HTTP
const responderError = (res: Response, error: unknown) => {
    if (error instanceof CitaError) {
        res.status(error.status).json({ code: error.code, message: error.message });
        return;
    }
    throw error;
};

// POST /api/v1/citas
citaRouter.post("/", async (req, res) => {

    const request: CitaRequestDTO = req.body as CitaRequestDTO;
    if (!request?.clienteId || !request?.servicioId || !request?.fecha || !request?.hora) {
        badRequest(res, "clienteId, servicioId, fecha and hora are required");
        return;
    };
    if (!esFechaValida(request.fecha)) {
        badRequest(res, "fecha must have the format YYYY-MM-DD");
        return;
    }
    if (!HORA_REGEX.test(request.hora)) {
        badRequest(res, "hora must have the format HH:mm");
        return;
    }

    const citaService = container.resolve<CitaService>("citaService");
    try {
        const result = await citaService.agendarCita(request);
        res.status(201).json(result);
    } catch (error) {
        responderError(res, error);
    }
});

const ESTADOS: EstadoCita[] = ["PENDIENTE", "CONFIRMADA", "CANCELADA", "COMPLETADA", "NO_ASISTIO"];

// GET /api/v1/citas
// Filtros opcionales: ?fecha=YYYY-MM-DD&clienteId=...&estado=PENDIENTE
citaRouter.get("/", async (req, res) => {

    const { fecha, clienteId, estado } = req.query;
    const filtro: CitaFiltroDTO = {};

    if (typeof fecha === "string") {
        if (!esFechaValida(fecha)) {
            badRequest(res, "fecha must have the format YYYY-MM-DD");
            return;
        }
        filtro.fecha = fecha;
    }
    if (typeof clienteId === "string") {
        filtro.clienteId = clienteId;
    }
    if (typeof estado === "string") {
        const estadoUpper = estado.toUpperCase() as EstadoCita;
        if (!ESTADOS.includes(estadoUpper)) {
            badRequest(res, `estado must be one of: ${ESTADOS.join(", ")}`);
            return;
        }
        filtro.estado = estadoUpper;
    }

    const citaService = container.resolve<CitaService>("citaService");
    const result = await citaService.listarCitas(filtro);
    res.status(200).json(result);
});

// GET /api/v1/citas/:id
citaRouter.get("/:id", async (req, res) => {

    const citaService = container.resolve<CitaService>("citaService");
    const cita = await citaService.obtenerCita(req.params.id);
    if (!cita) {
        res.status(404).json({ code: "NOT_FOUND", message: "cita not found" });
        return;
    }
    res.status(200).json(cita);
});

// PATCH /api/v1/citas/:id  (reagendar)
// Body: { fecha?, hora?, servicioId? } — al menos uno
citaRouter.patch("/:id", async (req, res) => {

    const cambios = (req.body ?? {}) as CitaCambiosDTO;
    if (!cambios.fecha && !cambios.hora && !cambios.servicioId) {
        badRequest(res, "send at least one of: fecha, hora, servicioId");
        return;
    }
    if (cambios.fecha !== undefined && !esFechaValida(cambios.fecha)) {
        badRequest(res, "fecha must have the format YYYY-MM-DD");
        return;
    }
    if (cambios.hora !== undefined && !HORA_REGEX.test(cambios.hora)) {
        badRequest(res, "hora must have the format HH:mm");
        return;
    }

    const citaService = container.resolve<CitaService>("citaService");
    try {
        const result = await citaService.reprogramarCita(req.params.id, cambios);
        res.status(200).json(result);
    } catch (error) {
        responderError(res, error);
    }
});

const ESTADOS_CIERRE: EstadoCierre[] = ["COMPLETADA", "NO_ASISTIO"];

// PATCH /api/v1/citas/:id/estado
// Body: { estado: "COMPLETADA" | "NO_ASISTIO" }. Solo desde PENDIENTE o CONFIRMADA (409 si no).
citaRouter.patch("/:id/estado", async (req, res) => {

    const estado = typeof req.body?.estado === "string" ? (req.body.estado.toUpperCase() as EstadoCierre) : undefined;
    if (!estado || !ESTADOS_CIERRE.includes(estado)) {
        badRequest(res, `estado must be one of: ${ESTADOS_CIERRE.join(", ")}`);
        return;
    }

    const citaService = container.resolve<CitaService>("citaService");
    try {
        res.status(200).json(await citaService.cambiarEstado(req.params.id, estado));
    } catch (error) {
        responderError(res, error);
    }
});

// PATCH /api/v1/citas/:id/cancelar
// Solo desde PENDIENTE o CONFIRMADA (409 si no). El horario queda libre.
citaRouter.patch("/:id/cancelar", async (req, res) => {

    const citaService = container.resolve<CitaService>("citaService");
    try {
        res.status(200).json(await citaService.cambiarEstado(req.params.id, "CANCELADA"));
    } catch (error) {
        responderError(res, error);
    }
});
