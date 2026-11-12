import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { citasApi, clientesApi, disponibilidadApi, serviciosApi } from '../api/services';
import { Disponibilidad, Servicio, Slot } from '../api/types';
import ClientePicker from '../components/ClientePicker';
import {
  AppButton,
  Avatar,
  Circulo,
  Message,
  Skeleton,
  Toast,
  diaCorto,
  diaYMes,
  fechaLocalISO,
  font,
  formatPrecio,
  inicioSemana,
  mesAnio,
  nombreDiaCorto,
  parseFechaLocal,
  sumarDias,
  sumarMinutos,
  theme,
} from '../components/ui';
import { AppStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<AppStackParamList, 'AgendarCita'>;

const DOMINGO = 0;
const GRIS = { borde: '#EED9E2', texto: '#B9A1AF' };
const OCUPADO = { fondo: '#F1E2E9', texto: '#8C6F80' };

const hoyLocal = () => parseFechaLocal(fechaLocalISO());
// Primer día hábil desde hoy (el salón no abre los domingos)
const primerDiaHabil = () => {
  const hoy = hoyLocal();
  return hoy.getDay() === DOMINGO ? sumarDias(hoy, 1) : hoy;
};

export default function AgendarCitaScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const citaId = route.params?.citaId;
  const reagendar = Boolean(citaId);

  // Datos
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [cliente, setCliente] = useState<{ id: string; nombre: string } | null>(null);
  const [servicioId, setServicioId] = useState<string | null>(null);
  const [fecha, setFecha] = useState<Date>(primerDiaHabil);
  const [semana, setSemana] = useState<Date>(() => inicioSemana(primerDiaHabil()));
  const [hora, setHora] = useState<string | null>(null);
  const [disponibilidad, setDisponibilidad] = useState<Disponibilidad | null>(null);

  // Estado de la pantalla
  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [cargandoDisp, setCargandoDisp] = useState(false);
  const [recargaDisp, setRecargaDisp] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [hecho, setHecho] = useState(false);
  const [toast, setToast] = useState<{ titulo: string; detalle: string } | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [panelAlto, setPanelAlto] = useState(200);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fechaISO = fechaLocalISO(fecha);
  const servicio = servicios.find((s) => s.id === servicioId) ?? null;
  const hoy = hoyLocal();

  // Carga inicial: servicios activos, cliente preseleccionado o la cita a reagendar
  const cargarInicial = useCallback(async () => {
    setCargandoInicial(true);
    setErrorCarga(null);
    try {
      const lista = await serviciosApi.listar();
      setServicios(lista);

      if (citaId) {
        const cita = await citasApi.obtener(citaId);
        const dia = parseFechaLocal(cita.fecha);
        setCliente({ id: cita.clienteId, nombre: cita.clienteNombre });
        setServicioId(cita.servicioId);
        setFecha(dia);
        setSemana(inicioSemana(dia));
        setHora(cita.hora);
      } else if (route.params?.clienteId) {
        const c = await clientesApi.obtener(route.params.clienteId);
        setCliente({ id: c.id, nombre: c.nombreCompleto });
      }
    } catch (e) {
      setErrorCarga((e as Error).message);
    } finally {
      setCargandoInicial(false);
    }
  }, [citaId, route.params?.clienteId]);

  useEffect(() => {
    cargarInicial();
  }, [cargarInicial]);

  // Al salir de la pantalla se cancela la navegación pendiente del toast
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  // Disponibilidad: cambia con el servicio o la fecha
  useEffect(() => {
    if (!servicioId) {
      setDisponibilidad(null);
      return;
    }
    let cancelado = false;
    setCargandoDisp(true);
    disponibilidadApi
      .obtener(fechaISO, servicioId, citaId)
      .then((d) => {
        if (cancelado) return;
        setDisponibilidad(d);
        // Si la hora elegida ya no está libre, se borra la selección
        setHora((h) => (h && d.slots.some((s) => s.hora === h && s.disponible) ? h : null));
      })
      .catch((e: Error) => !cancelado && setError(e.message))
      .finally(() => !cancelado && setCargandoDisp(false));
    return () => {
      cancelado = true;
    };
  }, [servicioId, fechaISO, citaId, recargaDisp]);

  const elegirServicio = (id: string) => {
    setError(null);
    setServicioId(id);
  };

  const elegirFecha = (dia: Date) => {
    setError(null);
    setFecha(dia);
  };

  const volver = () => (navigation.canGoBack() ? navigation.goBack() : navigation.popTo('Tabs', { screen: 'Inicio' }));

  const listo = Boolean(cliente && servicio && hora) && !enviando && !hecho;

  const confirmar = async () => {
    if (!cliente || !servicio || !hora) return;
    setError(null);
    setEnviando(true);
    try {
      const cita = citaId
        ? await citasApi.reprogramar(citaId, { fecha: fechaISO, hora, servicioId: servicio.id })
        : await citasApi.agendar({ clienteId: cliente.id, servicioId: servicio.id, fecha: fechaISO, hora });
      setHecho(true);
      setToast({
        titulo: citaId ? '¡Cita reagendada!' : '¡Cita agendada!',
        detalle: `${cita.clienteNombre} · ${diaCorto(parseFechaLocal(cita.fecha))} · ${cita.hora}`,
      });
      timer.current = setTimeout(() => {
        // popTo (no navigate): vuelve a las pestañas y saca esta pantalla del stack
        navigation.popTo('Tabs', { screen: 'Citas', params: { fecha: cita.fecha } });
      }, 1500);
    } catch (e) {
      // 409: alguien tomó ese horario; se recarga para mostrar los que siguen libres
      if ((e as { status?: number }).status === 409) {
        setError('Ese horario se acaba de ocupar. Elige otro de los que siguen libres.');
        setHora(null);
        setRecargaDisp((n) => n + 1);
      } else {
        setError((e as Error).message);
      }
    } finally {
      setEnviando(false);
    }
  };

  // --- Render ---------------------------------------------------------------

  const dias = Array.from({ length: 7 }, (_, i) => sumarDias(semana, i));
  const puedeRetroceder = semana > inicioSemana(hoy);

  return (
    <View style={s.root}>
      <Circulo size={230} color={theme.colors.pink50} style={{ top: -90, right: -80 }} />

      <ScrollView contentContainerStyle={{ paddingTop: 24 + insets.top, paddingBottom: panelAlto + 16 }}>
        {/* 1. Encabezado */}
        <View style={[s.px, s.header]}>
          <Pressable onPress={volver} accessibilityRole="button" accessibilityLabel="Volver" style={s.volver}>
            <Feather name="chevron-left" size={22} color={theme.colors.primary} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[s.titulo, font('display', 700)]}>{reagendar ? 'Reagendar cita' : 'Agendar cita'}</Text>
            <Text style={[s.subtitulo, font('body', 400)]}>Elige cliente, servicio, día y hora</Text>
          </View>
        </View>

        {errorCarga ? (
          <View style={[s.px, { marginTop: 16 }]}>
            <Message text={errorCarga} />
            <AppButton title="Reintentar" variant="outline" onPress={cargarInicial} />
          </View>
        ) : (
          <>
            {/* 2. Cliente */}
            <View style={s.px}>
              <Text style={[s.etiqueta, { marginTop: 16 }, font('body', 600)]}>Cliente</Text>
              <Pressable
                onPress={() => setPickerVisible(true)}
                disabled={reagendar || cargandoInicial}
                accessibilityRole="button"
                accessibilityLabel={cliente ? `Cliente: ${cliente.nombre}` : 'Elegir cliente'}
                accessibilityState={{ disabled: reagendar }}
                style={({ pressed }) => [s.clienteBtn, reagendar && { opacity: 0.7 }, pressed && { opacity: 0.85 }]}
              >
                {cargandoInicial ? (
                  <Skeleton width={160} height={16} />
                ) : cliente ? (
                  <>
                    <Avatar nombre={cliente.nombre} size={32} radius={11} color={theme.colors.pink200} />
                    <Text style={[s.clienteNombre, font('body', 600)]} numberOfLines={1}>
                      {cliente.nombre}
                    </Text>
                  </>
                ) : (
                  <Text style={[s.clientePlaceholder, font('body', 500)]}>Elige un cliente</Text>
                )}
                <Feather name={reagendar ? 'lock' : 'chevron-down'} size={18} color="#B48AA4" />
              </Pressable>
            </View>

            {/* 3. Servicio */}
            <Text style={[s.px, s.etiqueta, { marginTop: 16 }, font('body', 600)]}>Servicio</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.servicios}>
              {cargandoInicial
                ? [0, 1, 2].map((i) => <Skeleton key={i} width={130} height={56} style={{ borderRadius: 18 }} />)
                : servicios.map((sv) => {
                    const activo = sv.id === servicioId;
                    return (
                      <Pressable
                        key={sv.id}
                        onPress={() => elegirServicio(sv.id)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: activo }}
                        accessibilityLabel={`${sv.nombre}, ${sv.duracionMinutos} minutos, ${formatPrecio(sv.precio)}`}
                        style={[s.servicio, activo && s.servicioActivo]}
                      >
                        <Text style={[s.servicioNombre, font('body', 700), activo && { color: '#fff' }]}>{sv.nombre}</Text>
                        <Text style={[s.servicioDetalle, font('body', 500), activo && { color: '#FBE3EE' }]}>
                          {sv.duracionMinutos} min · {formatPrecio(sv.precio)}
                        </Text>
                      </Pressable>
                    );
                  })}
            </ScrollView>

            {/* 4. Fecha */}
            <View style={[s.px, s.fechaHeader]}>
              <Text style={[s.etiqueta, { marginBottom: 0 }, font('body', 600)]}>Fecha</Text>
              <View style={s.mesNav}>
                <Pressable
                  onPress={() => setSemana((w) => sumarDias(w, -7))}
                  disabled={!puedeRetroceder}
                  accessibilityRole="button"
                  accessibilityLabel="Semana anterior"
                  style={[s.flecha, !puedeRetroceder && { opacity: 0.3 }]}
                >
                  <Feather name="chevron-left" size={18} color={theme.colors.primaryDeep} />
                </Pressable>
                <Text style={[s.mes, font('body', 700)]}>{mesAnio(sumarDias(semana, 3))}</Text>
                <Pressable
                  onPress={() => setSemana((w) => sumarDias(w, 7))}
                  accessibilityRole="button"
                  accessibilityLabel="Semana siguiente"
                  style={s.flecha}
                >
                  <Feather name="chevron-right" size={18} color={theme.colors.primaryDeep} />
                </Pressable>
              </View>
            </View>
            <View style={[s.px, s.dias]}>
              {dias.map((dia) => {
                const iso = fechaLocalISO(dia);
                const esHoy = iso === fechaLocalISO(hoy);
                const deshabilitado = dia < hoy || dia.getDay() === DOMINGO;
                const activo = iso === fechaISO;
                return (
                  <Pressable
                    key={iso}
                    onPress={() => elegirFecha(dia)}
                    disabled={deshabilitado}
                    accessibilityRole="button"
                    accessibilityState={{ selected: activo, disabled: deshabilitado }}
                    accessibilityLabel={`${diaYMes(dia)}${deshabilitado ? ' no disponible' : ''}`}
                    style={[s.dia, deshabilitado && s.diaDeshabilitado, activo && s.diaActivo]}
                  >
                    <Text style={[s.diaNombre, font('body', 600), deshabilitado && { color: GRIS.texto }]}>
                      {esHoy ? 'Hoy' : nombreDiaCorto(dia)}
                    </Text>
                    <Text style={[s.diaNumero, font('display', 700), deshabilitado && { color: GRIS.texto }]}>
                      {dia.getDate()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* 5. Horarios */}
            <View style={s.px}>
              <Text style={[s.etiqueta, { marginTop: 18 }, font('body', 600)]}>Horarios disponibles</Text>
              {!servicioId ? (
                <View style={s.aviso}>
                  <Text style={[s.avisoTexto, font('body', 500)]}>Elige un servicio para ver los horarios libres</Text>
                </View>
              ) : cargandoDisp && !disponibilidad ? (
                <View style={s.slots}>
                  {Array.from({ length: 20 }, (_, i) => (
                    <Skeleton key={i} width="18%" height={40} style={s.slotSkeleton} />
                  ))}
                </View>
              ) : disponibilidad && !disponibilidad.horario.abierto ? (
                <View style={s.aviso}>
                  <Text style={[s.avisoTexto, font('body', 500)]}>El salón no abre este día</Text>
                </View>
              ) : (
                <View style={[s.slots, cargandoDisp && { opacity: 0.5 }]}>
                  {disponibilidad?.slots.map((slot) => (
                    <SlotButton key={slot.hora} slot={slot} elegido={slot.hora === hora} onPress={() => setHora(slot.hora)} />
                  ))}
                </View>
              )}
              <View style={s.leyenda}>
                <Leyenda color={theme.colors.surface} borde={theme.colors.border} texto="Libre" />
                <Leyenda color={OCUPADO.fondo} texto="Ocupado" />
                <Leyenda color={theme.colors.primary} texto="Elegido" />
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* 6. Panel inferior fijo */}
      <View style={[s.panel, { paddingBottom: 24 + insets.bottom }]} onLayout={(e) => setPanelAlto(e.nativeEvent.layout.height)}>
        <View style={s.resumen}>
          <View style={s.resumenIcon}>
            <Feather name="calendar" size={20} color={theme.colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.resumenTitulo, font('body', 700)]} numberOfLines={1}>
              {servicio
                ? `${servicio.nombre} · ${servicio.duracionMinutos} min · ${formatPrecio(servicio.precio)}`
                : 'Elige un servicio'}
            </Text>
            <Text style={[s.resumenDetalle, font('body', 400)]}>
              {hora && servicio
                ? `${diaCorto(fecha)} · ${hora} – ${sumarMinutos(hora, servicio.duracionMinutos)}`
                : 'Elige un horario'}
            </Text>
          </View>
        </View>
        <Message text={error} />
        <Pressable
          onPress={confirmar}
          disabled={!listo}
          accessibilityRole="button"
          accessibilityState={{ disabled: !listo }}
          style={({ pressed }) => [s.confirmar, !listo && { backgroundColor: '#D9C3CF' }, pressed && { opacity: 0.9 }]}
        >
          <Feather name="check" size={18} color="#fff" />
          <Text style={[s.confirmarTexto, font('body', 700)]}>
            {enviando ? 'Guardando…' : reagendar ? 'Guardar cambios' : 'Confirmar cita'}
          </Text>
        </Pressable>
        <Text style={[s.nota, font('body', 400)]}>Si alguien toma este horario antes, te mostramos otros libres.</Text>
      </View>

      {toast && <Toast titulo={toast.titulo} detalle={toast.detalle} onClose={() => setToast(null)} />}

      <ClientePicker
        visible={pickerVisible}
        seleccionadoId={cliente?.id}
        onClose={() => setPickerVisible(false)}
        onSelect={(c) => {
          setCliente({ id: c.id, nombre: c.nombreCompleto });
          setPickerVisible(false);
        }}
      />
    </View>
  );
}

function SlotButton({ slot, elegido, onPress }: { slot: Slot; elegido: boolean; onPress: () => void }) {
  const ocupado = slot.motivo === 'ocupado';
  const gris = !slot.disponible && !ocupado; // pasado o cerrado
  const etiqueta = slot.disponible ? 'libre' : ocupado ? 'ocupado' : slot.motivo === 'pasado' ? 'ya pasó' : 'fuera de horario';
  return (
    <Pressable
      onPress={onPress}
      disabled={!slot.disponible}
      accessibilityRole="button"
      accessibilityState={{ selected: elegido, disabled: !slot.disponible }}
      accessibilityLabel={`${slot.hora}, ${elegido ? 'elegido' : etiqueta}`}
      style={[s.slot, ocupado && s.slotOcupado, gris && s.slotGris, elegido && s.slotElegido]}
    >
      <Text
        style={[
          s.slotTexto,
          font('body', 600),
          ocupado && { color: OCUPADO.texto, textDecorationLine: 'line-through' },
          gris && { color: GRIS.texto },
          elegido && { color: '#fff' },
        ]}
      >
        {slot.hora}
      </Text>
    </Pressable>
  );
}

function Leyenda({ color, borde, texto }: { color: string; borde?: string; texto: string }) {
  return (
    <View style={s.leyendaItem}>
      <View style={[s.leyendaCuadro, { backgroundColor: color, borderColor: borde ?? color }]} />
      <Text style={[s.leyendaTexto, font('body', 500)]}>{texto}</Text>
    </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  volver: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    fontSize: 24,
    color: theme.colors.text,
  },
  subtitulo: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  etiqueta: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },
  clienteBtn: {
    height: 52,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
  },
  clienteNombre: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text,
  },
  clientePlaceholder: {
    flex: 1,
    fontSize: 15,
    color: '#B497A9',
    paddingLeft: 4,
  },
  servicios: {
    paddingHorizontal: 22,
    gap: 8,
  },
  servicio: {
    height: 56,
    borderRadius: 18,
    paddingHorizontal: 14,
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  servicioActivo: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  servicioNombre: {
    fontSize: 13,
    color: theme.colors.text,
  },
  servicioDetalle: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  fechaHeader: {
    marginTop: 16,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mesNav: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flecha: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mes: {
    fontSize: 12,
    color: theme.colors.primaryDeep,
  },
  dias: {
    flexDirection: 'row',
    gap: 6,
  },
  dia: {
    flex: 1,
    height: 60,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diaDeshabilitado: {
    backgroundColor: 'transparent',
    borderStyle: 'dashed',
    borderColor: GRIS.borde,
  },
  diaActivo: {
    backgroundColor: theme.colors.pink200,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  diaNombre: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  diaNumero: {
    fontSize: 18,
    color: theme.colors.text,
  },
  slots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotSkeleton: {
    flexGrow: 1,
    borderRadius: 12,
  },
  slot: {
    flexBasis: '18%',
    flexGrow: 1,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotOcupado: {
    backgroundColor: OCUPADO.fondo,
    borderColor: OCUPADO.fondo,
  },
  slotGris: {
    backgroundColor: 'transparent',
    borderStyle: 'dashed',
    borderColor: GRIS.borde,
  },
  slotElegido: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  slotTexto: {
    fontSize: 13,
    color: theme.colors.text,
  },
  aviso: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: theme.colors.borderNuevo,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  avisoTexto: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  leyenda: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 10,
  },
  leyendaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  leyendaCuadro: {
    width: 10,
    height: 10,
    borderRadius: 3,
    borderWidth: 1,
  },
  leyendaTexto: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 16,
    paddingHorizontal: 22,
    boxShadow: '0px -6px 20px rgba(142, 74, 135, 0.10)',
  },
  resumen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resumenIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.colors.pink50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resumenTitulo: {
    fontSize: 14,
    color: theme.colors.text,
  },
  resumenDetalle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  confirmar: {
    marginTop: 12,
    height: 52,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmarTexto: {
    fontSize: 15,
    color: '#fff',
  },
  nota: {
    marginTop: 8,
    fontSize: 11,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
