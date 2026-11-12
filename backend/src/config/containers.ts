import { createContainer, asClass, asValue, InjectionMode } from "awilix";
import { prisma } from "./db";
import { AuthService } from "../services/auth.service";
import { ClienteService } from "../services/cliente.service";
import { ServicioService } from "../services/servicio.service";
import { CitaService } from "../services/cita.service";
import { DashboardService } from "../services/dashboard.service";
import { ReporteService } from "../services/reporte.service";

export const container = createContainer({
    injectionMode: InjectionMode.CLASSIC,
});

container.register({
    // Conexión a la base de datos (los servicios la reciben como parámetro "prisma")
    prisma: asValue(prisma),
    authService: asClass(AuthService).singleton(),
    clienteService: asClass(ClienteService).singleton(),
    servicioService: asClass(ServicioService).singleton(),
    citaService: asClass(CitaService).singleton(),
    dashboardService: asClass(DashboardService).singleton(),
    reporteService: asClass(ReporteService).singleton()
});
