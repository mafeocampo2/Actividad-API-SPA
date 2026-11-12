export interface ProximaCitaDTO {
    id: string;
    hora: string;
    cliente: string;
    servicio: string;
}

export interface ResumenDashboardDTO {
    fecha: string; // YYYY-MM-DD
    citasHoy: {
        total: number;
        pendiente: number;
        confirmada: number;
        completada: number;
        cancelada: number;
    };
    proximaCita: ProximaCitaDTO | null;
    totalClientes: number;
    ingresosHoy: number;
}
