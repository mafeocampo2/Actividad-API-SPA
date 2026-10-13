//dto de autenticación (pantalla Login)

export interface LoginRequestDTO {
    email: string;
    password: string;
}

export interface UsuarioDTO {
    id: string;
    nombre: string;
    email: string;
    rol: string;
}

export interface LoginResponseDTO {
    token: string;
    usuario: UsuarioDTO;
}
