import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { clientesApi } from '../api/services';
import { Cliente } from '../api/types';
import { Avatar, BottomSheet, Message, Skeleton, font, theme } from './ui';

interface Props {
  visible: boolean;
  seleccionadoId?: string | null;
  onSelect: (cliente: Cliente) => void;
  onClose: () => void;
}

/** Modal para elegir un cliente, con buscador (GET /clientes?q=). */
export default function ClientePicker({ visible, seleccionadoId, onSelect, onClose }: Props) {
  const [q, setQ] = useState('');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Búsqueda con debounce mientras el modal está abierto
  useEffect(() => {
    if (!visible) return;
    let cancelado = false;
    setCargando(true);
    const timer = setTimeout(() => {
      clientesApi
        .buscar(q)
        .then((lista) => {
          if (!cancelado) {
            setClientes(lista);
            setError(null);
          }
        })
        .catch((e: Error) => !cancelado && setError(e.message))
        .finally(() => !cancelado && setCargando(false));
    }, 300);
    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [q, visible]);

  return (
    <BottomSheet visible={visible} title="Elegir cliente" onClose={onClose}>
      <View style={s.buscador}>
        <Feather name="search" size={18} color={theme.colors.primary} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Nombre, teléfono o correo"
          placeholderTextColor="#B497A9"
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Buscar cliente"
          style={[s.input, font('body', 500)]}
        />
      </View>
      <Message text={error} />
      <View style={s.lista}>
        {cargando && clientes.length === 0 ? (
          [0, 1, 2].map((i) => <Skeleton key={i} width="100%" height={52} style={{ borderRadius: 18 }} />)
        ) : clientes.length === 0 ? (
          <Text style={[s.vacio, font('body', 500)]}>
            {q.trim() ? 'Ningún cliente coincide con la búsqueda' : 'Aún no hay clientes registrados'}
          </Text>
        ) : (
          clientes.map((c, i) => {
            const activo = c.id === seleccionadoId;
            return (
              <Pressable
                key={c.id}
                onPress={() => onSelect(c)}
                accessibilityRole="button"
                accessibilityState={{ selected: activo }}
                accessibilityLabel={c.nombreCompleto}
                style={({ pressed }) => [s.fila, activo && s.filaActiva, pressed && { opacity: 0.85 }]}
              >
                <Avatar nombre={c.nombreCompleto} index={i} />
                <View style={{ flex: 1 }}>
                  <Text style={[s.nombre, font('body', 600)]} numberOfLines={1}>
                    {c.nombreCompleto}
                  </Text>
                  <Text style={[s.telefono, font('body', 400)]}>{c.telefono}</Text>
                </View>
                {activo && <Feather name="check" size={18} color={theme.colors.primary} />}
              </Pressable>
            );
          })
        )}
      </View>
    </BottomSheet>
  );
}

const s = StyleSheet.create({
  buscador: {
    height: 50,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: theme.colors.text,
  },
  lista: {
    marginTop: 12,
    gap: 8,
    paddingBottom: 8,
  },
  fila: {
    height: 52,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 8,
  },
  filaActiva: {
    backgroundColor: theme.colors.pink50,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  nombre: {
    fontSize: 14,
    color: theme.colors.text,
  },
  telefono: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  vacio: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 16,
  },
});
