// Tipos que devuelve la API (mismos DTO del backend)

export type EstadoCita = 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA' | 'COMPLETADA';

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
}
