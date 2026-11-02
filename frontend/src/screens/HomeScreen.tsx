import React from 'react';
import { ScrollView, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton, styles } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { AppStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<AppStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { usuario, logout } = useAuth();

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.title}>Hola, {usuario?.nombre}</Text>
      <AppButton title="Clientes" onPress={() => navigation.navigate('Clientes')} />
      <AppButton title="Servicios" onPress={() => navigation.navigate('Servicios')} />
      <AppButton title="Agendar cita" onPress={() => navigation.navigate('AgendarCita')} />
      <AppButton title="Ver citas" onPress={() => navigation.navigate('Citas')} />
      <AppButton title="Cerrar sesión" onPress={logout} variant="outline" />
    </ScrollView>
  );
}
