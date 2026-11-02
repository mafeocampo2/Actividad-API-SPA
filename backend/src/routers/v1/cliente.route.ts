import { Router } from "express";
import { ClienteRequestDTO } from "../../dto/cliente.dto";
import { container } from "../../config/containers";
import { ClienteService } from "../../services/cliente.service";

export const clienteRouter = Router();

// POST /api/v1/clientes
clienteRouter.post("/", async (req, res) => {

    const request: ClienteRequestDTO = req.body as ClienteRequestDTO;
    if (!request?.nombre || !request?.apellido || !request?.telefono || !request?.email) {
        res.status(400).json({
            code: "BAD_REQUEST",
            message: "nombre, apellido, telefono and email are required"
        });
        return;
    };

    const clienteService = container.resolve<ClienteService>("clienteService");
    if (await clienteService.existeEmail(request.email)) {
        res.status(409).json({
            code: "CONFLICT",
            message: "a cliente with this email already exists"
        });
        return;
    }

    const result = await clienteService.crearCliente(request);
    res.status(201).json(result);
});
