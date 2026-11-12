import { Platform } from 'react-native';

// URL de la API. Se puede cambiar con EXPO_PUBLIC_API_URL en frontend/.env
// (necesario en un celular físico: http://<IP de tu PC>:3000/api/v1)
const defaultHost = () => {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  }
  // El emulador de Android ve el PC en 10.0.2.2
  if (Platform.OS === 'android') {
    return '10.0.2.2';
  }
  return 'localhost';
};

export const API_URL = process.env.EXPO_PUBLIC_API_URL || `http://${defaultHost()}:3000/api/v1`;

// Error con el formato { code, message } que responde el backend
export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', `No se pudo conectar con la API (${API_URL})`);
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(
      response.status,
      data?.code ?? 'ERROR',
      data?.message ?? `Error ${response.status}`
    );
  }
  return data as T;
}
