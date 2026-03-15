import { StyleSheet, Platform } from 'react-native';

export const Colors = {
  // Brand
  primary: '#0D7377',
  primaryLight: '#14A3A8',
  primaryDark: '#084E52',
  primarySurface: '#E6F4F5',
  primaryBorder: '#A8DADC',

  accent: '#32C8CD',
  accentLight: '#B2EEF0',

  // Semantic
  success: '#10B981',
  successLight: '#D1FAE5',
  successDark: '#065F46',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  errorDark: '#991B1B',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',

  // Neutrals
  background: '#F0F5F8',
  surface: '#FFFFFF',
  surfaceSecondary: '#F8FAFC',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  divider: '#EEF2F6',

  // Text
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  textDisabled: '#CBD5E1',
  textInverse: '#FFFFFF',
  textLink: '#0D7377',

  // Slot states
  slotAvailable: '#FFFFFF',
  slotAvailableBorder: '#CBD5E1',
  slotBooked: '#F1F5F9',
  slotBookedText: '#CBD5E1',
  slotSelected: '#0D7377',
  slotSelectedText: '#FFFFFF',

  // Tab bar
  tabActive: '#0D7377',
  tabInactive: '#94A3B8',

  // Avatar palette (deterministic)
  avatarPalette: [
    '#0D7377',
    '#7C3AED',
    '#DC2626',
    '#D97706',
    '#059669',
    '#2563EB',
    '#DB2777',
    '#9333EA',
    '#0891B2',
    '#65A30D',
  ],
};

export const Typography = {
  sizes: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    xxl: 28,
    xxxl: 34,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const Radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  xxl: 28,
  full: 9999,
};

export const Shadows = {
  sm: Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
    },
    android: { elevation: 2 },
    default: {},
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
    },
    android: { elevation: 4 },
    default: {},
  }),
  lg: Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
    },
    android: { elevation: 8 },
    default: {},
  }),
};

export const GlobalStyles = StyleSheet.create({
  flex1: { flex: 1 },
  screenBg: { flex: 1, backgroundColor: Colors.background },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    ...Shadows.sm,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },
  ph16: { paddingHorizontal: Spacing.base },
});
