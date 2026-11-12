import { ResumenDashboardDTO } from "../dto/dashboard.dto";
import { ICitaService } from "./interfaces/cita.interface";
import { IClienteService } from "./interfaces/cliente.interface";
import { IDashboardService } from "./interfaces/dashboard.interface";


export class DashboardService implements IDashboardService {
    // Awilix (modo CLASSIC) inyecta los servicios por el nombre del parámetro
    constructor(
        private citaService: ICitaService,
        private clienteService: IClienteService
    ) { }

    async obtenerResumen(fecha: string, horaActual: string): Promise<ResumenDashboardDTO> {
        const citas = await this.citaService.listarCitas({ fecha }); // ya vienen ordenadas por hora
        const clientes = await this.clienteService.listarClientes();

        const contar = (estado: string) => citas.filter((c) => c.estado === estado).length;
        const activas = citas.filter((c) => c.estado !== "CANCELADA");

        // Próxima cita: la primera pendiente o confirmada que aún no ha empezado
        const proxima = activas.find(
            (c) => (c.estado === "PENDIENTE" || c.estado === "CONFIRMADA") && c.hora >= horaActual
        );

        return {
            fecha,
            citasHoy: {
                total: citas.length,
                pendiente: contar("PENDIENTE"),
                confirmada: contar("CONFIRMADA"),
                completada: contar("COMPLETADA"),
                cancelada: contar("CANCELADA")
            },
            proximaCita: proxima
                ? { id: proxima.id, hora: proxima.hora, cliente: proxima.clienteNombre, servicio: proxima.servicioNombre }
                : null,
            totalClientes: clientes.length,
            // Ingresos esperados del día: todas las citas que no están canceladas
            // (no cuentan las canceladas ni las de clientes que no asistieron)
            ingresosHoy: activas.filter((c) => c.estado !== "NO_ASISTIO").reduce((total, c) => total + c.precio, 0)
        };
    }
}
