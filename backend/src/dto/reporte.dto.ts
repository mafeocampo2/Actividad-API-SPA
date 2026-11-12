//dto de reportes (pantalla Reportes)

export interface ServicioTopDTO {
    servicioId: string;
    nombre: string;
    cantidad: number;
}

export interface ReporteResumenDTO {
    desde: string; // YYYY-MM-DD
    hasta: string; // YYYY-MM-DD
    totalCitas: number;
    // "pendiente" incluye las citas CONFIRMADA
    porEstado: {
        pendiente: number;
        completada: number;
        cancelada: number;
        no_asistio: number;
    };
    ingresos: number;         // suma de las citas COMPLETADA
    clientesNuevos: number;   // clientes registrados dentro del rango
    tasaCancelacion: number;  // de 0 a 1
    serviciosTop: ServicioTopDTO[]; // máximo 4, sin contar las canceladas
}
