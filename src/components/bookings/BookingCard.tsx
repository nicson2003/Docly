import React, { memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Booking } from '../../types';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../theme';
import DoctorAvatar from '../common/DoctorAvatar';
import { getAvatarColor, getInitials, formatBookingDate } from '../../utils';

interface Props {
  booking: Booking;
  onCancel: (bookingId: string) => void;
}

function BookingCard({ booking, onCancel }: Props) {
  const isCancelled = booking.status === 'cancelled';
  const avatarColor = getAvatarColor(booking.doctorName);
  const initials = getInitials(booking.doctorName);
  const tzLabel = booking.doctorTimezone.replace('Australia/', '');

  const handleCancel = () => {
    Alert.alert(
      'Cancel Appointment',
      `Cancel your ${booking.dayOfWeek} ${booking.displayStart} appointment with ${booking.doctorName}?`,
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Cancel Appointment',
          style: 'destructive',
          onPress: () => onCancel(booking.id),
        },
      ]
    );
  };

  return (
    <View style={[styles.card, isCancelled && styles.cardCancelled]}>
      {/* Status bar */}
      <View
        style={[
          styles.statusBar,
          { backgroundColor: isCancelled ? Colors.textDisabled : avatarColor },
        ]}
      />

      <View style={styles.body}>
        {/* Top row */}
        <View style={styles.topRow}>
          <DoctorAvatar
            initials={initials}
            color={isCancelled ? Colors.textDisabled : avatarColor}
            size={44}
          />
          <View style={styles.doctorInfo}>
            <Text
              style={[styles.doctorName, isCancelled && styles.textMuted]}
              numberOfLines={1}
            >
              {booking.doctorName}
            </Text>
            <Text style={styles.timezone}>📍 {tzLabel} time</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              isCancelled ? styles.statusCancelled : styles.statusConfirmed,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                isCancelled ? styles.statusTextCancelled : styles.statusTextConfirmed,
              ]}
            >
              {isCancelled ? 'Cancelled' : '✓ Confirmed'}
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Time details */}
        <View style={styles.timeRow}>
          <View style={styles.timeBlock}>
            <Text style={styles.timeLabel}>Day</Text>
            <Text style={[styles.timeValue, isCancelled && styles.textMuted]}>
              {booking.dayOfWeek}
            </Text>
          </View>
          <View style={styles.timeSep} />
          <View style={styles.timeBlock}>
            <Text style={styles.timeLabel}>Time</Text>
            <Text style={[styles.timeValue, isCancelled && styles.textMuted]}>
              {booking.displayStart} – {booking.displayEnd}
            </Text>
          </View>
        </View>

        {/* Booked on */}
        <Text style={styles.bookedOn}>
          Booked on {formatBookingDate(booking.bookedAt)}
        </Text>

        {/* Offline indicator */}
        {booking.isPendingSync && !isCancelled && (
          <View style={styles.offlineBadge}>
            <Text style={styles.offlineText}>
              ⚡ Saved offline — will sync when connected
            </Text>
          </View>
        )}

        {/* Cancel button */}
        {!isCancelled && (
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={handleCancel}
            activeOpacity={0.7}
            accessibilityLabel={`Cancel appointment with ${booking.doctorName}`}
            accessibilityRole="button"
          >
            <Text style={styles.cancelText}>Cancel Appointment</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default memo(BookingCard);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    overflow: 'hidden',
    ...Shadows.sm,
  },
  cardCancelled: {
    opacity: 0.65,
  },
  statusBar: {
    width: 4,
  },
  body: {
    flex: 1,
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  doctorInfo: {
    flex: 1,
    gap: 2,
  },
  doctorName: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  timezone: {
    fontSize: Typography.sizes.xs,
    color: Colors.textTertiary,
  },
  statusBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  statusConfirmed: {
    backgroundColor: Colors.successLight,
  },
  statusCancelled: {
    backgroundColor: Colors.borderLight,
  },
  statusText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
  },
  statusTextConfirmed: { color: Colors.successDark },
  statusTextCancelled: { color: Colors.textTertiary },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
  },
  timeRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  timeBlock: {
    flex: 1,
    gap: 2,
  },
  timeSep: {
    width: 1,
    backgroundColor: Colors.divider,
    alignSelf: 'stretch',
  },
  timeLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textTertiary,
    fontWeight: Typography.weights.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeValue: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  textMuted: {
    color: Colors.textTertiary,
  },
  bookedOn: {
    fontSize: Typography.sizes.xs,
    color: Colors.textTertiary,
  },
  offlineBadge: {
    backgroundColor: Colors.warningLight,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
  },
  offlineText: {
    fontSize: Typography.sizes.xs,
    color: Colors.warning,
    fontWeight: Typography.weights.medium,
  },
  cancelBtn: {
    borderWidth: 1.5,
    borderColor: Colors.errorLight,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  cancelText: {
    color: Colors.error,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
});
