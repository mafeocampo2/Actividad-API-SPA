import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { reportesApi } from '../api/services';
import { ReporteResumen } from '../api/types';
import {
  AppButton,
  BottomSheet,
  Circulo,
  Field,
  Message,
  Skeleton,
  esFechaISO,
  fechaLocalISO,
  finMes,
  finSemana,
  font,
  inicioMes,
  inicioSemana,
  parseFechaLocal,
  rangoTexto,
  theme,
} from '../components/ui';

type Tipo = 'semana' | 'mes' | 'personalizado';
interface Periodo {
  tipo: Tipo;
  desde: string; // AAAA-MM-DD
  hasta: string;
}

const periodoDe = (tipo: 'semana' | 'mes'): Periodo => {
  const hoy = new Date();
  return tipo === 'semana'
    ? { tipo, desde: fechaLocalISO(inicioSemana(hoy)), hasta: fechaLocalISO(finSemana(hoy)) }
    : { tipo, desde: fechaLocalISO(inicioMes(hoy)), hasta: fechaLocalISO(finMes(hoy)) };
};

const ESTADOS = [
  { clave: 'completada', etiqueta: 'Completadas', color: '#6CC4A0' },
  { clave: 'pendiente', etiqueta: 'Pendientes', color: '#F2B95C' },
  { clave: 'cancelada', etiqueta: 'Canceladas', color: '#E8798B' },
  { clave: 'no_asistio', etiqueta: 'No asistió', color: '#A98BD3' },
] as const;

const COLORES_TOP = [theme.colors.primary, '#C77BA6', '#E3A3BF', '#F2C7D8'];
const MAX_TOP = 4;

const formatPesos = (n: number) => `$${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(n)}`;

export default function ReportesScreen() {
  const insets = useSafeAreaInsets();
  const [periodo, setPeriodo] = useState<Periodo>(() => periodoDe('semana'));
  const [reporte, setReporte] = useState<ReporteResumen | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rangoVisible, setRangoVisible] = useState(false);
  const ultimaPeticion = useRef(0);

  const cargar = useCallback(async () => {
    const id = ++ultimaPeticion.current; // ignora respuestas viejas si se cambia de periodo rápido
    setCargando(true);
    setError(null);
    try {
      const r = await reportesApi.resumen(periodo.desde, periodo.hasta);
      if (id === ultimaPeticion.current) setReporte(r);
    } catch (e) {
      if (id === ultimaPeticion.current) setError((e as Error).message);
    } finally {
      if (id === ultimaPeticion.current) setCargando(false);
    }
  }, [periodo.desde, periodo.hasta]);

  // Recarga al entrar a la pantalla y al cambiar el periodo
  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  const mostrarFantasmas = cargando && (!reporte || reporte.desde !== periodo.desde || reporte.hasta !== periodo.hasta);
  const datos = mostrarFantasmas ? null : reporte;

  return (
    <View style={s.root}>
      <Circulo size={230} color={theme.colors.pink50} style={{ top: -90, left: -90 }} />

      <ScrollView contentContainerStyle={[s.content, { paddingTop: 24 + insets.top }]}>
        {/* 1. Encabezado */}
        <Text style={[s.titulo, font('display', 700)]}>Reportes</Text>
        <Text style={[s.subtitulo, font('body', 400)]}>Cómo va tu salón</Text>

        {/* 2. Periodo */}
        <View style={s.periodoFila}>
          <View style={s.segmentado} accessibilityRole="tablist">
            {(['semana', 'mes'] as const).map((tipo) => {
              const activo = periodo.tipo === tipo;
              return (
                <Pressable
                  key={tipo}
                  onPress={() => setPeriodo(periodoDe(tipo))}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: activo }}
                  style={[s.segmento, activo && s.segmentoActivo]}
                >
                  <Text style={[s.segmentoTexto, font('body', 700), activo && { color: theme.colors.text }]}>
                    {tipo === 'semana' ? 'Esta semana' : 'Este mes'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable
            onPress={() => setRangoVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Elegir rango de fechas"
            accessibilityState={{ selected: periodo.tipo === 'personalizado' }}
            style={[s.calendario, periodo.tipo === 'personalizado' && s.calendarioActivo]}
          >
            <Feather name="calendar" size={18} color={theme.colors.primary} />
          </Pressable>
        </View>
        <Text style={[s.rango, font('body', 600)]}>
          {rangoTexto(parseFechaLocal(periodo.desde), parseFechaLocal(periodo.hasta))}
        </Text>

        {error ? (
          <View style={{ marginTop: 12 }}>
            <Message text={error} />
            <AppButton title="Reintentar" variant="outline" onPress={cargar} loading={cargando} />
          </View>
        ) : (
          <>
            {/* 3. Ingresos */}
            <View style={s.ingresos}>
              <Circulo size={150} color={theme.colors.pink300} style={{ top: -50, right: -40 }} />
              <Circulo size={100} color={theme.colors.pink150} style={{ bottom: -50, left: 120 }} />
              <Text style={[s.ingresosLabel, font('body', 600)]}>Ingresos por citas completadas</Text>
              {datos ? (
                <Text style={[s.monto, font('display', 800)]}>{formatPesos(datos.ingresos)}</Text>
              ) : (
                <Skeleton width={180} height={40} style={{ marginVertical: 6, backgroundColor: theme.colors.pink150 }} />
              )}
              <View style={s.chips}>
                {datos ? (
                  <>
                    <Chip numero={datos.totalCitas} texto={datos.totalCitas === 1 ? 'cita' : 'citas'} />
                    <Chip
                      numero={datos.clientesNuevos}
                      texto={datos.clientesNuevos === 1 ? 'cliente nuevo' : 'clientes nuevos'}
                    />
                    <Chip numero={`${Math.round(datos.tasaCancelacion * 100)} %`} texto="canceladas" />
                  </>
                ) : (
                  [70, 110, 100].map((w) => <Skeleton key={w} width={w} height={28} style={{ borderRadius: 12 }} />)
                )}
              </View>
            </View>

            {datos && datos.totalCitas === 0 ? (
              <View style={s.vacio}>
                <Text style={[s.vacioTexto, font('body', 500)]}>Aún no hay citas en este periodo</Text>
              </View>
            ) : (
              <>
                {/* 4. Citas por estado */}
                <View style={s.tarjeta}>
                  <Text style={[s.tarjetaTitulo, font('body', 700)]}>Citas por estado</Text>
                  {datos ? <BarraEstados porEstado={datos.porEstado} /> : <Skeleton width="100%" height={14} />}
                  <View style={s.leyenda}>
                    {ESTADOS.map((e) => (
                      <View key={e.clave} style={s.leyendaItem}>
                        <View style={[s.leyendaCuadro, { backgroundColor: e.color }]} />
                        <Text style={[s.leyendaTexto, font('body', 500)]}>{e.etiqueta}</Text>
                        {datos ? (
                          <Text style={[s.leyendaNumero, font('body', 700)]}>{datos.porEstado[e.clave]}</Text>
                        ) : (
                          <Skeleton width={16} height={12} />
                        )}
                      </View>
                    ))}
                  </View>
                </View>

                {/* 5. Servicios más pedidos */}
                <View style={s.tarjeta}>
                  <Text style={[s.tarjetaTitulo, font('body', 700)]}>Servicios más pedidos</Text>
                  {datos ? (
                    <ServiciosTop servicios={datos.serviciosTop.slice(0, MAX_TOP)} />
                  ) : (
                    [0, 1, 2, 3].map((i) => <Skeleton key={i} width="100%" height={24} />)
                  )}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>

      <RangoSheet
        visible={rangoVisible}
        periodo={periodo}
        onClose={() => setRangoVisible(false)}
        onAplicar={(desde, hasta) => {
          setPeriodo({ tipo: 'personalizado', desde, hasta });
          setRangoVisible(false);
        }}
      />
    </View>
  );
}

function Chip({ numero, texto }: { numero: number | string; texto: string }) {
  return (
    <View style={s.chip}>
      <Text style={[s.chipTexto, font('body', 400)]}>
        <Text style={font('body', 700)}>{numero}</Text> {texto}
      </Text>
    </View>
  );
}

function BarraEstados({ porEstado }: { porEstado: ReporteResumen['porEstado'] }) {
  const resumen = ESTADOS.map((e) => `${e.etiqueta}: ${porEstado[e.clave]}`).join(', ');
  return (
    <View style={s.barra} accessible accessibilityRole="image" accessibilityLabel={resumen}>
      {ESTADOS.filter((e) => porEstado[e.clave] > 0).map((e) => (
        <View key={e.clave} style={[s.barraSegmento, { flexGrow: porEstado[e.clave], backgroundColor: e.color }]} />
      ))}
    </View>
  );
}

function ServiciosTop({ servicios }: { servicios: ReporteResumen['serviciosTop'] }) {
  if (servicios.length === 0) {
    return <Text style={[s.leyendaTexto, font('body', 500)]}>Solo hay citas canceladas en este periodo</Text>;
  }
  const maximo = Math.max(...servicios.map((sv) => sv.cantidad), 1);
  return (
    <View style={{ gap: 10 }}>
      {servicios.map((sv, i) => (
        <View
          key={sv.servicioId}
          style={s.top}
          accessible
          accessibilityLabel={`Puesto ${i + 1}: ${sv.nombre}, ${sv.cantidad} ${sv.cantidad === 1 ? 'cita' : 'citas'}`}
        >
          <View style={[s.puesto, i === 0 && { backgroundColor: theme.colors.primary }]}>
            <Text style={[s.puestoTexto, font('body', 700), i === 0 && { color: '#fff' }]}>{i + 1}</Text>
          </View>
          <Text style={[s.topNombre, font('body', 600)]} numberOfLines={1}>
            {sv.nombre}
          </Text>
          <View style={s.pista}>
            <View
              style={[
                s.relleno,
                { width: `${(sv.cantidad / maximo) * 100}%`, backgroundColor: COLORES_TOP[i] ?? COLORES_TOP[3] },
              ]}
            />
          </View>
          <Text style={[s.topCantidad, font('body', 700)]}>{sv.cantidad}</Text>
        </View>
      ))}
    </View>
  );
}

/** Modal para elegir un rango personalizado (Desde ≤ Hasta). */
function RangoSheet({
  visible,
  periodo,
  onClose,
  onAplicar,
}: {
  visible: boolean;
  periodo: Periodo;
  onClose: () => void;
  onAplicar: (desde: string, hasta: string) => void;
}) {
  const [desde, setDesde] = useState(periodo.desde);
  const [hasta, setHasta] = useState(periodo.hasta);
  const [error, setError] = useState<string | null>(null);

  // Al abrir, parte del periodo actual
  useEffect(() => {
    if (visible) {
      setDesde(periodo.desde);
      setHasta(periodo.hasta);
      setError(null);
    }
  }, [visible, periodo.desde, periodo.hasta]);

  const aplicar = () => {
    const d = desde.trim();
    const h = hasta.trim();
    if (!esFechaISO(d) || !esFechaISO(h)) {
      setError('Usa fechas válidas con el formato AAAA-MM-DD');
      return;
    }
    if (d > h) {
      setError('"Desde" debe ser anterior o igual a "Hasta"');
      return;
    }
    onAplicar(d, h);
  };

  return (
    <BottomSheet visible={visible} title="Rango de fechas" onClose={onClose}>
      <Field label="Desde (AAAA-MM-DD)" value={desde} onChangeText={setDesde} placeholder="2026-11-01" />
      <Field label="Hasta (AAAA-MM-DD)" value={hasta} onChangeText={setHasta} placeholder="2026-11-30" />
      <Message text={error} />
      <AppButton title="Ver reporte" onPress={aplicar} />
    </BottomSheet>
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
  titulo: {
    fontSize: 28,
    color: theme.colors.text,
  },
  subtitulo: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  periodoFila: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 10,
  },
  segmentado: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 3,
  },
  segmento: {
    flex: 1,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentoActivo: {
    backgroundColor: theme.colors.pink200,
  },
  segmentoTexto: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  calendario: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarioActivo: {
    backgroundColor: theme.colors.pink200,
    borderColor: theme.colors.primary,
  },
  rango: {
    marginTop: 8,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  ingresos: {
    marginTop: 12,
    backgroundColor: theme.colors.pink200,
    borderRadius: 26,
    padding: 18,
    overflow: 'hidden',
  },
  ingresosLabel: {
    fontSize: 12,
    color: theme.colors.primaryDeep,
  },
  monto: {
    fontSize: 38,
    lineHeight: 46,
    letterSpacing: -1,
    color: theme.colors.text,
    marginVertical: 2,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  chip: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  chipTexto: {
    fontSize: 12,
    color: theme.colors.text,
  },
  tarjeta: {
    marginTop: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    padding: 16,
    gap: 12,
  },
  tarjetaTitulo: {
    fontSize: 14,
    color: theme.colors.text,
  },
  barra: {
    height: 14,
    flexDirection: 'row',
    gap: 3,
  },
  barraSegmento: {
    flexBasis: 0,
    minWidth: 8,
    borderRadius: 7,
  },
  leyenda: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 8,
    columnGap: 12,
  },
  leyendaItem: {
    width: '46%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  leyendaCuadro: {
    width: 10,
    height: 10,
    borderRadius: 4,
  },
  leyendaTexto: {
    flex: 1,
    fontSize: 12,
    color: '#5E4656',
  },
  leyendaNumero: {
    fontSize: 13,
    color: theme.colors.text,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  puesto: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: theme.colors.pink50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  puestoTexto: {
    fontSize: 12,
    color: theme.colors.primary,
  },
  topNombre: {
    width: 104,
    fontSize: 13,
    color: theme.colors.text,
  },
  pista: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.pinkSoft,
    overflow: 'hidden',
  },
  relleno: {
    height: '100%',
    borderRadius: 5,
  },
  topCantidad: {
    width: 24,
    textAlign: 'right',
    fontSize: 13,
    color: theme.colors.text,
  },
  vacio: {
    marginTop: 12,
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
});
