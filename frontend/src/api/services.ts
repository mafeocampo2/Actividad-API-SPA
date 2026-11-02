import { request } from './client';
import {
  Cita,
  CitaFiltro,
  CitaRequest,
  Cliente,
  ClienteRequest,
  LoginResponse,
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
};

export const serviciosApi = {
  listar: (todos = false) => request<Servicio[]>(`/servicios${query({ todos: todos ? 'true' : undefined })}`),
};

export const citasApi = {
  agendar: (data: CitaRequest) => post<Cita>('/citas', data),
  listar: (filtro: CitaFiltro = {}) => request<Cita[]>(`/citas${query({ ...filtro })}`),
};
