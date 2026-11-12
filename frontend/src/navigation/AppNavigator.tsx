import React from 'react';
import { NavigationContainer, DefaultTheme, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { theme } from '../components/ui';
import BottomTabBar from '../components/BottomTabBar';
import { AppStackParamList, TabParamList } from '../types/navigation';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import ClientesScreen from '../screens/ClientesScreen';
import ServiciosScreen from '../screens/ServiciosScreen';
import AgendarCitaScreen from '../screens/AgendarCitaScreen';
import CitasScreen from '../screens/CitasScreen';
import ReportesScreen from '../screens/ReportesScreen';

const Stack = createNativeStackNavigator<AppStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const navTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: theme.colors.primary,
    background: theme.colors.background,
    card: theme.colors.background,
    text: theme.colors.text,
    border: theme.colors.borderSoft,
  },
};

// Encabezado claro para las pantallas que aún lo usan
const header = {
  headerStyle: { backgroundColor: theme.colors.background },
  headerTintColor: theme.colors.primary,
  headerTitleStyle: { color: theme.colors.text },
  headerShadowVisible: false,
};

// El "+" no tiene pantalla: la barra lo intercepta y abre AgendarCita
const Vacio = () => null;

function Tabs() {
  return (
    <Tab.Navigator tabBar={(props) => <BottomTabBar {...props} />} screenOptions={header}>
      <Tab.Screen name="Inicio" component={HomeScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Clientes" component={ClientesScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Nuevo" component={Vacio} />
      <Tab.Screen name="Citas" component={CitasScreen} />
      <Tab.Screen name="Reportes" component={ReportesScreen} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { usuario } = useAuth();

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={header}>
        {/* Sin sesión solo se ve el Login; al iniciar sesión se muestran las demás pantallas */}
        {usuario ? (
          <>
            <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
            <Stack.Screen name="Servicios" component={ServiciosScreen} />
            <Stack.Screen name="AgendarCita" component={AgendarCitaScreen} options={{ headerShown: false }} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
