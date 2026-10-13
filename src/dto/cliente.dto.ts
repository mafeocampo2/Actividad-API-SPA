//dto de clientes (pantalla Clientes)

export interface ClienteRequestDTO {
    nombre: string;
    apellido: string;
    telefono: string;
    email: string;
}

export interface ClienteResponseDTO {
    id: string;
    nombre: string;
    apellido: string;
    nombreCompleto: string;
    telefono: string;
    email: string;
    activo: boolean;
    fechaRegistro: string;
}
