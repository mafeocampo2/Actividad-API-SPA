import { Router } from "express";
import { container } from "../../config/containers";
import { ReporteService } from "../../services/reporte.service";
import { esFechaValida } from "../../utils/fecha";

export const reporteRouter = Router();

// GET /api/v1/reportes/resumen?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
// Ingresos, citas por estado, servicios más pedidos, clientes nuevos y tasa de cancelación del rango.
reporteRouter.get("/resumen", async (req, res) => {

    const { desde, hasta } = req.query;
    if (typeof desde !== "string" || typeof hasta !== "string") {
        res.status(400).json({ code: "BAD_REQUEST", message: "desde and hasta are required" });
        return;
    }
    if (!esFechaValida(desde) || !esFechaValida(hasta)) {
        res.status(400).json({ code: "BAD_REQUEST", message: "desde and hasta must have the format YYYY-MM-DD" });
        return;
    }
    if (desde > hasta) {
        res.status(400).json({ code: "BAD_REQUEST", message: "desde must be before or equal to hasta" });
        return;
    }

    const reporteService = container.resolve<ReporteService>("reporteService");
    res.status(200).json(await reporteService.obtenerResumen(desde, hasta));
});
