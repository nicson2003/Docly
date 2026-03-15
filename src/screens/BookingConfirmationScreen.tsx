import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RootStackParamList } from '../types';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { addBooking } from '../store/slices/bookingsSlice';
import { Colors, Typography, Spacing, Radius, Shadows } from '../theme';
import DoctorAvatar from '../components/common/DoctorAvatar';
import { getNextDateForDay, formatDateShort } from '../utils';

type Nav = NativeStackNavigationProp<RootStackParamList, 'BookingConfirmation'>;
type Route = RouteProp<RootStackParamList, 'BookingConfirmation'>;

export default function BookingConfirmationScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { doctorId, slotId, dayOfWeek } = params;
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();

  const doctor = useAppSelector((s) =>
    s.doctors.items.find((d) => d.id === doctorId)
  );

  const slot = useMemo(() => {
    const day = doctor?.schedule.find((d) => d.day === dayOfWeek);
    return day?.slots.find((s) => s.id === slotId);
  }, [doctor, dayOfWeek, slotId]);

  const isAlreadyBooked = useAppSelector((s) =>
    s.bookings.items.some(
      (b) =>
        b.doctorId === doctorId &&
        b.slotId === slotId &&
        b.status === 'confirmed'
    )
  );

  const nextDate = useMemo(() => getNextDateForDay(dayOfWeek), [dayOfWeek]);

  const handleConfirm = useCallback(() => {
    if (!doctor || !slot) return;

    if (isAlreadyBooked) {
      Alert.alert(
        'Already Booked',
        'You already have an appointment for this slot.',
        [{ text: 'OK' }]
      );
      return;
    }

    dispatch(
      addBooking({
        doctorId: doctor.id,
        doctorName: doctor.name,
        doctorTimezone: doctor.timezone,
        slotId: slot.id,
        dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        displayStart: slot.displayStart,
        displayEnd: slot.displayEnd,
        isPendingSync: false,
      })
    );

    // Navigate to success screen, clearing the modal stack
    navigation.replace('BookingSuccess', {
      bookingId: `${doctorId}_${slotId}`,
    });
  }, [doctor, slot, isAlreadyBooked, dispatch, navigation, doctorId, dayOfWeek, slotId]);

  if (!doctor || !slot) {
    return (
      <View style={[styles.screen, { paddingBottom: insets.bottom }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Could not load booking details. Please go back and try again.
          </Text>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const tzLabel = doctor.timezone.replace('Australia/', '');

  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom + Spacing.base }]}>
      {/* Drag handle */}
      <View style={styles.handle} />

      {/* Title */}
      <Text style={styles.screenTitle}>Confirm Booking</Text>
      <Text style={styles.screenSub}>
        Review your appointment details below
      </Text>

      {/* Doctor info */}
      <View style={styles.doctorRow}>
        <DoctorAvatar
          initials={doctor.initials}
          color={doctor.avatarColor}
          size={56}
        />
        <View style={styles.doctorInfo}>
          <Text style={styles.doctorName}>{doctor.name}</Text>
          <Text style={styles.doctorTz}>📍 {tzLabel} time</Text>
        </View>
      </View>

      {/* Appointment details */}
      <View style={styles.detailsCard}>
        <DetailRow
          icon="📅"
          label="Day"
          value={`${dayOfWeek} — ${formatDateShort(nextDate)}`}
        />
        <View style={styles.detailDivider} />
        <DetailRow
          icon="⏰"
          label="Time"
          value={`${slot.displayStart} – ${slot.displayEnd}`}
        />
        <View style={styles.detailDivider} />
        <DetailRow icon="⏱" label="Duration" value="30 minutes" />
        <View style={styles.detailDivider} />
        <DetailRow icon="🌏" label="Timezone" value={`${tzLabel} (${doctor.timezone})`} />
      </View>

      {/* Notice */}
      <View style={styles.notice}>
        <Text style={styles.noticeText}>
          ℹ️ Slots recur weekly. Your booking is saved locally on this device.
        </Text>
      </View>

      {isAlreadyBooked && (
        <View style={styles.alreadyBooked}>
          <Text style={styles.alreadyBookedText}>
            ⚠️ You already have this slot booked.
          </Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          accessibilityLabel="Cancel and go back"
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.confirmBtn, isAlreadyBooked && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={isAlreadyBooked}
          activeOpacity={0.8}
          accessibilityLabel="Confirm appointment booking"
          accessibilityRole="button"
        >
          <Text style={styles.confirmBtnText}>
            {isAlreadyBooked ? 'Already Booked' : 'Confirm Booking'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailIcon}>{icon}</Text>
      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  screenTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.extrabold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  screenSub: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.primarySurface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.base,
  },
  doctorInfo: { flex: 1, gap: 2 },
  doctorName: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  doctorTz: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  detailsCard: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
    marginBottom: Spacing.base,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    gap: Spacing.md,
  },
  detailDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginHorizontal: Spacing.sm,
  },
  detailIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  detailContent: { flex: 1 },
  detailLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textTertiary,
    fontWeight: Typography.weights.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  detailValue: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginTop: 1,
  },
  notice: {
    backgroundColor: Colors.primarySurface,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.base,
  },
  noticeText: {
    fontSize: Typography.sizes.xs,
    color: Colors.primaryDark,
    lineHeight: 18,
  },
  alreadyBooked: {
    backgroundColor: Colors.warningLight,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.base,
  },
  alreadyBookedText: {
    fontSize: Typography.sizes.sm,
    color: Colors.warning,
    fontWeight: Typography.weights.medium,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: 'auto',
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.base,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
  },
  confirmBtn: {
    flex: 2,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.base,
    alignItems: 'center',
    ...Shadows.md,
  },
  confirmBtnDisabled: {
    backgroundColor: Colors.textDisabled,
  },
  confirmBtnText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.textInverse,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
    gap: Spacing.base,
  },
  errorText: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
