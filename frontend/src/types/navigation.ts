import { NavigatorScreenParams } from '@react-navigation/native';

// Pestañas de la barra inferior
export type TabParamList = {
    Inicio: undefined;
    Clientes: undefined;
    Nuevo: undefined; // botón central "+": abre AgendarCita (no tiene pantalla propia)
    Citas: undefined;
    Reportes: undefined;
};

// Stack principal: las pestañas y las pantallas que se abren sin barra inferior
export type AppStackParamList = {
    Login: undefined;
    Tabs: NavigatorScreenParams<TabParamList>;
    Servicios: undefined;
    AgendarCita: undefined;
};
