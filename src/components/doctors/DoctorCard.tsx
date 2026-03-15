import React, { memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Doctor } from '../../types';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../theme';
import DoctorAvatar from '../common/DoctorAvatar';

interface Props {
  doctor: Doctor;
  onPress: (doctorId: string) => void;
}

function DoctorCard({ doctor, onPress }: Props) {
  const totalSlots = doctor.schedule.reduce(
    (sum, d) => sum + d.slots.length,
    0
  );
  const availableDays = doctor.schedule.length;
  const tzLabel = doctor.timezone.replace('Australia/', '');

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(doctor.id)}
      activeOpacity={0.75}
      accessibilityLabel={`View availability for ${doctor.name}`}
      accessibilityRole="button"
    >
      {/* Left accent bar */}
      <View style={[styles.accent, { backgroundColor: doctor.avatarColor }]} />

      <View style={styles.body}>
        <DoctorAvatar
          initials={doctor.initials}
          color={doctor.avatarColor}
          size={52}
        />

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {doctor.name}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>🗓 {availableDays} day{availableDays !== 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>⏰ {totalSlots} slots</Text>
            </View>
          </View>
          <Text style={styles.tz}>📍 {tzLabel} time</Text>
        </View>

        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

export default memo(DoctorCard);

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
  accent: {
    width: 4,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    gap: Spacing.md,
  },
  info: {
    flex: 1,
    gap: Spacing.xs,
  },
  name: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  badge: {
    backgroundColor: Colors.primarySurface,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: Typography.sizes.xs,
    color: Colors.primaryDark,
    fontWeight: Typography.weights.medium,
  },
  tz: {
    fontSize: Typography.sizes.xs,
    color: Colors.textTertiary,
  },
  chevron: {
    fontSize: 26,
    color: Colors.textTertiary,
    lineHeight: 30,
  },
});
