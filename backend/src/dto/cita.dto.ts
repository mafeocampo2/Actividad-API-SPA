//dto de citas (pantallas AgendarCita y Citas)

export type EstadoCita = "PENDIENTE" | "CONFIRMADA" | "CANCELADA" | "COMPLETADA" | "NO_ASISTIO";

// Estados a los que se puede cerrar una cita (PATCH /citas/:id/estado y /cancelar)
export type EstadoCierre = "COMPLETADA" | "NO_ASISTIO" | "CANCELADA";

export interface CitaRequestDTO {
    clienteId: string;
    servicioId: string;
    fecha: string;   // formato YYYY-MM-DD
    hora: string;    // formato HH:mm (24h)
    notas?: string;
}

// PATCH /citas/:id (reagendar): todos los campos son opcionales
export interface CitaCambiosDTO {
    fecha?: string;
    hora?: string;
    servicioId?: string;
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
    motivoCancelacion?: string; // solo en citas CANCELADA, si se indicó
}

// GET /disponibilidad
export type MotivoNoDisponible = "ocupado" | "pasado" | "cerrado";

export interface SlotDTO {
    hora: string; // HH:mm
    disponible: boolean;
    motivo?: MotivoNoDisponible;
}

export interface DisponibilidadDTO {
    fecha: string;
    servicioId: string;
    duracionMin: number;
    horario: { apertura: string; cierre: string; abierto: boolean };
    slots: SlotDTO[];
}
