import { NavigatorScreenParams } from '@react-navigation/native';

// Pestañas de la barra inferior
export type TabParamList = {
    Inicio: undefined;
    Clientes: undefined;
    Nuevo: undefined; // botón central "+": abre AgendarCita (no tiene pantalla propia)
    Citas: { fecha?: string } | undefined; // fecha: muestra las citas de ese día
    Reportes: undefined;
};

// Stack principal: las pestañas y las pantallas que se abren sin barra inferior
export type AppStackParamList = {
    Login: undefined;
    Tabs: NavigatorScreenParams<TabParamList>;
    Servicios: undefined;
    // clienteId: cliente preseleccionado · citaId: modo reagendar
    AgendarCita: { clienteId?: string; citaId?: string } | undefined;
};
