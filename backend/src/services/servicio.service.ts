import { ServicioResponseDTO } from "../dto/servicio.dto";
import { Prisma } from "../config/db";
import { IServicioService } from "./interfaces/servicio.interface";


export class ServicioService implements IServicioService {
    // Awilix (modo CLASSIC) inyecta la conexión por el nombre del parámetro
    constructor(private prisma: Prisma) { }

    async listarServicios(soloActivos: boolean): Promise<ServicioResponseDTO[]> {
        return this.prisma.servicio.findMany({
            where: soloActivos ? { activo: true } : {},
            orderBy: { id: "asc" }
        });
    }

    async buscarPorId(id: string): Promise<ServicioResponseDTO | undefined> {
        return (await this.prisma.servicio.findUnique({ where: { id } })) ?? undefined;
    }
}
