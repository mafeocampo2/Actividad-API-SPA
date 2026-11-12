import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { clientesApi } from '../api/services';
import { Cliente, ClienteRequest } from '../api/types';
import { AppButton, Field, Message } from './ui';

const vacio: ClienteRequest = { nombre: '', apellido: '', telefono: '', email: '' };

interface Props {
  /** Si viene, el formulario edita ese cliente (PUT); si no, crea uno nuevo (POST). */
  cliente?: Cliente | null;
  onGuardado: (cliente: Cliente) => void;
}

/** Formulario de cliente: sirve para crear y para editar. */
export default function ClienteForm({ cliente, onGuardado }: Props) {
  const [form, setForm] = useState<ClienteRequest>(vacio);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Carga los datos al abrir el formulario para otro cliente
  useEffect(() => {
    setForm(
      cliente
        ? { nombre: cliente.nombre, apellido: cliente.apellido, telefono: cliente.telefono, email: cliente.email }
        : vacio
    );
    setError(null);
  }, [cliente]);

  const set = (campo: keyof ClienteRequest) => (valor: string) => setForm((f) => ({ ...f, [campo]: valor }));

  const guardar = async () => {
    setError(null);
    const datos = {
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      telefono: form.telefono.trim(),
      email: form.email.trim(),
    };
    if (!datos.nombre || !datos.apellido || !datos.telefono || !datos.email) {
      setError('Todos los campos son obligatorios');
      return;
    }
    setLoading(true);
    try {
      const guardado = cliente ? await clientesApi.actualizar(cliente.id, datos) : await clientesApi.crear(datos);
      onGuardado(guardado);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <Field label="Nombre" value={form.nombre} onChangeText={set('nombre')} autoCapitalize="words" />
      <Field label="Apellido" value={form.apellido} onChangeText={set('apellido')} autoCapitalize="words" />
      <Field label="Teléfono" value={form.telefono} onChangeText={set('telefono')} keyboardType="phone-pad" />
      <Field label="Email" value={form.email} onChangeText={set('email')} keyboardType="email-address" />
      <Message text={error} />
      <AppButton title={cliente ? 'Guardar cambios' : 'Guardar cliente'} onPress={guardar} loading={loading} />
    </View>
  );
}
