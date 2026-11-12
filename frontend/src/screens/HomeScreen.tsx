import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { CompositeScreenProps, useFocusEffect } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { obtenerResumenDashboard } from '../api/services';
import { ResumenDashboard } from '../api/types';
import {
  AppButton,
  Circulo,
  Message,
  Skeleton,
  fechaLarga,
  fechaLocalISO,
  font,
  formatPrecioCorto,
  iniciales,
  parseFechaLocal,
  theme,
} from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { AppStackParamList, TabParamList } from '../types/navigation';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Inicio'>,
  NativeStackScreenProps<AppStackParamList>
>;

type IconName = React.ComponentProps<typeof Feather>['name'];
type Destino = 'Clientes' | 'Servicios' | 'AgendarCita' | 'Citas' | 'Reportes';

interface Modulo {
  nombre: string;
  descripcion: string;
  icon: IconName;
  fondo: string;
  destino: Destino;
  nuevo?: boolean;
}

const MODULOS: Modulo[] = [
  { nombre: 'Clientes', descripcion: 'Buscar, editar e historial', icon: 'users', fondo: theme.colors.pink50, destino: 'Clientes' },
  { nombre: 'Servicios', descripcion: 'Catálogo, duración y precio', icon: 'scissors', fondo: theme.colors.pink100, destino: 'Servicios' },
  { nombre: 'Agendar', descripcion: 'Con calendario y horarios', icon: 'calendar', fondo: theme.colors.lilac100, destino: 'AgendarCita' },
  { nombre: 'Citas', descripcion: 'Reprogramar y cancelar', icon: 'check-square', fondo: theme.colors.rose100, destino: 'Citas' },
  { nombre: 'Horarios', descripcion: 'Disponibilidad por día', icon: 'clock', fondo: theme.colors.pink50, destino: 'AgendarCita', nuevo: true },
  { nombre: 'Reportes', descripcion: 'Ingresos y servicios top', icon: 'bar-chart-2', fondo: theme.colors.pink100, destino: 'Reportes', nuevo: true },
];

const horaLocal = (d = new Date()) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

export default function HomeScreen({ navigation }: Props) {
  const { usuario, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [resumen, setResumen] = useState<ResumenDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      setResumen(await obtenerResumenDashboard(fechaLocalISO(), horaLocal()));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Recarga cada vez que se entra a la pantalla
  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  const cargando = loading && !resumen;
  const fecha = resumen ? parseFechaLocal(resumen.fecha) : new Date();
  const proxima = resumen?.proximaCita ?? null;

  return (
    <View style={s.root}>
      {/* Decoración de fondo */}
      <Circulo size={240} color={theme.colors.pink50} style={{ top: -90, right: -90 }} />
      <Circulo size={120} color={theme.colors.pinkSoft} style={{ top: 260, left: -70 }} />

      <ScrollView contentContainerStyle={[s.content, { paddingTop: 24 + insets.top }]}>
        {/* a. Encabezado */}
        <View style={s.header}>
          <View style={s.avatar}>
            <Text style={[s.avatarText, font('display', 700)]}>{iniciales(usuario?.nombre)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.hola, font('body', 500)]} numberOfLines={1}>
              Hola, {usuario?.nombre}
            </Text>
            <Text style={[s.saludo, font('display', 700)]}>Tu salón hoy</Text>
          </View>
          <Pressable
            onPress={logout}
            accessibilityRole="button"
            accessibilityLabel="Cerrar sesión"
            style={({ pressed }) => [s.logout, pressed && { opacity: 0.7 }]}
          >
            <Feather name="log-out" size={20} color={theme.colors.primary} />
          </Pressable>
        </View>

        {/* b. Tarjeta del día */}
        <View style={s.hero}>
          <Circulo size={170} color={theme.colors.pink300} style={{ top: -60, right: -50 }} />
          <Circulo size={90} color={theme.colors.pink150} style={{ bottom: -40, left: 90 }} />

          <Text style={[s.heroFecha, font('body', 600)]}>{fechaLarga(fecha)}</Text>
          <View style={s.heroTotal}>
            {cargando ? (
              <Skeleton width={56} height={52} style={{ backgroundColor: theme.colors.pink150 }} />
            ) : (
              <Text style={[s.heroNumero, font('display', 800)]}>{resumen?.citasHoy.total ?? 0}</Text>
            )}
            <Text style={[s.heroLabel, font('body', 600)]}>citas para hoy</Text>
          </View>

          <View style={s.proxima}>
            <View style={s.proximaIcon}>
              <Feather name="clock" size={18} color={theme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              {cargando ? (
                <>
                  <Skeleton width={110} height={12} />
                  <Skeleton width={160} height={14} style={{ marginTop: 6 }} />
                </>
              ) : proxima ? (
                <>
                  <Text style={[s.proximaHora, font('body', 400)]}>Próxima cita · {proxima.hora}</Text>
                  <Text style={[s.proximaTexto, font('body', 600)]} numberOfLines={1}>
                    {proxima.cliente} · {proxima.servicio}
                  </Text>
                </>
              ) : (
                <Text style={[s.proximaTexto, font('body', 600)]}>No hay más citas hoy</Text>
              )}
            </View>
            {proxima && (
              <Pressable
                onPress={() => navigation.navigate('Citas')}
                accessibilityRole="button"
                accessibilityLabel="Ver citas"
                style={({ pressed }) => [s.proximaBtn, pressed && { opacity: 0.8 }]}
              >
                <Feather name="chevron-right" size={20} color="#fff" />
              </Pressable>
            )}
          </View>
        </View>

        {error && (
          <View style={{ marginTop: 12 }}>
            <Message text={error} />
            <AppButton title="Reintentar" variant="outline" onPress={cargar} loading={loading} />
          </View>
        )}

        {/* c. Indicadores */}
        <View style={s.stats}>
          {[
            { label: 'Pendientes', valor: resumen ? String(resumen.citasHoy.pendiente) : '–' },
            { label: 'Clientes', valor: resumen ? String(resumen.totalClientes) : '–' },
            { label: 'Ingresos hoy', valor: resumen ? formatPrecioCorto(resumen.ingresosHoy) : '–' },
          ].map((stat) => (
            <View key={stat.label} style={s.stat}>
              <Text style={[s.statLabel, font('body', 500)]}>{stat.label}</Text>
              {cargando ? (
                <Skeleton width={44} height={22} style={{ marginTop: 6 }} />
              ) : (
                <Text style={[s.statValor, font('display', 700)]}>{stat.valor}</Text>
              )}
            </View>
          ))}
        </View>

        {/* d. Módulos */}
        <View style={s.modulosHeader}>
          <Text style={[s.modulosTitulo, font('display', 700)]}>Módulos</Text>
          <Text style={[s.modulosNuevos, font('body', 500)]}>{MODULOS.filter((m) => m.nuevo).length} nuevos</Text>
        </View>
        <View style={s.grid}>
          {MODULOS.map((m) => (
            <Pressable
              key={m.nombre}
              onPress={() => navigation.navigate(m.destino)}
              accessibilityRole="button"
              accessibilityLabel={m.nombre}
              style={({ pressed }) => [s.modulo, m.nuevo && s.moduloNuevo, pressed && { opacity: 0.8 }]}
            >
              {m.nuevo && (
                <View style={s.badge}>
                  <Text style={[s.badgeText, font('body', 700)]}>NUEVO</Text>
                </View>
              )}
              <View style={[s.moduloIcon, { backgroundColor: m.fondo }]}>
                <Feather name={m.icon} size={20} color={theme.colors.primary} />
              </View>
              <Text style={[s.moduloNombre, font('body', 700)]}>{m.nombre}</Text>
              <Text style={[s.moduloDesc, font('body', 400)]}>{m.descripcion}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
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
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: theme.colors.pink200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    color: theme.colors.primaryDark,
  },
  hola: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  saludo: {
    fontSize: 23,
    color: theme.colors.text,
  },
  logout: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    marginTop: 18,
    backgroundColor: theme.colors.pink200,
    borderRadius: 28,
    padding: 18,
    overflow: 'hidden',
  },
  heroFecha: {
    fontSize: 13,
    color: theme.colors.primaryDeep,
  },
  heroTotal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
    marginBottom: 14,
  },
  heroNumero: {
    fontSize: 52,
    lineHeight: 60,
    color: theme.colors.text,
  },
  heroLabel: {
    fontSize: 16,
    color: theme.colors.text,
  },
  proxima: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    padding: 10,
    minHeight: 64,
  },
  proximaIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: theme.colors.pink50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proximaHora: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  proximaTexto: {
    fontSize: 14,
    color: theme.colors.text,
  },
  proximaBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stats: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  stat: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  statLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  statValor: {
    fontSize: 22,
    color: theme.colors.text,
    marginTop: 2,
  },
  modulosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 22,
    marginBottom: 12,
  },
  modulosTitulo: {
    fontSize: 20,
    color: theme.colors.text,
  },
  modulosNuevos: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  modulo: {
    flexBasis: '30%',
    flexGrow: 1,
    minHeight: 112,
    backgroundColor: theme.colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    padding: 12,
  },
  moduloNuevo: {
    borderWidth: 1.5,
    borderColor: theme.colors.borderNuevo,
  },
  moduloIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  moduloNombre: {
    fontSize: 14,
    color: theme.colors.text,
  },
  moduloDesc: {
    fontSize: 11,
    lineHeight: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: theme.colors.primary,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 9,
    color: '#fff',
    textTransform: 'uppercase',
  },
});
