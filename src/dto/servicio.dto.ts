//dto de servicios (pantalla Servicio)

export interface ServicioResponseDTO {
    id: string;
    nombre: string;
    descripcion: string;
    duracionMinutos: number;
    precio: number;
    activo: boolean;
}
