import { Router } from "express";
import { ClienteRequestDTO } from "../../dto/cliente.dto";
import { container } from "../../config/containers";
import { ClienteService } from "../../services/cliente.service";
import { CitaService } from "../../services/cita.service";

export const clienteRouter = Router();

// true si faltan campos obligatorios
const incompleto = (r: ClienteRequestDTO | undefined): boolean =>
    !r?.nombre?.trim() || !r?.apellido?.trim() || !r?.telefono?.trim() || !r?.email?.trim();

const CAMPOS_OBLIGATORIOS = {
    code: "BAD_REQUEST",
    message: "nombre, apellido, telefono and email are required"
};
const EMAIL_REPETIDO = {
    code: "CONFLICT",
    message: "a cliente with this email already exists"
};
const NO_EXISTE = { code: "NOT_FOUND", message: "cliente not found" };

// POST /api/v1/clientes
clienteRouter.post("/", async (req, res) => {

    const request: ClienteRequestDTO = req.body as ClienteRequestDTO;
    if (incompleto(request)) {
        res.status(400).json(CAMPOS_OBLIGATORIOS);
        return;
    };

    const clienteService = container.resolve<ClienteService>("clienteService");
    if (await clienteService.existeEmail(request.email)) {
        res.status(409).json(EMAIL_REPETIDO);
        return;
    }

    const result = await clienteService.crearCliente(request);
    res.status(201).json(result);
});


// GET /api/v1/clientes
// Opcional: ?q=texto (busca en nombre, teléfono y correo; sin distinguir mayúsculas ni tildes)
clienteRouter.get("/", async (req, res) => {

    const clienteService = container.resolve<ClienteService>("clienteService");
    const q = typeof req.query.q === "string" ? req.query.q : "";
    const result = await clienteService.buscarClientes(q);
    res.status(200).json(result);
});


// GET /api/v1/clientes/:id
clienteRouter.get("/:id", async (req, res) => {

    const clienteService = container.resolve<ClienteService>("clienteService");
    const cliente = await clienteService.buscarPorId(req.params.id);
    if (!cliente) {
        res.status(404).json(NO_EXISTE);
        return;
    }
    res.status(200).json(cliente);
});


// PUT /api/v1/clientes/:id
clienteRouter.put("/:id", async (req, res) => {

    const request: ClienteRequestDTO = req.body as ClienteRequestDTO;
    if (incompleto(request)) {
        res.status(400).json(CAMPOS_OBLIGATORIOS);
        return;
    }

    const clienteService = container.resolve<ClienteService>("clienteService");
    if (!(await clienteService.buscarPorId(req.params.id))) {
        res.status(404).json(NO_EXISTE);
        return;
    }
    if (await clienteService.existeEmail(request.email, req.params.id)) {
        res.status(409).json(EMAIL_REPETIDO);
        return;
    }

    const result = await clienteService.actualizarCliente(req.params.id, request);
    res.status(200).json(result);
});


// DELETE /api/v1/clientes/:id
// No se puede eliminar si tiene citas PENDIENTE o CONFIRMADA (409).
// La revisión se hace aquí porque CitaService ya depende de ClienteService.
clienteRouter.delete("/:id", async (req, res) => {

    const clienteService = container.resolve<ClienteService>("clienteService");
    const citaService = container.resolve<CitaService>("citaService");

    if (!(await clienteService.buscarPorId(req.params.id))) {
        res.status(404).json(NO_EXISTE);
        return;
    }

    const citas = await citaService.listarCitas({ clienteId: req.params.id });
    const pendientes = citas.filter((c) => c.estado === "PENDIENTE" || c.estado === "CONFIRMADA");
    if (pendientes.length > 0) {
        res.status(409).json({
            code: "CLIENTE_CON_CITAS_PENDIENTES",
            message: `El cliente tiene ${pendientes.length} cita(s) pendiente(s): cancélalas o complétalas antes de eliminarlo`
        });
        return;
    }

    await clienteService.eliminarCliente(req.params.id);
    res.status(204).send();
});


// GET /api/v1/clientes/:id/citas
// Historial del cliente, de la cita más reciente a la más antigua
clienteRouter.get("/:id/citas", async (req, res) => {

    const clienteService = container.resolve<ClienteService>("clienteService");
    const citaService = container.resolve<CitaService>("citaService");

    if (!(await clienteService.buscarPorId(req.params.id))) {
        res.status(404).json(NO_EXISTE);
        return;
    }

    const citas = await citaService.listarCitas({ clienteId: req.params.id });
    res.status(200).json([...citas].reverse());
});
