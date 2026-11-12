import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { citasApi } from '../api/services';
import { Cita } from '../api/types';
import { AppButton, Field, Message, colors, formatPrecio, styles } from '../components/ui';

export default function CitasScreen() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [fecha, setFecha] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const cargar = useCallback(async (filtroFecha: string) => {
    setError(null);
    setLoading(true);
    try {
      setCitas(await citasApi.listar({ fecha: filtroFecha.trim() || undefined }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Recarga cada vez que se entra a la pantalla
  useFocusEffect(
    useCallback(() => {
      cargar('');
    }, [cargar])
  );

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.title}>Citas</Text>
      <Field label="Filtrar por fecha (AAAA-MM-DD)" value={fecha} onChangeText={setFecha} placeholder="Todas" />
      <AppButton title="Buscar" onPress={() => cargar(fecha)} loading={loading} />
      {fecha !== '' && (
        <AppButton
          title="Ver todas"
          variant="outline"
          onPress={() => {
            setFecha('');
            cargar('');
          }}
        />
      )}
      <Message text={error} />

      <Text style={styles.subtitle}>{citas.length} cita(s)</Text>
      {loading && <ActivityIndicator color={colors.primary} />}
      {!loading && citas.length === 0 && <Text style={styles.empty}>No hay citas</Text>}
      {citas.map((c) => (
        <View key={c.id} style={styles.card}>
          <Text style={styles.cardTitle}>
            {c.fecha} · {c.hora} - {c.horaFin}
          </Text>
          <Text style={styles.cardText}>{c.clienteNombre}</Text>
          <Text style={styles.cardText}>
            {c.servicioNombre} · {formatPrecio(c.precio)}
          </Text>
          <Text style={styles.cardText}>Estado: {c.estado}</Text>
          {c.notas !== '' && <Text style={styles.cardText}>Notas: {c.notas}</Text>}
        </View>
      ))}
    </ScrollView>
  );
}
