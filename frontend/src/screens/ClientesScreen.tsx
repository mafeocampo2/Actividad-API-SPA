import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { clientesApi } from '../api/services';
import { Cita, Cliente } from '../api/types';
import ClienteForm from '../components/ClienteForm';
import {
  AppButton,
  Avatar,
  BottomSheet,
  Circulo,
  ConfirmDialog,
  EstadoPill,
  Message,
  Skeleton,
  font,
  formatFechaCita,
  theme,
} from '../components/ui';

const MAX_VISIBLES = 5;
const DEBOUNCE_MS = 300;

const contador = (n: number) => (n === 0 ? 'Sin resultados' : n === 1 ? '1 resultado' : `${n} resultados`);

export default function ClientesScreen() {
  const insets = useSafeAreaInsets();

  // Lista y búsqueda
  const [q, setQ] = useState('');
  const [resultados, setResultados] = useState<Cliente[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verTodos, setVerTodos] = useState(false);
  const [version, setVersion] = useState(0); // al cambiar, se recarga todo
  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  // Ficha
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null);
  const [historial, setHistorial] = useState<Cita[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [mensajeFicha, setMensajeFicha] = useState<string | null>(null);

  // Modales
  const [sheet, setSheet] = useState<'crear' | 'editar' | null>(null);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  // Si no hay uno seleccionado (o ya no aparece en la búsqueda), se muestra el primero
  const seleccionado = resultados.find((c) => c.id === seleccionadoId) ?? resultados[0] ?? null;
  const visibles = verTodos ? resultados : resultados.slice(0, MAX_VISIBLES);
  const ocultos = resultados.length - visibles.length;
  const tienePendientes = historial.some((c) => c.estado === 'PENDIENTE' || c.estado === 'CONFIRMADA');

  // Recarga al entrar a la pantalla
  useFocusEffect(recargar);

  // Total de clientes registrados
  useEffect(() => {
    clientesApi
      .listar()
      .then((todos) => setTotal(todos.length))
      .catch(() => setTotal(null));
  }, [version]);

  // Búsqueda con debounce
  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    const timer = setTimeout(async () => {
      try {
        const lista = await clientesApi.buscar(q);
        if (!cancelado) {
          setResultados(lista);
          setError(null);
        }
      } catch (e) {
        if (!cancelado) setError((e as Error).message);
      } finally {
        if (!cancelado) setCargando(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [q, version]);

  // Historial del cliente seleccionado
  const seleccionadoActualId = seleccionado?.id ?? null;
  useEffect(() => {
    setMensajeFicha(null);
    if (!seleccionadoActualId) {
      setHistorial([]);
      return;
    }
    let cancelado = false;
    setCargandoHistorial(true);
    clientesApi
      .historial(seleccionadoActualId)
      .then((citas) => !cancelado && setHistorial(citas))
      .catch((e: Error) => !cancelado && setMensajeFicha(e.message))
      .finally(() => !cancelado && setCargandoHistorial(false));
    return () => {
      cancelado = true;
    };
  }, [seleccionadoActualId, version]);

  const buscar = (texto: string) => {
    setQ(texto);
    setVerTodos(false);
  };

  const alGuardar = (cliente: Cliente) => {
    if (sheet === 'crear') {
      setQ('');
      setSeleccionadoId(cliente.id);
      setVerTodos(true); // el nuevo queda al final: se muestra la lista completa para verlo marcado
    }
    setSheet(null);
    recargar();
  };

  const eliminar = async () => {
    if (!seleccionado) return;
    setEliminando(true);
    try {
      await clientesApi.eliminar(seleccionado.id);
      setSeleccionadoId(null);
      recargar();
    } catch (e) {
      // 409 CLIENTE_CON_CITAS_PENDIENTES u otro error
      setMensajeFicha((e as Error).message);
      // El historial pudo cambiar desde que se cargó: se actualiza para mostrar el aviso
      clientesApi.historial(seleccionado.id).then(setHistorial).catch(() => {});
    } finally {
      setEliminando(false);
      setConfirmarEliminar(false);
    }
  };

  return (
    <View style={s.root}>
      <Circulo size={260} color={theme.colors.pink50} style={{ top: -110, left: -100 }} />

      <ScrollView contentContainerStyle={[s.content, { paddingTop: 20 + insets.top }]} keyboardShouldPersistTaps="handled">
        {/* 1. Encabezado */}
        <View style={s.header}>
          <View style={{ flex: 1 }}>
            <Text style={[s.titulo, font('display', 700)]}>Clientes</Text>
            <Text style={[s.registrados, font('body', 500)]}>
              {total === null ? ' ' : `${total} ${total === 1 ? 'registrado' : 'registrados'}`}
            </Text>
          </View>
          <Pressable
            onPress={() => setSheet('crear')}
            accessibilityRole="button"
            accessibilityLabel="Nuevo cliente"
            style={({ pressed }) => [s.nuevo, pressed && { opacity: 0.85 }]}
          >
            <Feather name="user-plus" size={18} color="#fff" />
            <Text style={[s.nuevoTexto, font('body', 700)]}>Nuevo</Text>
          </Pressable>
        </View>

        {/* 2. Buscador */}
        <Text style={[s.buscarLabel, font('body', 600)]}>Buscar cliente</Text>
        <View style={s.buscador}>
          <Feather name="search" size={18} color={theme.colors.primary} />
          <TextInput
            value={q}
            onChangeText={buscar}
            placeholder="Nombre, teléfono o correo"
            placeholderTextColor="#B497A9"
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Buscar cliente"
            style={[s.buscarInput, font('body', 500)]}
          />
          {q.trim() !== '' && !cargando && (
            <Text style={[s.contador, font('body', 600)]}>{contador(resultados.length)}</Text>
          )}
        </View>

        {/* 3. Resultados */}
        <View style={s.lista}>
          {error ? (
            <View>
              <Message text={error} />
              <AppButton title="Reintentar" variant="outline" onPress={recargar} />
            </View>
          ) : cargando && resultados.length === 0 ? (
            [0, 1, 2].map((i) => <Skeleton key={i} width="100%" height={52} style={{ borderRadius: 18 }} />)
          ) : resultados.length === 0 ? (
            <View style={s.vacio}>
              <Text style={[s.vacioTexto, font('body', 500)]}>
                {q.trim() ? 'Ningún cliente coincide con la búsqueda' : 'Aún no hay clientes. Crea el primero con "Nuevo".'}
              </Text>
            </View>
          ) : (
            <>
              {visibles.map((c, i) => {
                const activo = c.id === seleccionado?.id;
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => setSeleccionadoId(c.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: activo }}
                    accessibilityLabel={c.nombreCompleto}
                    style={({ pressed }) => [s.fila, activo && s.filaActiva, pressed && { opacity: 0.85 }]}
                  >
                    <Avatar nombre={c.nombreCompleto} index={i} />
                    <View style={{ flex: 1 }}>
                      <Text style={[s.filaNombre, font('body', 600)]} numberOfLines={1}>
                        {c.nombreCompleto}
                      </Text>
                      <Text style={[s.filaTelefono, font('body', 400)]}>{c.telefono}</Text>
                    </View>
                    <Feather name="chevron-right" size={18} color="#B48AA4" />
                  </Pressable>
                );
              })}
              {ocultos > 0 && (
                <Pressable onPress={() => setVerTodos(true)} accessibilityRole="button" style={s.verMas}>
                  <Text style={[s.verMasTexto, font('body', 700)]}>Ver {ocultos} más</Text>
                </Pressable>
              )}
            </>
          )}
        </View>

        {/* 4. Ficha del cliente */}
        {seleccionado && !error && (
          <View style={s.ficha}>
            <View style={s.fichaHeader}>
              <Avatar nombre={seleccionado.nombreCompleto} size={48} radius={16} color={theme.colors.pink200} />
              <View style={{ flex: 1 }}>
                <Text style={[s.fichaNombre, font('display', 700)]} numberOfLines={1}>
                  {seleccionado.nombreCompleto}
                </Text>
                <Text style={[s.fichaId, font('body', 400)]}>ID {seleccionado.id}</Text>
              </View>
              <Pressable
                onPress={() => setSheet('editar')}
                accessibilityRole="button"
                accessibilityLabel={`Editar a ${seleccionado.nombreCompleto}`}
                style={({ pressed }) => [s.accion, { backgroundColor: theme.colors.pink50 }, pressed && { opacity: 0.8 }]}
              >
                <Feather name="edit-2" size={18} color={theme.colors.primary} />
              </Pressable>
              <Pressable
                onPress={() => setConfirmarEliminar(true)}
                disabled={tienePendientes || cargandoHistorial}
                accessibilityRole="button"
                accessibilityLabel={`Eliminar a ${seleccionado.nombreCompleto}`}
                accessibilityState={{ disabled: tienePendientes || cargandoHistorial }}
                style={[s.accion, { backgroundColor: theme.estados.CANCELADA.bg }, (tienePendientes || cargandoHistorial) && { opacity: 0.4 }]}
              >
                <Feather name="trash-2" size={18} color={theme.estados.CANCELADA.fg} />
              </Pressable>
            </View>

            <View style={s.contactos}>
              <View style={s.contacto}>
                <Feather name="phone" size={14} color={theme.colors.primary} />
                <Text style={[s.contactoTexto, font('body', 500)]}>{seleccionado.telefono}</Text>
              </View>
              <View style={s.contacto}>
                <Feather name="mail" size={14} color={theme.colors.primary} />
                <Text style={[s.contactoTexto, font('body', 500)]}>{seleccionado.email}</Text>
              </View>
            </View>

            {tienePendientes && (
              <View style={s.aviso}>
                <Feather name="alert-circle" size={16} color={theme.estados.PENDIENTE.fg} />
                <Text style={[s.avisoTexto, font('body', 500)]}>Tiene citas pendientes: no se puede eliminar todavía</Text>
              </View>
            )}
            <Message text={mensajeFicha} />

            <View style={s.separador} />
            <Text style={[s.historialTitulo, font('body', 700)]}>Historial de citas</Text>
            {cargandoHistorial ? (
              [0, 1].map((i) => <Skeleton key={i} width="100%" height={34} />)
            ) : historial.length === 0 ? (
              <Text style={[s.historialVacio, font('body', 400)]}>Sin citas todavía</Text>
            ) : (
              historial.map((cita) => (
                <View key={cita.id} style={s.cita}>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.citaServicio, font('body', 600)]}>{cita.servicioNombre}</Text>
                    <Text style={[s.citaFecha, font('body', 400)]}>{formatFechaCita(cita.fecha, cita.hora)}</Text>
                  </View>
                  <EstadoPill estado={cita.estado} />
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      <BottomSheet
        visible={sheet !== null}
        title={sheet === 'editar' ? 'Editar cliente' : 'Nuevo cliente'}
        onClose={() => setSheet(null)}
      >
        <ClienteForm cliente={sheet === 'editar' ? seleccionado : null} onGuardado={alGuardar} />
      </BottomSheet>

      <ConfirmDialog
        visible={confirmarEliminar}
        title="Eliminar cliente"
        message={`¿Seguro que quieres eliminar a ${seleccionado?.nombreCompleto ?? 'este cliente'}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        danger
        loading={eliminando}
        onConfirm={eliminar}
        onCancel={() => setConfirmarEliminar(false)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
    overflow: 'hidden',
  },
  content: {
    paddingHorizontal: 22,
    paddingBottom: 48,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  titulo: {
    fontSize: 28,
    color: theme.colors.text,
  },
  registrados: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  nuevo: {
    height: 44,
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary,
  },
  nuevoTexto: {
    fontSize: 14,
    color: '#fff',
  },
  buscarLabel: {
    marginTop: 16,
    marginBottom: 6,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
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
  buscarInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: theme.colors.text,
  },
  contador: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  lista: {
    marginTop: 12,
    gap: 8,
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
  filaNombre: {
    fontSize: 14,
    color: theme.colors.text,
  },
  filaTelefono: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  verMas: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verMasTexto: {
    fontSize: 13,
    color: theme.colors.primary,
  },
  vacio: {
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: theme.colors.borderNuevo,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  vacioTexto: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  ficha: {
    marginTop: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 26,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    boxShadow: '0px 6px 18px rgba(142, 74, 135, 0.08)',
    gap: 8,
  },
  fichaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fichaNombre: {
    fontSize: 18,
    color: theme.colors.text,
  },
  fichaId: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  accion: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  contacto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  contactoTexto: {
    fontSize: 12,
    color: theme.colors.text,
  },
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.estados.PENDIENTE.bg,
    borderRadius: 12,
    padding: 10,
  },
  avisoTexto: {
    flex: 1,
    fontSize: 12,
    color: theme.estados.PENDIENTE.fg,
  },
  separador: {
    height: 1,
    backgroundColor: theme.colors.borderSoft,
    marginVertical: 4,
  },
  historialTitulo: {
    fontSize: 14,
    color: theme.colors.text,
  },
  historialVacio: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  cita: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 5,
  },
  citaServicio: {
    fontSize: 13,
    color: theme.colors.text,
  },
  citaFecha: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
});
