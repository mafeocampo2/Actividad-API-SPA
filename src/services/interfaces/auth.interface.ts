import { LoginRequestDTO, LoginResponseDTO } from "../../dto/auth.dto";


export interface IAuthService {
    login(data: LoginRequestDTO): Promise<LoginResponseDTO | null>;
}
