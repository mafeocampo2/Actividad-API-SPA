import React from 'react';
import { ScrollView, Text } from 'react-native';
import { styles } from '../components/ui';

// Pendiente: ingresos y servicios más pedidos
export default function ReportesScreen() {
  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.title}>Reportes</Text>
      <Text style={styles.empty}>Próximamente: ingresos y servicios más pedidos.</Text>
    </ScrollView>
  );
}
