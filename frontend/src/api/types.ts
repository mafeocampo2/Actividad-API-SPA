// Tipos que devuelve la API (mismos DTO del backend)

export type EstadoCita = 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA' | 'COMPLETADA' | 'NO_ASISTIO';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: string;
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}

export interface ClienteRequest {
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
}

export interface Cliente extends ClienteRequest {
  id: string;
  nombreCompleto: string;
  activo: boolean;
  fechaRegistro: string;
}

export interface Servicio {
  id: string;
  nombre: string;
  descripcion: string;
  duracionMinutos: number;
  precio: number;
  activo: boolean;
}

export interface CitaRequest {
  clienteId: string;
  servicioId: string;
  fecha: string; // YYYY-MM-DD
  hora: string; // HH:mm
  notas?: string;
}

export interface CitaFiltro {
  fecha?: string;
  clienteId?: string;
  estado?: EstadoCita;
}

export interface Cita {
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
  motivoCancelacion?: string; // solo en citas canceladas, si se indicó
}

export interface ProximaCita {
  id: string;
  hora: string;
  cliente: string;
  servicio: string;
}

// GET /dashboard/resumen
export interface ResumenDashboard {
  fecha: string; // YYYY-MM-DD
  citasHoy: {
    total: number;
    pendiente: number;
    confirmada: number;
    completada: number;
    cancelada: number;
  };
  proximaCita: ProximaCita | null;
  totalClientes: number;
  ingresosHoy: number;
}

// PATCH /citas/:id (reagendar)
export interface CitaCambios {
  fecha?: string;
  hora?: string;
  servicioId?: string;
}

// GET /disponibilidad
export type MotivoNoDisponible = 'ocupado' | 'pasado' | 'cerrado';

export interface Slot {
  hora: string; // HH:mm
  disponible: boolean;
  motivo?: MotivoNoDisponible;
}

export interface Disponibilidad {
  fecha: string;
  servicioId: string;
  duracionMin: number;
  horario: { apertura: string; cierre: string; abierto: boolean };
  slots: Slot[];
}

// GET /reportes/resumen
export interface ServicioTop {
  servicioId: string;
  nombre: string;
  cantidad: number;
}

export interface ReporteResumen {
  desde: string;
  hasta: string;
  totalCitas: number;
  porEstado: { pendiente: number; completada: number; cancelada: number; no_asistio: number };
  ingresos: number;
  clientesNuevos: number;
  tasaCancelacion: number; // de 0 a 1
  serviciosTop: ServicioTop[];
}
