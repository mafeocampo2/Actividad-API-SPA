import { Router } from "express";
import { container } from "../../config/containers";
import { DashboardService } from "../../services/dashboard.service";

export const dashboardRouter = Router();

const FECHA_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const HORA_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

// Fecha y hora LOCAL del servidor (no toISOString, que usa UTC)
const ahoraLocal = () => {
    const d = new Date();
    const dos = (n: number) => String(n).padStart(2, "0");
    return {
        fecha: `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`,
        hora: `${dos(d.getHours())}:${dos(d.getMinutes())}`
    };
};

// GET /api/v1/dashboard/resumen
// Opcionales: ?fecha=YYYY-MM-DD&hora=HH:mm (por defecto, la fecha y hora actuales)
dashboardRouter.get("/resumen", async (req, res) => {
    const ahora = ahoraLocal();
    const fecha = typeof req.query.fecha === "string" ? req.query.fecha : ahora.fecha;
    const hora = typeof req.query.hora === "string" ? req.query.hora : ahora.hora;

    if (!FECHA_REGEX.test(fecha)) {
        res.status(400).json({ code: "BAD_REQUEST", message: "fecha must have the format YYYY-MM-DD" });
        return;
    }
    if (!HORA_REGEX.test(hora)) {
        res.status(400).json({ code: "BAD_REQUEST", message: "hora must have the format HH:mm" });
        return;
    }

    const dashboardService = container.resolve<DashboardService>("dashboardService");
    const result = await dashboardService.obtenerResumen(fecha, hora);
    res.status(200).json(result);
});
