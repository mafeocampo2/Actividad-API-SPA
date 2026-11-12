import { Router } from "express";
import { container } from "../../config/containers";
import { ServicioService } from "../../services/servicio.service";

export const servicioRouter = Router();

// GET /api/v1/servicios          -> solo servicios activos
// GET /api/v1/servicios?todos=true -> incluye los inactivos
servicioRouter.get("/", async (req, res) => {

    const soloActivos = req.query.todos !== "true";

    const servicioService = container.resolve<ServicioService>("servicioService");
    const result = await servicioService.listarServicios(soloActivos);
    res.status(200).json(result);
});
