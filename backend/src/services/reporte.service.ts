import { ReporteResumenDTO, ServicioTopDTO } from "../dto/reporte.dto";
import { fechaLocal } from "../utils/fecha";
import { ICitaService } from "./interfaces/cita.interface";
import { IClienteService } from "./interfaces/cliente.interface";
import { IReporteService } from "./interfaces/reporte.interface";

const MAX_SERVICIOS_TOP = 4;


export class ReporteService implements IReporteService {
    // Awilix (modo CLASSIC) inyecta los servicios por el nombre del parámetro
    constructor(
        private citaService: ICitaService,
        private clienteService: IClienteService
    ) { }

    async obtenerResumen(desde: string, hasta: string): Promise<ReporteResumenDTO> {
        // Las fechas YYYY-MM-DD se pueden comparar como texto
        const enRango = (fecha: string) => fecha >= desde && fecha <= hasta;

        const citas = (await this.citaService.listarCitas({})).filter((c) => enRango(c.fecha));
        const clientes = await this.clienteService.listarClientes();

        const contar = (...estados: string[]) => citas.filter((c) => estados.includes(c.estado)).length;
        const cancelada = contar("CANCELADA");

        // Servicios más pedidos: citas no canceladas, agrupadas por servicio
        const porServicio = new Map<string, ServicioTopDTO>();
        for (const c of citas) {
            if (c.estado === "CANCELADA") continue;
            const actual = porServicio.get(c.servicioId) ?? { servicioId: c.servicioId, nombre: c.servicioNombre, cantidad: 0 };
            actual.cantidad++;
            porServicio.set(c.servicioId, actual);
        }
        const serviciosTop = [...porServicio.values()]
            .sort((a, b) => b.cantidad - a.cantidad || a.nombre.localeCompare(b.nombre))
            .slice(0, MAX_SERVICIOS_TOP);

        return {
            desde,
            hasta,
            totalCitas: citas.length,
            porEstado: {
                pendiente: contar("PENDIENTE", "CONFIRMADA"),
                completada: contar("COMPLETADA"),
                cancelada,
                no_asistio: contar("NO_ASISTIO")
            },
            ingresos: citas.filter((c) => c.estado === "COMPLETADA").reduce((total, c) => total + c.precio, 0),
            // fechaRegistro está en UTC: se pasa a fecha local antes de comparar
            clientesNuevos: clientes.filter((c) => enRango(fechaLocal(new Date(c.fechaRegistro)))).length,
            tasaCancelacion: citas.length === 0 ? 0 : cancelada / citas.length,
            serviciosTop
        };
    }
}
