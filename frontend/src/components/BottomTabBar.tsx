import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabParamList } from '../types/navigation';
import { font, theme } from './ui';

type IconName = React.ComponentProps<typeof Feather>['name'];

const TABS: Record<keyof TabParamList, { label: string; icon: IconName }> = {
  Inicio: { label: 'Inicio', icon: 'home' },
  Clientes: { label: 'Clientes', icon: 'users' },
  Nuevo: { label: 'Agendar', icon: 'plus' },
  Citas: { label: 'Citas', icon: 'calendar' },
  Reportes: { label: 'Reportes', icon: 'bar-chart-2' },
};

export const TAB_BAR_HEIGHT = 68;

/** Barra inferior flotante con el botón central "+" que abre AgendarCita. */
export default function BottomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.wrapper, { paddingBottom: 16 + insets.bottom }]}>
      <View style={s.bar}>
        {state.routes.map((route, index) => {
          const name = route.name as keyof TabParamList;
          const tab = TABS[name];
          const activa = state.index === index;

          if (name === 'Nuevo') {
            return (
              <View key={route.key} style={s.item}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Agendar cita"
                  onPress={() => navigation.navigate('AgendarCita')}
                  style={({ pressed }) => [s.fab, pressed && { opacity: 0.85 }]}
                >
                  <Feather name="plus" size={26} color="#fff" />
                </Pressable>
              </View>
            );
          }

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!activa && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const color = activa ? theme.colors.primary : theme.colors.textSecondary;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: activa }}
              accessibilityLabel={tab.label}
              onPress={onPress}
              style={s.item}
            >
              <View style={[s.iconPill, activa && { backgroundColor: theme.colors.pink50 }]}>
                <Feather name={tab.icon} size={20} color={color} />
              </View>
              <Text style={[s.label, font('body', activa ? 700 : 500), { color }]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: 14,
  },
  bar: {
    height: TAB_BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 26,
    boxShadow: theme.shadow,
  },
  item: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  iconPill: {
    width: 44,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 20,
    transform: [{ translateY: -22 }], // sobresale por encima de la barra
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: theme.shadowStrong,
  },
});
