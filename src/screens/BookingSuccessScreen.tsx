import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../types';
import { Colors, Typography, Spacing, Radius, Shadows } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'BookingSuccess'>;

export default function BookingSuccessScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const handleGoToBookings = () =>
    navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
  const handleBookAnother = () =>
    navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });

  return (
    <View
      style={[styles.screen, { paddingBottom: insets.bottom + Spacing.lg }]}
    >
      {/* Success circle */}
      <Animated.View
        style={[styles.successCircle, { transform: [{ scale: scaleAnim }] }]}
        testID="success-circle" // ← ADD
      >
        <Text style={styles.checkmark}>✓</Text>
      </Animated.View>

      {/* Content */}
      <Animated.View
        style={[
          styles.content,
          { opacity: opacityAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <Text style={styles.title}>Appointment Booked!</Text>
        <Text style={styles.subtitle}>
          Your appointment has been confirmed and saved to your device.
        </Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            ℹ️ Your booking is stored locally. Slots recur weekly — you'll
            always see your confirmed bookings in "My Bookings".
          </Text>
        </View>
      </Animated.View>

      {/* Actions */}
      <Animated.View style={[styles.actions, { opacity: opacityAnim }]}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={handleGoToBookings}
          activeOpacity={0.8}
          accessibilityLabel="View my bookings"
          accessibilityRole="button"
        >
          <Text style={styles.primaryBtnText}>View My Bookings</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={handleBookAnother}
          activeOpacity={0.7}
          accessibilityLabel="Book another appointment"
        >
          <Text style={styles.secondaryBtnText}>Book Another</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    ...Shadows.lg,
  },
  checkmark: {
    fontSize: 60,
    color: Colors.textInverse,
    fontWeight: Typography.weights.bold,
    lineHeight: 72,
  },
  content: { alignItems: 'center', gap: Spacing.md, width: '100%' },
  title: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.extrabold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.lg,
  },
  infoCard: {
    backgroundColor: Colors.primarySurface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    width: '100%',
    marginTop: Spacing.sm,
  },
  infoText: {
    fontSize: Typography.sizes.sm,
    color: Colors.primaryDark,
    lineHeight: 20,
    textAlign: 'center',
  },
  actions: { width: '100%', gap: Spacing.sm, marginTop: Spacing.xxl },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.base,
    alignItems: 'center',
    ...Shadows.md,
  },
  primaryBtnText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.textInverse,
  },
  secondaryBtn: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.base,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
  },
});
