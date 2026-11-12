import { ReporteResumenDTO } from "../../dto/reporte.dto";


export interface IReporteService {
    obtenerResumen(desde: string, hasta: string): Promise<ReporteResumenDTO>;
}
