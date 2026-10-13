import { createContainer, asClass, InjectionMode } from "awilix";
import { AuthService } from "../services/auth.service";
import { ClienteService } from "../services/cliente.service";
import { ServicioService } from "../services/servicio.service";
import { CitaService } from "../services/cita.service";

export const container = createContainer({
    injectionMode: InjectionMode.CLASSIC,
});

container.register({
    authService: asClass(AuthService).singleton(),
    clienteService: asClass(ClienteService).singleton(),
    servicioService: asClass(ServicioService).singleton(),
    citaService: asClass(CitaService).singleton()
});
