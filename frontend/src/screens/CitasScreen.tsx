import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { CompositeScreenProps, useFocusEffect } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { citasApi } from '../api/services';
import { Cita } from '../api/types';
import { AppButton, EstadoPill, Field, Message, colors, font, formatPrecio, styles, theme } from '../components/ui';
import { AppStackParamList, TabParamList } from '../types/navigation';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Citas'>,
  NativeStackScreenProps<AppStackParamList>
>;

const REAGENDABLES = ['PENDIENTE', 'CONFIRMADA'];

export default function CitasScreen({ navigation, route }: Props) {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [fecha, setFecha] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fechaParam = route.params?.fecha;

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

  // Recarga cada vez que se entra a la pantalla.
  // Si llega una fecha (por ejemplo, después de agendar), se filtra por ese día.
  useFocusEffect(
    useCallback(() => {
      const f = fechaParam ?? '';
      setFecha(f);
      cargar(f);
    }, [cargar, fechaParam])
  );

  const verTodas = () => {
    setFecha('');
    navigation.setParams({ fecha: undefined });
    cargar('');
  };

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.title}>Citas</Text>
      <Field label="Filtrar por fecha (AAAA-MM-DD)" value={fecha} onChangeText={setFecha} placeholder="Todas" />
      <AppButton title="Buscar" onPress={() => cargar(fecha)} loading={loading} />
      {fecha !== '' && <AppButton title="Ver todas" variant="outline" onPress={verTodas} />}
      <Message text={error} />

      <Text style={styles.subtitle}>{citas.length} cita(s)</Text>
      {loading && <ActivityIndicator color={colors.primary} />}
      {!loading && citas.length === 0 && <Text style={styles.empty}>No hay citas</Text>}
      {citas.map((c) => (
        <View key={c.id} style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
            <Text style={[styles.cardTitle, { flex: 1 }]}>
              {c.fecha} · {c.hora} - {c.horaFin}
            </Text>
            <EstadoPill estado={c.estado} />
          </View>
          <Text style={styles.cardText}>{c.clienteNombre}</Text>
          <Text style={styles.cardText}>
            {c.servicioNombre} · {formatPrecio(c.precio)}
          </Text>
          {c.notas !== '' && <Text style={styles.cardText}>Notas: {c.notas}</Text>}
          {REAGENDABLES.includes(c.estado) && (
            <Pressable
              onPress={() => navigation.navigate('AgendarCita', { citaId: c.id })}
              accessibilityRole="button"
              accessibilityLabel={`Reagendar la cita de ${c.clienteNombre}`}
              style={({ pressed }) => [
                {
                  marginTop: 10,
                  minHeight: 44,
                  borderRadius: theme.radius.md,
                  backgroundColor: theme.colors.pink50,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Feather name="calendar" size={16} color={theme.colors.primary} />
              <Text style={[{ color: theme.colors.primary, fontSize: 14 }, font('body', 700)]}>Reagendar</Text>
            </Pressable>
          )}
        </View>
      ))}
    </ScrollView>
  );
}
