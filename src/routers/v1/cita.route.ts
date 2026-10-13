import { Router } from "express";
import { CitaFiltroDTO, CitaRequestDTO, EstadoCita } from "../../dto/cita.dto";
import { container } from "../../config/containers";
import { CitaError, CitaService } from "../../services/cita.service";

export const citaRouter = Router();

const FECHA_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const HORA_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

// POST /api/v1/citas
citaRouter.post("/", async (req, res) => {

    const request: CitaRequestDTO = req.body as CitaRequestDTO;
    if (!request?.clienteId || !request?.servicioId || !request?.fecha || !request?.hora) {
        res.status(400).json({
            code: "BAD_REQUEST",
            message: "clienteId, servicioId, fecha and hora are required"
        });
        return;
    };
    if (!FECHA_REGEX.test(request.fecha) || Number.isNaN(Date.parse(request.fecha))) {
        res.status(400).json({
            code: "BAD_REQUEST",
            message: "fecha must have the format YYYY-MM-DD"
        });
        return;
    }
    if (!HORA_REGEX.test(request.hora)) {
        res.status(400).json({
            code: "BAD_REQUEST",
            message: "hora must have the format HH:mm"
        });
        return;
    }

    const citaService = container.resolve<CitaService>("citaService");
    try {
        const result = await citaService.agendarCita(request);
        res.status(201).json(result);
    } catch (error) {
        if (error instanceof CitaError) {
            res.status(error.status).json({ code: error.code, message: error.message });
            return;
        }
        throw error;
    }
});

const ESTADOS: EstadoCita[] = ["PENDIENTE", "CONFIRMADA", "CANCELADA", "COMPLETADA"];

// GET /api/v1/citas
// Filtros opcionales: ?fecha=YYYY-MM-DD&clienteId=...&estado=PENDIENTE
citaRouter.get("/", async (req, res) => {

    const { fecha, clienteId, estado } = req.query;
    const filtro: CitaFiltroDTO = {};

    if (typeof fecha === "string") {
        if (!FECHA_REGEX.test(fecha)) {
            res.status(400).json({
                code: "BAD_REQUEST",
                message: "fecha must have the format YYYY-MM-DD"
            });
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
            res.status(400).json({
                code: "BAD_REQUEST",
                message: `estado must be one of: ${ESTADOS.join(", ")}`
            });
            return;
        }
        filtro.estado = estadoUpper;
    }

    const citaService = container.resolve<CitaService>("citaService");
    const result = await citaService.listarCitas(filtro);
    res.status(200).json(result);
});
