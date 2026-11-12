//dto de citas (pantallas AgendarCita y Citas)

export type EstadoCita = "PENDIENTE" | "CONFIRMADA" | "CANCELADA" | "COMPLETADA";

export interface CitaRequestDTO {
    clienteId: string;
    servicioId: string;
    fecha: string;   // formato YYYY-MM-DD
    hora: string;    // formato HH:mm (24h)
    notas?: string;
}

export interface CitaFiltroDTO {
    fecha?: string;
    clienteId?: string;
    estado?: EstadoCita;
}

export interface CitaResponseDTO {
    id: string;
    clienteId: string;
    clienteNombre: string;
    servicioId: string;
    servicioNombre: string;
    fecha: string;
    hora: string;
    horaFin: string;
    duracionMinutos: number;
    precio: number;
    estado: EstadoCita;
    notas: string;
    fechaCreacion: string;
}
