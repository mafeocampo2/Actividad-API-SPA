import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { CompositeScreenProps, useFocusEffect } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { citasApi } from '../api/services';
import { Cita, EstadoCita } from '../api/types';
import {
  AppButton,
  BottomSheet,
  Circulo,
  EstadoPill,
  Message,
  Skeleton,
  Toast,
  diaCorto,
  diaMedio,
  fechaLocalISO,
  font,
  formatPrecio,
  parseFechaLocal,
  sumarDias,
  theme,
} from '../components/ui';
import { AppStackParamList, TabParamList } from '../types/navigation';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Citas'>,
  NativeStackScreenProps<AppStackParamList>
>;

type Filtro = 'todas' | 'pendientes' | 'completadas' | 'canceladas' | 'no_asistio';

const FILTROS: { clave: Filtro; etiqueta: string; estados: EstadoCita[] | null; vacio: string }[] = [
  { clave: 'todas', etiqueta: 'Todas', estados: null, vacio: 'No hay citas este día' },
  { clave: 'pendientes', etiqueta: 'Pendientes', estados: ['PENDIENTE', 'CONFIRMADA'], vacio: 'No hay citas pendientes este día' },
  { clave: 'completadas', etiqueta: 'Completadas', estados: ['COMPLETADA'], vacio: 'No hay citas completadas este día' },
  { clave: 'canceladas', etiqueta: 'Canceladas', estados: ['CANCELADA'], vacio: 'No hay citas canceladas este día' },
  { clave: 'no_asistio', etiqueta: 'No asistió', estados: ['NO_ASISTIO'], vacio: 'Nadie faltó a su cita este día' },
];

const ABIERTAS: EstadoCita[] = ['PENDIENTE', 'CONFIRMADA'];
const MAX_MOTIVO = 200;
const MORADO = theme.estados.NO_ASISTIO;
const ROJO = theme.estados.CANCELADA;
const VERDE = theme.estados.COMPLETADA;

const resumenCita = (c: Cita) => `${c.servicioNombre} · ${diaCorto(parseFechaLocal(c.fecha))} · ${c.hora}`;

export default function CitasScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const [fecha, setFecha] = useState(() => parseFechaLocal(fechaLocalISO()));
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const [citas, setCitas] = useState<Cita[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null); // error de una acción
  const [version, setVersion] = useState(0);
  const [expandida, setExpandida] = useState<string | null>(null);
  const [completando, setCompletando] = useState<string | null>(null);
  const [toast, setToast] = useState<{ titulo: string; detalle: string } | null>(null);
  const [sheet, setSheet] = useState<{ tipo: 'cancelar' | 'no_asistio'; cita: Cita } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fechaISO = fechaLocalISO(fecha);
  const esHoy = fechaISO === fechaLocalISO();
  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  // Al entrar: si llega una fecha (por ejemplo, después de agendar) se abre ese día; luego se recarga
  const fechaParam = route.params?.fecha;
  useFocusEffect(
    useCallback(() => {
      if (fechaParam) {
        setFecha(parseFechaLocal(fechaParam));
        setFiltro('todas');
        navigation.setParams({ fecha: undefined });
      }
      recargar();
    }, [fechaParam, navigation, recargar])
  );

  // Citas del día: una sola llamada; los filtros y contadores se calculan aquí
  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    citasApi
      .listar({ fecha: fechaISO })
      .then((lista) => {
        if (cancelado) return;
        setCitas(lista);
        setError(null);
      })
      .catch((e: Error) => !cancelado && setError(e.message))
      .finally(() => !cancelado && setCargando(false));
    return () => {
      cancelado = true;
    };
  }, [fechaISO, version]);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const mostrarToast = (titulo: string, detalle: string) => {
    setToast({ titulo, detalle });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  };

  // Errores de las acciones: 409 = la cita cambió mientras tanto
  const manejarError = (e: unknown) => {
    const status = (e as { status?: number }).status;
    setAviso(status === 409 ? 'Esta cita ya había cambiado de estado. Actualizamos la lista.' : (e as Error).message);
    recargar();
  };

  const cambiarDia = (dias: number) => {
    setFecha((f) => sumarDias(f, dias));
    setExpandida(null);
    setAviso(null);
  };

  const completar = async (cita: Cita) => {
    setAviso(null);
    setCompletando(cita.id);
    try {
      await citasApi.cambiarEstado(cita.id, 'COMPLETADA');
      setExpandida(null);
      mostrarToast('Cita completada', `${cita.clienteNombre} · ${cita.servicioNombre}`);
      recargar();
    } catch (e) {
      manejarError(e);
    } finally {
      setCompletando(null);
    }
  };

  const contar = (f: (typeof FILTROS)[number]) =>
    f.estados ? citas.filter((c) => f.estados!.includes(c.estado)).length : citas.length;
  const filtroActual = FILTROS.find((f) => f.clave === filtro)!;
  const visibles = filtroActual.estados ? citas.filter((c) => filtroActual.estados!.includes(c.estado)) : citas;
  const pendientes = contar(FILTROS[1]!);

  return (
    <View style={s.root}>
      <Circulo size={230} color={theme.colors.pink50} style={{ top: -90, right: -90 }} />

      <ScrollView contentContainerStyle={{ paddingTop: 24 + insets.top, paddingBottom: 48 }}>
        {/* Encabezado */}
        <View style={s.px}>
          <Text style={[s.titulo, font('display', 700)]}>Citas</Text>
          <Text style={[s.subtitulo, font('body', 400)]}>
            {cargando && citas.length === 0
              ? ' '
              : `${citas.length} ${citas.length === 1 ? 'cita' : 'citas'} · ${pendientes} ${pendientes === 1 ? 'pendiente' : 'pendientes'}`}
          </Text>

          {/* Selector de día */}
          <View style={s.dia}>
            <Pressable onPress={() => cambiarDia(-1)} accessibilityRole="button" accessibilityLabel="Día anterior" style={s.flecha}>
              <Feather name="chevron-left" size={22} color={theme.colors.primary} />
            </Pressable>
            <Pressable
              onPress={() => !esHoy && cambiarDia(Math.round((parseFechaLocal(fechaLocalISO()).getTime() - fecha.getTime()) / 86400000))}
              accessibilityRole="button"
              accessibilityLabel={esHoy ? `${diaMedio(fecha)}, hoy` : `${diaMedio(fecha)}. Toca para volver a hoy`}
              style={s.diaCentro}
            >
              <Feather name="calendar" size={18} color={theme.colors.primary} />
              <Text style={[s.diaTexto, font('body', 700)]} numberOfLines={1}>
                {diaMedio(fecha)}
              </Text>
              {esHoy && (
                <View style={s.hoy}>
                  <Text style={[s.hoyTexto, font('body', 700)]}>HOY</Text>
                </View>
              )}
            </Pressable>
            <Pressable onPress={() => cambiarDia(1)} accessibilityRole="button" accessibilityLabel="Día siguiente" style={s.flecha}>
              <Feather name="chevron-right" size={22} color={theme.colors.primary} />
            </Pressable>
          </View>
        </View>

        {/* Filtros */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filtros}>
          {FILTROS.map((f) => {
            const activo = f.clave === filtro;
            const n = contar(f);
            return (
              <Pressable
                key={f.clave}
                onPress={() => {
                  setFiltro(f.clave);
                  setExpandida(null);
                }}
                accessibilityRole="tab"
                accessibilityState={{ selected: activo }}
                accessibilityLabel={`${f.etiqueta}: ${n}`}
                style={[s.filtro, activo && s.filtroActivo]}
              >
                <Text style={[s.filtroTexto, font('body', 600), activo && { color: '#fff' }]}>{f.etiqueta}</Text>
                <View style={[s.contador, activo && { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                  <Text style={[s.contadorTexto, font('body', 700), activo && { color: '#fff' }]}>{n}</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={s.px}>
          <Message text={aviso} />

          {/* Lista */}
          {error ? (
            <View>
              <Message text={error} />
              <AppButton title="Reintentar" variant="outline" onPress={recargar} />
            </View>
          ) : cargando && citas.length === 0 ? (
            <View style={s.lista}>
              {[0, 1, 2, 3].map((i) => (
                <View key={i} style={s.fila}>
                  <View style={s.horaCol}>
                    <Skeleton width={40} height={16} />
                  </View>
                  <Skeleton width="100%" height={72} style={{ flex: 1, borderRadius: 20 }} />
                </View>
              ))}
            </View>
          ) : visibles.length === 0 ? (
            <View style={s.vacio}>
              <Text style={[s.vacioTexto, font('body', 500)]}>{filtroActual.vacio}</Text>
            </View>
          ) : (
            <View style={[s.lista, cargando && { opacity: 0.6 }]}>
              {visibles.map((cita) => (
                <CitaFila
                  key={cita.id}
                  cita={cita}
                  expandida={expandida === cita.id}
                  completando={completando === cita.id}
                  onToggle={() => setExpandida((id) => (id === cita.id ? null : cita.id))}
                  onCompletar={() => completar(cita)}
                  onReagendar={() => navigation.navigate('AgendarCita', { citaId: cita.id })}
                  onCancelar={() => setSheet({ tipo: 'cancelar', cita })}
                  onNoAsistio={() => setSheet({ tipo: 'no_asistio', cita })}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {toast && <Toast titulo={toast.titulo} detalle={toast.detalle} onClose={() => setToast(null)} />}

      <CancelarSheet
        cita={sheet?.tipo === 'cancelar' ? sheet.cita : null}
        onClose={() => setSheet(null)}
        onHecho={(cita) => {
          setSheet(null);
          setExpandida(null);
          mostrarToast('Cita cancelada', `${cita.clienteNombre} · ${cita.hora}`);
          recargar();
        }}
        onError={(e) => {
          setSheet(null);
          manejarError(e);
        }}
      />
      <NoAsistioSheet
        cita={sheet?.tipo === 'no_asistio' ? sheet.cita : null}
        onClose={() => setSheet(null)}
        onHecho={(cita) => {
          setSheet(null);
          setExpandida(null);
          mostrarToast('Marcada como no asistió', `${cita.clienteNombre} · ${cita.hora}`);
          recargar();
        }}
        onError={(e) => {
          setSheet(null);
          manejarError(e);
        }}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Fila de la lista
// ---------------------------------------------------------------------------

function CitaFila({
  cita,
  expandida,
  completando,
  onToggle,
  onCompletar,
  onReagendar,
  onCancelar,
  onNoAsistio,
}: {
  cita: Cita;
  expandida: boolean;
  completando: boolean;
  onToggle: () => void;
  onCompletar: () => void;
  onReagendar: () => void;
  onCancelar: () => void;
  onNoAsistio: () => void;
}) {
  const abierta = ABIERTAS.includes(cita.estado);
  const cancelada = cita.estado === 'CANCELADA';

  return (
    <View style={s.fila}>
      <View style={s.horaCol}>
        <Text style={[s.hora, font('display', 700)]}>{cita.hora}</Text>
        <Text style={[s.horaFin, font('body', 400)]}>{cita.horaFin}</Text>
      </View>

      <View style={[s.card, cancelada && s.cardCancelada, expandida && s.cardExpandida]}>
        <Pressable
          onPress={onToggle}
          accessibilityRole="button"
          accessibilityState={{ expanded: expandida }}
          accessibilityLabel={`${cita.hora}, ${cita.clienteNombre}, ${cita.servicioNombre}, ${theme.estados[cita.estado].label}`}
          accessibilityHint={abierta ? 'Muestra las acciones' : 'Muestra el detalle'}
          style={s.cardHeader}
        >
          <View style={{ flex: 1 }}>
            <Text style={[s.cliente, font('body', 700), cancelada && { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {cita.clienteNombre}
            </Text>
            <Text style={[s.servicio, font('body', 400)]} numberOfLines={1}>
              {cita.servicioNombre} · {cita.duracionMinutos} min
            </Text>
          </View>
          <EstadoPill estado={cita.estado} />
        </Pressable>

        {expandida && abierta && (
          <View style={s.acciones}>
            <View style={s.botones}>
              <Accion icon="check" texto="Completar" fondo={VERDE.bg} color={VERDE.fg} onPress={onCompletar} cargando={completando} />
              <Accion icon="rotate-cw" texto="Reagendar" fondo={theme.colors.pink50} color={theme.colors.primary} onPress={onReagendar} />
              <Accion icon="x" texto="Cancelar" fondo={ROJO.bg} color={ROJO.fg} onPress={onCancelar} />
            </View>
            <Pressable onPress={onNoAsistio} accessibilityRole="button" style={s.enlace}>
              <Text style={[s.enlaceTexto, font('body', 600)]}>Marcar como no asistió</Text>
            </Pressable>
          </View>
        )}

        {expandida && !abierta && (
          <View style={s.detalle}>
            {cancelada && (
              <Text style={[s.detalleTexto, font('body', 400)]}>
                Motivo: {cita.motivoCancelacion || 'sin motivo'}
              </Text>
            )}
            {cita.estado === 'COMPLETADA' && (
              <Text style={[s.detalleTexto, font('body', 400)]}>Cobrado: {formatPrecio(cita.precio)}</Text>
            )}
            {cita.estado === 'NO_ASISTIO' && (
              <Text style={[s.detalleTexto, font('body', 400)]}>El cliente no llegó a la cita</Text>
            )}
            {cita.notas ? <Text style={[s.detalleTexto, font('body', 400)]}>Notas: {cita.notas}</Text> : null}
          </View>
        )}
      </View>
    </View>
  );
}

function Accion({
  icon,
  texto,
  fondo,
  color,
  onPress,
  cargando,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  texto: string;
  fondo: string;
  color: string;
  onPress: () => void;
  cargando?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={cargando}
      accessibilityRole="button"
      style={({ pressed }) => [s.accion, { backgroundColor: fondo }, (pressed || cargando) && { opacity: 0.7 }]}
    >
      <Feather name={icon} size={14} color={color} />
      <Text style={[s.accionTexto, font('body', 700), { color }]} numberOfLines={1}>
        {cargando ? '…' : texto}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Paneles de confirmación
// ---------------------------------------------------------------------------

function SheetBotones({
  confirmar,
  color,
  cargando,
  onVolver,
  onConfirmar,
}: {
  confirmar: string;
  color: string;
  cargando: boolean;
  onVolver: () => void;
  onConfirmar: () => void;
}) {
  return (
    <View style={s.sheetBotones}>
      <Pressable onPress={onVolver} accessibilityRole="button" style={[s.sheetBoton, s.sheetVolver]}>
        <Text style={[s.sheetBotonTexto, font('body', 700), { color: theme.colors.text }]}>Volver</Text>
      </Pressable>
      <Pressable
        onPress={onConfirmar}
        disabled={cargando}
        accessibilityRole="button"
        style={[s.sheetBoton, { backgroundColor: color }, cargando && { opacity: 0.7 }]}
      >
        <Text style={[s.sheetBotonTexto, font('body', 700), { color: '#fff' }]}>{cargando ? 'Guardando…' : confirmar}</Text>
      </Pressable>
    </View>
  );
}

function CancelarSheet({
  cita,
  onClose,
  onHecho,
  onError,
}: {
  cita: Cita | null;
  onClose: () => void;
  onHecho: (cita: Cita) => void;
  onError: (e: unknown) => void;
}) {
  const [motivo, setMotivo] = useState('');
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (cita) setMotivo('');
  }, [cita]);

  const confirmar = async () => {
    if (!cita) return;
    setCargando(true);
    try {
      onHecho(await citasApi.cancelar(cita.id, motivo));
    } catch (e) {
      onError(e);
    } finally {
      setCargando(false);
    }
  };

  return (
    <BottomSheet visible={cita !== null} onClose={onClose}>
      {cita && (
        <View>
          <Text style={[s.sheetTitulo, font('display', 700)]}>¿Cancelar la cita de {cita.clienteNombre}?</Text>
          <Text style={[s.sheetSubtitulo, font('body', 400)]}>{resumenCita(cita)}</Text>
          <Text style={[s.sheetLabel, font('body', 600)]}>Motivo (opcional)</Text>
          <TextInput
            value={motivo}
            onChangeText={setMotivo}
            maxLength={MAX_MOTIVO}
            multiline
            textAlignVertical="top"
            placeholder="Ej.: Le salió un viaje de trabajo"
            placeholderTextColor="#B497A9"
            accessibilityLabel="Motivo de la cancelación (opcional)"
            style={[s.motivo, font('body', 400)]}
          />
          <Text style={[s.contadorMotivo, font('body', 400)]}>
            {motivo.length}/{MAX_MOTIVO}
          </Text>
          <SheetBotones confirmar="Cancelar cita" color={ROJO.fg} cargando={cargando} onVolver={onClose} onConfirmar={confirmar} />
        </View>
      )}
    </BottomSheet>
  );
}

function NoAsistioSheet({
  cita,
  onClose,
  onHecho,
  onError,
}: {
  cita: Cita | null;
  onClose: () => void;
  onHecho: (cita: Cita) => void;
  onError: (e: unknown) => void;
}) {
  const [cargando, setCargando] = useState(false);

  const confirmar = async () => {
    if (!cita) return;
    setCargando(true);
    try {
      onHecho(await citasApi.cambiarEstado(cita.id, 'NO_ASISTIO'));
    } catch (e) {
      onError(e);
    } finally {
      setCargando(false);
    }
  };

  return (
    <BottomSheet visible={cita !== null} onClose={onClose}>
      {cita && (
        <View>
          <View style={s.sheetIcono}>
            <Feather name="user-x" size={26} color={MORADO.fg} />
          </View>
          <Text style={[s.sheetTitulo, font('display', 700)]}>¿Marcar que {cita.clienteNombre} no asistió?</Text>
          <Text style={[s.sheetSubtitulo, font('body', 400)]}>{resumenCita(cita)}</Text>
          <View style={s.advertencia}>
            <Feather name="alert-circle" size={18} color={theme.estados.PENDIENTE.fg} />
            <Text style={[s.advertenciaTexto, font('body', 500)]}>Este cambio no se puede deshacer.</Text>
          </View>
          <SheetBotones confirmar="Sí, no asistió" color={MORADO.fg} cargando={cargando} onVolver={onClose} onConfirmar={confirmar} />
        </View>
      )}
    </BottomSheet>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
    overflow: 'hidden',
  },
  px: {
    paddingHorizontal: 22,
  },
  titulo: {
    fontSize: 28,
    color: theme.colors.text,
  },
  subtitulo: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  dia: {
    marginTop: 16,
    height: 56,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  flecha: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diaCentro: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  diaTexto: {
    fontSize: 15,
    color: theme.colors.text,
  },
  hoy: {
    backgroundColor: theme.colors.pink50,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  hoyTexto: {
    fontSize: 10,
    color: theme.colors.primary,
  },
  filtros: {
    paddingHorizontal: 22,
    paddingVertical: 14,
    gap: 8,
  },
  filtro: {
    height: 40,
    borderRadius: 999,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 14,
    paddingRight: 8,
  },
  filtroActivo: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filtroTexto: {
    fontSize: 14,
    color: theme.colors.text,
  },
  contador: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor: theme.colors.pink50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contadorTexto: {
    fontSize: 12,
    color: theme.colors.primary,
  },
  lista: {
    gap: 10,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  horaCol: {
    width: 44,
    alignItems: 'flex-end',
    paddingTop: 14,
  },
  hora: {
    fontSize: 15,
    color: theme.colors.text,
  },
  horaFin: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  card: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
  },
  cardCancelada: {
    backgroundColor: '#FBF3F6',
  },
  cardExpandida: {
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  cardHeader: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  cliente: {
    fontSize: 15,
    color: theme.colors.text,
  },
  servicio: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  acciones: {
    paddingHorizontal: 12,
    paddingBottom: 6,
  },
  botones: {
    flexDirection: 'row',
    gap: 6,
  },
  accion: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 2,
  },
  accionTexto: {
    fontSize: 12,
  },
  enlace: {
    minHeight: 44,
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  enlaceTexto: {
    fontSize: 13,
    color: MORADO.fg,
    textDecorationLine: 'underline',
  },
  detalle: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 4,
  },
  detalleTexto: {
    fontSize: 13,
    color: theme.colors.text,
  },
  vacio: {
    minHeight: 64,
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: theme.colors.borderNuevo,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  vacioTexto: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  sheetIcono: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: MORADO.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  sheetTitulo: {
    fontSize: 20,
    color: theme.colors.text,
  },
  sheetSubtitulo: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  sheetLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 18,
    marginBottom: 6,
  },
  motivo: {
    minHeight: 96,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    padding: 12,
    fontSize: 15,
    color: theme.colors.text,
  },
  contadorMotivo: {
    alignSelf: 'flex-end',
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  advertencia: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.estados.PENDIENTE.bg,
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
  },
  advertenciaTexto: {
    flex: 1,
    fontSize: 13,
    color: theme.estados.PENDIENTE.fg,
  },
  sheetBotones: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  sheetBoton: {
    flex: 1,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetVolver: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sheetBotonTexto: {
    fontSize: 15,
  },
});
