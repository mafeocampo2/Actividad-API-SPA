import React from 'react';
import Feather from '@expo/vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { EstadoCita } from '../api/types';

// ---------------------------------------------------------------------------
// Tema
// ---------------------------------------------------------------------------

export const theme = {
  colors: {
    background: '#FFF4F7',
    surface: '#FFFFFF',
    border: '#F3CFDC',
    borderSoft: '#F6D9E4',
    borderNuevo: '#EBA8C1',
    pink50: '#FCE4EC',
    pink100: '#F9DCE8',
    lilac100: '#F6E1F1',
    rose100: '#FFE4E6',
    pink200: '#F8C8D8',
    pink300: '#F4B6CB',
    pink150: '#FAD6E2',
    pinkSoft: '#FBEAF0',
    primary: '#8e4a87',
    primaryDark: '#6d3768',
    primaryDeep: '#5E2C58',
    text: '#3B1E35',
    textSecondary: '#7A5C70',
    white: '#FFFFFF',
  },
  // Fondo / texto de cada estado de cita
  estados: {
    PENDIENTE: { bg: '#FFF0D6', fg: '#7A4E00', label: 'Pendiente' },
    COMPLETADA: { bg: '#DDF3EA', fg: '#1F6B4E', label: 'Completada' },
    CANCELADA: { bg: '#FDE2E4', fg: '#A12C3A', label: 'Cancelada' },
    CONFIRMADA: { bg: '#EFE6F5', fg: '#5B3A86', label: 'Confirmada' },
  } satisfies Record<EstadoCita, { bg: string; fg: string; label: string }>,
  radius: { sm: 12, md: 14, lg: 16, xl: 20, xxl: 22, card: 26, hero: 28, pill: 999 },
  shadow: '0px 8px 24px rgba(142, 74, 135, 0.16)',
  shadowStrong: '0px 10px 22px rgba(142, 74, 135, 0.35)',
  touch: 44,
};

// Colores anteriores: se mantienen para no romper las pantallas que aún los usan
export const colors = {
  primary: theme.colors.primary,
  primaryLight: theme.colors.pink50,
  background: theme.colors.background,
  text: theme.colors.text,
  muted: theme.colors.textSecondary,
  border: theme.colors.border,
  error: theme.estados.CANCELADA.fg,
  success: theme.estados.COMPLETADA.fg,
};

// ---------------------------------------------------------------------------
// Tipografía
// ---------------------------------------------------------------------------

// App.tsx lo marca en true cuando las fuentes de Google cargan bien.
// Si fallan, se usa la fuente del sistema con el mismo peso.
let fuentesDisponibles = false;
export const setFuentesDisponibles = (ok: boolean) => {
  fuentesDisponibles = ok;
};

const FAMILIAS = {
  display: { 600: 'BricolageGrotesque_600SemiBold', 700: 'BricolageGrotesque_700Bold', 800: 'BricolageGrotesque_800ExtraBold' },
  body: { 400: 'DMSans_400Regular', 500: 'DMSans_500Medium', 600: 'DMSans_600SemiBold', 700: 'DMSans_700Bold' },
} as const;

type Peso<F extends keyof typeof FAMILIAS> = keyof (typeof FAMILIAS)[F];

/** Estilo de fuente: `display` (Bricolage) para títulos y números, `body` (DM Sans) para texto. */
export function font<F extends keyof typeof FAMILIAS>(familia: F, peso: Peso<F>): TextStyle {
  if (fuentesDisponibles) {
    return { fontFamily: (FAMILIAS[familia] as Record<string, string>)[String(peso)] };
  }
  return { fontWeight: String(peso) as TextStyle['fontWeight'] };
}

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

export const formatPrecio = (precio: number) => `$${precio.toLocaleString('es-CO')}`;

/** Precio abreviado: 70000 → "$70k", 1250000 → "$1,3M". */
export const formatPrecioCorto = (precio: number) => {
  const abreviar = (n: number) => n.toLocaleString('es-CO', { maximumFractionDigits: 1 });
  if (Math.abs(precio) >= 1_000_000) return `$${abreviar(precio / 1_000_000)}M`;
  if (Math.abs(precio) >= 1_000) return `$${abreviar(precio / 1_000)}k`;
  return formatPrecio(precio);
};

const dos = (n: number) => String(n).padStart(2, '0');

/**
 * AAAA-MM-DD con la fecha LOCAL del dispositivo.
 * No usar toISOString: trabaja en UTC y en Colombia (UTC-5) puede dar el día siguiente.
 */
export const fechaLocalISO = (date: Date = new Date()) =>
  `${date.getFullYear()}-${dos(date.getMonth() + 1)}-${dos(date.getDate())}`;

/** Convierte "AAAA-MM-DD" en un Date local (sin desfase por zona horaria). */
export const parseFechaLocal = (fecha: string) => {
  const [y, m, d] = fecha.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
};

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/** "Miércoles 11 de noviembre" */
export const fechaLarga = (date: Date) => `${DIAS[date.getDay()]} ${date.getDate()} de ${MESES[date.getMonth()]}`;

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'];

/** Hora de 24 h ("16:00") a 12 h en español ("4:00 p. m."). */
export const hora12 = (hora: string) => {
  const [h = 0, m = 0] = hora.split(':').map(Number);
  const sufijo = h < 12 ? 'a. m.' : 'p. m.';
  return `${h % 12 || 12}:${dos(m)} ${sufijo}`;
};

/** Fecha de una cita: "Hoy · 10:30" o "28 oct · 4:00 p. m." (con año si no es el actual). */
export const formatFechaCita = (fecha: string, hora: string) => {
  const hoy = new Date();
  if (fecha === fechaLocalISO(hoy)) return `Hoy · ${hora}`;
  const d = parseFechaLocal(fecha);
  const anio = d.getFullYear() !== hoy.getFullYear() ? ` ${d.getFullYear()}` : '';
  return `${d.getDate()} ${MESES_CORTOS[d.getMonth()]}${anio} · ${hora12(hora)}`;
};

const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES_LARGOS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

/** "Lun", "Mar"… */
export const nombreDiaCorto = (date: Date) => DIAS_CORTOS[date.getDay()]!;

/** "Noviembre 2026" */
export const mesAnio = (date: Date) => `${MESES_LARGOS[date.getMonth()]} ${date.getFullYear()}`;

/** "Mié 11 nov" */
export const diaCorto = (date: Date) => `${nombreDiaCorto(date)} ${date.getDate()} ${MESES_CORTOS[date.getMonth()]}`;

/** "11 de noviembre" */
export const diaYMes = (date: Date) => `${date.getDate()} de ${MESES[date.getMonth()]}`;

/** Copia de la fecha con n días sumados (hora local, sin desfase) */
export const sumarDias = (date: Date, n: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);

/** Lunes de la semana de esa fecha */
export const inicioSemana = (date: Date) => sumarDias(date, -((date.getDay() + 6) % 7));

/** "HH:mm" + minutos → "HH:mm" */
export const sumarMinutos = (hora: string, minutos: number) => {
  const [h = 0, m = 0] = hora.split(':').map(Number);
  const total = h * 60 + m + minutos;
  return `${dos(Math.floor(total / 60) % 24)}:${dos(total % 60)}`;
};

/** Iniciales de un nombre: "Mafe Ocampo" → "MO" */
export const iniciales = (nombre = '') =>
  nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || '?';

// ---------------------------------------------------------------------------
// Componentes
// ---------------------------------------------------------------------------

interface FieldProps extends TextInputProps {
  label: string;
}

export function Field({ label, style, ...props }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, font('body', 600)]}>{label}</Text>
      <TextInput
        style={[styles.input, font('body', 400), style]}
        placeholderTextColor="#B497A9"
        autoCapitalize="none"
        {...props}
      />
    </View>
  );
}

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'outline';
}

export function AppButton({ title, onPress, loading, variant = 'primary' }: ButtonProps) {
  const outline = variant === 'outline';
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        outline && styles.buttonOutline,
        (pressed || loading) && { opacity: 0.75 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={outline ? theme.colors.primary : '#fff'} />
      ) : (
        <Text style={[styles.buttonText, font('body', 700), outline && { color: theme.colors.primary }]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Message({ text, type = 'error' }: { text: string | null; type?: 'error' | 'success' }) {
  if (!text) return null;
  const c = type === 'error' ? theme.estados.CANCELADA : theme.estados.COMPLETADA;
  return (
    <View style={[styles.message, { backgroundColor: c.bg }]}>
      <Text style={[styles.messageText, font('body', 500), { color: c.fg }]}>{text}</Text>
    </View>
  );
}

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function Chip({ label, selected, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipText, font('body', selected ? 700 : 500), selected && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

export function EstadoPill({ estado }: { estado: EstadoCita }) {
  const e = theme.estados[estado];
  return (
    <View style={[styles.pill, { backgroundColor: e.bg }]}>
      <Text style={[styles.pillText, font('body', 700), { color: e.fg }]}>{e.label}</Text>
    </View>
  );
}

/** Círculo decorativo de color sólido. El contenedor debe tener overflow: 'hidden'. */
export function Circulo({ size, color, style }: { size: number; color: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View
      pointerEvents="none"
      style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: color }, style]}
    />
  );
}

/** Bloque rosado suave que ocupa el lugar de un dato mientras carga. */
export function Skeleton({ width, height, style }: { width: number | `${number}%`; height: number; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ width, height, borderRadius: 8, backgroundColor: theme.colors.pink100 }, style]} />;
}

const AVATAR_FONDOS = [theme.colors.pink200, theme.colors.lilac100, theme.colors.rose100, theme.colors.pink100];

/** Avatar con iniciales. Sin `color`, el fondo rota según `index`. */
export function Avatar({
  nombre,
  size = 36,
  radius = 12,
  index = 0,
  color,
}: {
  nombre: string;
  size?: number;
  radius?: number;
  index?: number;
  color?: string;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: color ?? AVATAR_FONDOS[index % AVATAR_FONDOS.length],
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={[{ fontSize: size * 0.34, color: theme.colors.primaryDark }, font('display', 700)]}>{iniciales(nombre)}</Text>
    </View>
  );
}

/** Hoja que sube desde abajo (fondo blanco, radio superior 28). */
export function BottomSheet({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Cerrar" />
        <View style={[styles.sheet, { paddingBottom: 22 + insets.bottom }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, font('display', 700)]}>{title}</Text>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Cerrar" style={styles.iconButton}>
              <Feather name="x" size={20} color={theme.colors.textSecondary} />
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled">{children}</ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** Confirmación propia (Alert.alert no funciona en web). */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmText = 'Confirmar',
  danger,
  loading,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const fondo = danger ? theme.estados.CANCELADA.fg : theme.colors.primary;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.dialogWrap}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} accessibilityLabel="Cancelar" />
        <View style={styles.dialog} accessibilityRole="alert">
          <Text style={[styles.dialogTitle, font('display', 700)]}>{title}</Text>
          <Text style={[styles.dialogText, font('body', 400)]}>{message}</Text>
          <View style={styles.dialogActions}>
            <Pressable onPress={onCancel} accessibilityRole="button" style={[styles.dialogButton, styles.dialogCancel]}>
              <Text style={[{ color: theme.colors.text, fontSize: 15 }, font('body', 600)]}>Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              disabled={loading}
              accessibilityRole="button"
              style={[styles.dialogButton, { backgroundColor: fondo }, loading && { opacity: 0.7 }]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={[{ color: '#fff', fontSize: 15 }, font('body', 700)]}>{confirmText}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/** Aviso de éxito arriba de la pantalla. Va dentro de un contenedor con flex: 1. */
export function Toast({ titulo, detalle, onClose }: { titulo: string; detalle?: string; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.toast, { top: 12 + insets.top }]} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <View style={styles.toastIcon}>
        <Feather name="check" size={18} color={theme.estados.COMPLETADA.fg} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[{ color: '#fff', fontSize: 14 }, font('body', 700)]}>{titulo}</Text>
        {detalle ? <Text style={[{ color: '#F3D6E3', fontSize: 12, marginTop: 2 }, font('body', 400)]}>{detalle}</Text> : null}
      </View>
      <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Cerrar aviso" style={styles.iconButton}>
        <Feather name="x" size={18} color="#F3D6E3" />
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Estilos compartidos
// ---------------------------------------------------------------------------

export const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    backgroundColor: theme.colors.background,
    padding: 20,
    paddingBottom: 48, // el botón "+" de la barra sobresale por encima
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 24,
    marginBottom: 8,
  },
  field: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    minHeight: 48,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: theme.colors.text,
  },
  button: {
    minHeight: 48,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonOutline: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  message: {
    borderRadius: theme.radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginVertical: 8,
  },
  messageText: {
    fontSize: 14,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    borderRadius: theme.radius.xl,
    padding: 14,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  cardText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  empty: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    minHeight: theme.touch,
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 14,
  },
  chipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: {
    color: theme.colors.text,
    fontSize: 14,
  },
  pill: {
    alignSelf: 'flex-start',
    borderRadius: theme.radius.pill,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  pillText: {
    fontSize: 11,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(59, 30, 53, 0.35)',
  },
  sheet: {
    maxHeight: '88%',
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 10,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
    marginBottom: 6,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sheetTitle: {
    fontSize: 20,
    color: theme.colors.text,
  },
  dialogWrap: {
    flex: 1,
    backgroundColor: 'rgba(59, 30, 53, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
  },
  dialog: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    padding: 20,
    gap: 8,
    boxShadow: theme.shadow,
  },
  dialogTitle: {
    fontSize: 18,
    color: theme.colors.text,
  },
  dialogText: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textSecondary,
  },
  dialogActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  dialogButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.text,
    borderRadius: 20,
    paddingVertical: 8,
    paddingLeft: 12,
    paddingRight: 4,
    boxShadow: theme.shadow,
  },
  toastIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.estados.COMPLETADA.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogCancel: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
});
