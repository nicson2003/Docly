import React, { useCallback } from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { RootStackParamList, TimeSlot, DayOfWeek } from '../types';
import { useAppSelector } from '../hooks/useRedux';
import { Colors, Typography, Spacing, Radius } from '../theme';
import ScreenHeader from '../components/common/ScreenHeader';
import DoctorAvatar from '../components/common/DoctorAvatar';
import TimeSlotGrid from '../components/doctors/TimeSlotGrid';
import EmptyState from '../components/common/EmptyState';
import { selectBookedSlotIdsByDoctor, selectDoctorById } from '../selectors';

type Nav = NativeStackNavigationProp<RootStackParamList, 'DoctorDetail'>;
type Route = RouteProp<RootStackParamList, 'DoctorDetail'>;

export default function DoctorDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { doctorId } = params;

  const doctor = useAppSelector(selectDoctorById(doctorId));
  const bookedSlotIds = useAppSelector(selectBookedSlotIdsByDoctor(doctorId));

  const handleSlotPress = useCallback(
    (slot: TimeSlot, day: DayOfWeek) => {
      navigation.navigate('BookingConfirmation', {
        doctorId,
        slotId: slot.id,
        dayOfWeek: day,
      });
    },
    [navigation, doctorId],
  );

  if (!doctor) {
    return (
      <View style={styles.screen}>
        <ScreenHeader
          title="Doctor Details"
          showBack
          onBack={() => navigation.goBack()}
        />
        <EmptyState
          icon="🔍"
          title="Doctor not found"
          subtitle="This doctor's profile could not be loaded."
        />
      </View>
    );
  }

  const tzLabel = doctor.timezone.replace('Australia/', '');
  const totalSlots = doctor.schedule.reduce(
    (sum, d) => sum + d.slots.length,
    0,
  );
  const bookedCount = bookedSlotIds.size;
  const availableCount = totalSlots - bookedCount;

  console.log('test->', doctor.schedule);
  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Availability"
        showBack
        onBack={() => navigation.goBack()}
        elevated
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
      >
        {/* Doctor profile card */}
        <View style={styles.profileCard}>
          <DoctorAvatar
            initials={doctor.initials}
            color={doctor.avatarColor}
            size={72}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.doctorName}>{doctor.name}</Text>
            <Text style={styles.timezone}>📍 {tzLabel} timezone</Text>
            <View style={styles.statsRow}>
              <StatChip
                value={doctor.schedule.length}
                label="work days"
                color={Colors.primary}
              />
              <StatChip
                value={availableCount}
                label="slots open"
                color={Colors.success}
              />
              {bookedCount > 0 && (
                <StatChip
                  value={bookedCount}
                  label="booked"
                  color={Colors.error}
                />
              )}
            </View>
          </View>
        </View>

        {/* Sticky section header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Weekly Schedule</Text>
          <Text style={styles.sectionNote}>
            Tap a slot to book a 30-min appointment
          </Text>
        </View>

        {/* Calendar grid */}
        {doctor.schedule.length > 0 ? (
          <TimeSlotGrid
            schedule={doctor.schedule}
            bookedSlotIds={bookedSlotIds}
            onSlotPress={handleSlotPress}
          />
        ) : (
          <EmptyState
            icon="📅"
            title="No availability"
            subtitle="This doctor has no scheduled slots this week."
          />
        )}
      </ScrollView>
    </View>
  );
}

function StatChip({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: string;
}) {
  return (
    <View style={[styles.statChip, { borderColor: color + '33' }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  profileCard: {
    backgroundColor: Colors.surface,
    margin: Spacing.base,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.base,
  },
  profileInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  doctorName: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  timezone: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    flexWrap: 'wrap',
    marginTop: Spacing.xs,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  statValue: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
  statLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textTertiary,
  },
  sectionHeader: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  sectionNote: {
    fontSize: Typography.sizes.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
});
