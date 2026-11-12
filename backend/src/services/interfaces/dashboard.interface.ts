import { ResumenDashboardDTO } from "../../dto/dashboard.dto";


export interface IDashboardService {
    obtenerResumen(fecha: string, horaActual: string): Promise<ResumenDashboardDTO>;
}
