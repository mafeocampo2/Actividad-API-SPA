import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { clientesApi } from '../api/services';
import { Cliente } from '../api/types';
import { AppButton, Field, Message, styles } from '../components/ui';

const vacio = { nombre: '', apellido: '', telefono: '', email: '' };

export default function ClientesScreen() {
  const [form, setForm] = useState(vacio);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setClientes(await clientesApi.listar());
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const set = (campo: keyof typeof vacio) => (valor: string) =>
    setForm((f) => ({ ...f, [campo]: valor }));

  const guardar = async () => {
    setError(null);
    setExito(null);
    if (!form.nombre || !form.apellido || !form.telefono || !form.email) {
      setError('Todos los campos son obligatorios');
      return;
    }
    setLoading(true);
    try {
      const cliente = await clientesApi.crear({ ...form, email: form.email.trim() });
      setExito(`Cliente ${cliente.nombreCompleto} registrado`);
      setForm(vacio);
      await cargar();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.title}>Registrar cliente</Text>
      <Field label="Nombre" value={form.nombre} onChangeText={set('nombre')} autoCapitalize="words" />
      <Field label="Apellido" value={form.apellido} onChangeText={set('apellido')} autoCapitalize="words" />
      <Field label="Teléfono" value={form.telefono} onChangeText={set('telefono')} keyboardType="phone-pad" />
      <Field label="Email" value={form.email} onChangeText={set('email')} keyboardType="email-address" />
      <Message text={error} />
      <Message text={exito} type="success" />
      <AppButton title="Guardar cliente" onPress={guardar} loading={loading} />

      <Text style={styles.subtitle}>Clientes registrados</Text>
      {clientes.length === 0 && <Text style={styles.empty}>Aún no hay clientes</Text>}
      {clientes.map((c) => (
        <View key={c.id} style={styles.card}>
          <Text style={styles.cardTitle}>{c.nombreCompleto}</Text>
          <Text style={styles.cardText}>{c.email}</Text>
          <Text style={styles.cardText}>{c.telefono}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
