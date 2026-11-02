import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { colors } from '../components/ui';
import { AppStackParamList } from '../types/navigation';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import ClientesScreen from '../screens/ClientesScreen';
import ServiciosScreen from '../screens/ServiciosScreen';
import AgendarCitaScreen from '../screens/AgendarCitaScreen';
import CitasScreen from '../screens/CitasScreen';

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function AppNavigator() {
  const { usuario } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#fff',
        }}
      >
        {/* Sin sesión solo se ve el Login; al iniciar sesión se muestran las demás pantallas */}
        {usuario ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Inicio' }} />
            <Stack.Screen name="Clientes" component={ClientesScreen} />
            <Stack.Screen name="Servicios" component={ServiciosScreen} />
            <Stack.Screen name="AgendarCita" component={AgendarCitaScreen} options={{ title: 'Agendar cita' }} />
            <Stack.Screen name="Citas" component={CitasScreen} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
