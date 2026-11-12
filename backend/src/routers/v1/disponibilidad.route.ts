import { Router } from "express";
import { container } from "../../config/containers";
import { CitaError, CitaService } from "../../services/cita.service";
import { ahoraLocal, esFechaValida } from "../../utils/fecha";

export const disponibilidadRouter = Router();

// GET /api/v1/disponibilidad?fecha=YYYY-MM-DD&servicioId=s-2[&excluirCitaId=...]
// Turnos del día para ese servicio: libre, ocupado, pasado o cerrado.
// excluirCitaId: al reagendar, el horario actual de esa cita no cuenta como ocupado.
disponibilidadRouter.get("/", async (req, res) => {

    const { fecha, servicioId, excluirCitaId } = req.query;
    if (typeof fecha !== "string" || typeof servicioId !== "string") {
        res.status(400).json({ code: "BAD_REQUEST", message: "fecha and servicioId are required" });
        return;
    }
    if (!esFechaValida(fecha)) {
        res.status(400).json({ code: "BAD_REQUEST", message: "fecha must have the format YYYY-MM-DD" });
        return;
    }

    const citaService = container.resolve<CitaService>("citaService");
    try {
        const result = await citaService.obtenerDisponibilidad(
            fecha,
            servicioId,
            ahoraLocal(),
            typeof excluirCitaId === "string" ? excluirCitaId : undefined
        );
        res.status(200).json(result);
    } catch (error) {
        if (error instanceof CitaError) {
            res.status(error.status).json({ code: error.code, message: error.message });
            return;
        }
        throw error;
    }
});
