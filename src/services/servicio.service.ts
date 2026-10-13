import { ServicioResponseDTO } from "../dto/servicio.dto";
import { IServicioService } from "./interfaces/servicio.interface";


export class ServicioService implements IServicioService {
    // Catálogo de servicios en memoria (mientras no haya base de datos)
    private servicios: ServicioResponseDTO[] = [
        { id: "s-1", nombre: "Corte de cabello", descripcion: "Corte y peinado", duracionMinutos: 45, precio: 35000, activo: true },
        { id: "s-2", nombre: "Manicure", descripcion: "Limpieza y esmaltado de uñas de manos", duracionMinutos: 60, precio: 30000, activo: true },
        { id: "s-3", nombre: "Pedicure", descripcion: "Limpieza y esmaltado de uñas de pies", duracionMinutos: 60, precio: 35000, activo: true },
        { id: "s-4", nombre: "Tinte", descripcion: "Coloración completa", duracionMinutos: 120, precio: 90000, activo: true },
        { id: "s-5", nombre: "Masaje relajante", descripcion: "Masaje de cuerpo completo", duracionMinutos: 60, precio: 80000, activo: false }
    ];

    constructor() { }

    async listarServicios(soloActivos: boolean): Promise<ServicioResponseDTO[]> {
        if (soloActivos) {
            return this.servicios.filter((s) => s.activo);
        }
        return this.servicios;
    }

    async buscarPorId(id: string): Promise<ServicioResponseDTO | undefined> {
        return this.servicios.find((s) => s.id === id);
    }
}
