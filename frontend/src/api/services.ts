import { request } from './client';
import {
  Cita,
  CitaCambios,
  CitaFiltro,
  Disponibilidad,
  CitaRequest,
  Cliente,
  ClienteRequest,
  LoginResponse,
  ResumenDashboard,
  Servicio,
} from './types';

const post = <T>(path: string, body: unknown) =>
  request<T>(path, { method: 'POST', body: JSON.stringify(body) });

const query = (params: Record<string, string | undefined>) => {
  const qs = Object.entries(params)
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}=${encodeURIComponent(value as string)}`)
    .join('&');
  return qs ? `?${qs}` : '';
};

export const authApi = {
  login: (email: string, password: string) =>
    post<LoginResponse>('/auth/login', { email, password }),
};

export const clientesApi = {
  crear: (data: ClienteRequest) => post<Cliente>('/clientes', data),
  listar: () => request<Cliente[]>('/clientes'),
  // Sin q devuelve todos; el backend ignora mayúsculas y tildes
  buscar: (q: string) => request<Cliente[]>(`/clientes${query({ q: q.trim() || undefined })}`),
  obtener: (id: string) => request<Cliente>(`/clientes/${encodeURIComponent(id)}`),
  actualizar: (id: string, data: ClienteRequest) =>
    request<Cliente>(`/clientes/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) }),
  // 409 CLIENTE_CON_CITAS_PENDIENTES si tiene citas pendientes
  eliminar: (id: string) => request<null>(`/clientes/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  // De la más reciente a la más antigua
  historial: (id: string) => request<Cita[]>(`/clientes/${encodeURIComponent(id)}/citas`),
};

export const buscarClientes = clientesApi.buscar;
export const obtenerCliente = clientesApi.obtener;
export const actualizarCliente = clientesApi.actualizar;
export const eliminarCliente = clientesApi.eliminar;
export const historialCliente = clientesApi.historial;

export const serviciosApi = {
  listar: (todos = false) => request<Servicio[]>(`/servicios${query({ todos: todos ? 'true' : undefined })}`),
};

export const citasApi = {
  agendar: (data: CitaRequest) => post<Cita>('/citas', data),
  listar: (filtro: CitaFiltro = {}) => request<Cita[]>(`/citas${query({ ...filtro })}`),
  obtener: (id: string) => request<Cita>(`/citas/${encodeURIComponent(id)}`),
  // Reagendar: 409 si choca con otra cita
  reprogramar: (id: string, cambios: CitaCambios) =>
    request<Cita>(`/citas/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(cambios) }),
};

export const disponibilidadApi = {
  // excluirCitaId: al reagendar, el horario actual de esa cita sale libre
  obtener: (fecha: string, servicioId: string, excluirCitaId?: string) =>
    request<Disponibilidad>(`/disponibilidad${query({ fecha, servicioId, excluirCitaId })}`),
};

export const obtenerDisponibilidad = disponibilidadApi.obtener;
export const obtenerCita = citasApi.obtener;
export const reprogramarCita = citasApi.reprogramar;

export const dashboardApi = {
  // fecha y hora del dispositivo, para que "hoy" sea el día local del usuario
  resumen: (fecha?: string, hora?: string) =>
    request<ResumenDashboard>(`/dashboard/resumen${query({ fecha, hora })}`),
};

export const obtenerResumenDashboard = dashboardApi.resumen;
