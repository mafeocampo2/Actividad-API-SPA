import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { citasApi, clientesApi, serviciosApi } from '../api/services';
import { Cliente, Servicio } from '../api/types';
import { AppButton, Chip, Field, Message, formatPrecio, styles } from '../components/ui';
import { AppStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<AppStackParamList, 'AgendarCita'>;

const hoy = () => {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
};

export default function AgendarCitaScreen({ navigation }: Props) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [servicioId, setServicioId] = useState<string | null>(null);
  const [fecha, setFecha] = useState(hoy());
  const [hora, setHora] = useState('10:00');
  const [notas, setNotas] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([clientesApi.listar(), serviciosApi.listar()])
      .then(([c, s]) => {
        setClientes(c);
        setServicios(s);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  const agendar = async () => {
    setError(null);
    setExito(null);
    if (!clienteId || !servicioId) {
      setError('Selecciona un cliente y un servicio');
      return;
    }
    setLoading(true);
    try {
      const cita = await citasApi.agendar({
        clienteId,
        servicioId,
        fecha: fecha.trim(),
        hora: hora.trim(),
        notas: notas.trim() || undefined,
      });
      setExito(`Cita agendada: ${cita.servicioNombre} el ${cita.fecha} de ${cita.hora} a ${cita.horaFin}`);
      setNotas('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.title}>Agendar cita</Text>

      <Text style={styles.label}>Cliente</Text>
      {clientes.length === 0 ? (
        <>
          <Text style={styles.empty}>No hay clientes. Registra uno primero.</Text>
          <AppButton title="Ir a Clientes" onPress={() => navigation.navigate('Clientes')} variant="outline" />
        </>
      ) : (
        <View style={styles.chips}>
          {clientes.map((c) => (
            <Chip key={c.id} label={c.nombreCompleto} selected={clienteId === c.id} onPress={() => setClienteId(c.id)} />
          ))}
        </View>
      )}

      <Text style={[styles.label, { marginTop: 12 }]}>Servicio</Text>
      <View style={styles.chips}>
        {servicios.map((s) => (
          <Chip
            key={s.id}
            label={`${s.nombre} (${s.duracionMinutos} min · ${formatPrecio(s.precio)})`}
            selected={servicioId === s.id}
            onPress={() => setServicioId(s.id)}
          />
        ))}
      </View>

      <Field label="Fecha (AAAA-MM-DD)" value={fecha} onChangeText={setFecha} placeholder="2026-11-20" />
      <Field label="Hora (HH:mm, 24h)" value={hora} onChangeText={setHora} placeholder="10:00" />
      <Field label="Notas (opcional)" value={notas} onChangeText={setNotas} autoCapitalize="sentences" />

      <Message text={error} />
      <Message text={exito} type="success" />
      <AppButton title="Agendar" onPress={agendar} loading={loading} />
      <AppButton title="Ver citas" onPress={() => navigation.navigate('Citas')} variant="outline" />
    </ScrollView>
  );
}
