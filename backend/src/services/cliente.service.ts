import { ClienteRequestDTO, ClienteResponseDTO } from "../dto/cliente.dto";
import { Prisma } from "../config/db";
import { IClienteService } from "./interfaces/cliente.interface";

// Minúsculas y sin tildes, para buscar "gomez" y encontrar "Gómez"
const normalizar = (texto: string): string =>
    texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

type FilaCliente = Omit<ClienteResponseDTO, "nombreCompleto">;

const aDTO = (c: FilaCliente): ClienteResponseDTO => ({ ...c, nombreCompleto: `${c.nombre} ${c.apellido}` });

const limpiar = (data: ClienteRequestDTO) => ({
    nombre: data.nombre.trim(),
    apellido: data.apellido.trim(),
    telefono: data.telefono.trim(),
    email: data.email.trim().toLowerCase()
});


export class ClienteService implements IClienteService {
    // Awilix (modo CLASSIC) inyecta la conexión por el nombre del parámetro
    constructor(private prisma: Prisma) { }

    async crearCliente(data: ClienteRequestDTO): Promise<ClienteResponseDTO> {
        const cliente = await this.prisma.cliente.create({
            data: {
                id: await this.siguienteId(),
                ...limpiar(data),
                activo: true,
                fechaRegistro: new Date().toISOString()
            }
        });
        return aDTO(cliente);
    }

    async listarClientes(): Promise<ClienteResponseDTO[]> {
        const clientes = await this.prisma.cliente.findMany();
        // Orden de registro: c-1, c-2, ... c-10 (orden numérico, no de texto)
        return clientes.sort((a, b) => numero(a.id) - numero(b.id)).map(aDTO);
    }

    async buscarClientes(q: string): Promise<ClienteResponseDTO[]> {
        const todos = await this.listarClientes();
        const texto = normalizar(q);
        if (!texto) {
            return todos;
        }
        // SQLite no ignora tildes al comparar, así que el filtro se hace aquí
        const soloDigitos = texto.replace(/\s/g, "");
        return todos.filter((c) =>
            normalizar(c.nombreCompleto).includes(texto) ||
            c.telefono.replace(/\s/g, "").includes(soloDigitos) ||
            normalizar(c.email).includes(texto)
        );
    }

    async buscarPorId(id: string): Promise<ClienteResponseDTO | undefined> {
        const cliente = await this.prisma.cliente.findUnique({ where: { id } });
        return cliente ? aDTO(cliente) : undefined;
    }

    async actualizarCliente(id: string, data: ClienteRequestDTO): Promise<ClienteResponseDTO | undefined> {
        if (!(await this.prisma.cliente.findUnique({ where: { id } }))) {
            return undefined;
        }
        return aDTO(await this.prisma.cliente.update({ where: { id }, data: limpiar(data) }));
    }

    async eliminarCliente(id: string): Promise<boolean> {
        const { count } = await this.prisma.cliente.deleteMany({ where: { id } });
        return count > 0;
    }

    async existeEmail(email: string, excluirId?: string): Promise<boolean> {
        const cliente = await this.prisma.cliente.findUnique({ where: { email: email.trim().toLowerCase() } });
        return cliente !== null && cliente.id !== excluirId;
    }

    // "c-" + (el número más alto usado + 1). No reutiliza números de clientes eliminados
    // mientras exista uno mayor.
    private async siguienteId(): Promise<string> {
        const ids = await this.prisma.cliente.findMany({ select: { id: true } });
        const maximo = ids.reduce((max, { id }) => Math.max(max, numero(id)), 0);
        return `c-${maximo + 1}`;
    }
}

const numero = (id: string): number => Number(id.replace(/^c-/, "")) || 0;
