import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { serviciosApi } from '../api/services';
import { Servicio } from '../api/types';
import { Message, colors, formatPrecio, styles } from '../components/ui';

export default function ServiciosScreen() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    serviciosApi
      .listar()
      .then(setServicios)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.title}>Servicios disponibles</Text>
      {loading && <ActivityIndicator color={colors.primary} />}
      <Message text={error} />
      {servicios.map((s) => (
        <View key={s.id} style={styles.card}>
          <Text style={styles.cardTitle}>{s.nombre}</Text>
          <Text style={styles.cardText}>{s.descripcion}</Text>
          <Text style={styles.cardText}>
            {s.duracionMinutos} min · {formatPrecio(s.precio)}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}
