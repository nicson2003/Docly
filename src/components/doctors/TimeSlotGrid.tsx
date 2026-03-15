import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  FlatList,
} from 'react-native';
import { DaySchedule, TimeSlot, DayOfWeek } from '../../types';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../theme';
import { getNextDateForDay } from '../../utils';

interface Props {
  schedule: DaySchedule[];
  bookedSlotIds: Set<string>;
  onSlotPress: (slot: TimeSlot, day: DayOfWeek) => void;
}

const DAY_ABBREV: Record<string, string> = {
  Monday: 'MON',
  Tuesday: 'TUE',
  Wednesday: 'WED',
  Thursday: 'THU',
  Friday: 'FRI',
  Saturday: 'SAT',
  Sunday: 'SUN',
};

interface SlotItemProps {
  slot: TimeSlot;
  isBooked: boolean;
  onPress: (slot: TimeSlot) => void;
}

const SlotItem = memo(({ slot, isBooked, onPress }: SlotItemProps) => (
  <TouchableOpacity
    style={[styles.slot, isBooked && styles.slotBooked]}
    onPress={() => !isBooked && onPress(slot)}
    disabled={isBooked}
    activeOpacity={0.7}
    accessibilityLabel={
      isBooked
        ? `${slot.displayStart} – already booked`
        : `Book ${slot.displayStart} to ${slot.displayEnd}`
    }
    accessibilityRole="button"
    accessibilityState={{ disabled: isBooked }}
  >
    <Text style={[styles.slotTime, isBooked && styles.slotTimeBooked]}>
      {slot.displayStart}
    </Text>
    <Text style={[styles.slotDash, isBooked && styles.slotTimeBooked]}>–</Text>
    <Text style={[styles.slotTime, isBooked && styles.slotTimeBooked]}>
      {slot.displayEnd}
    </Text>
    {isBooked && (
      <View style={styles.bookedBadge}>
        <Text style={styles.bookedBadgeText}>Booked</Text>
      </View>
    )}
  </TouchableOpacity>
));

import { memo } from 'react';

export default function TimeSlotGrid({
  schedule,
  bookedSlotIds,
  onSlotPress,
}: Props) {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(
    schedule[0]?.day ?? 'Monday'
  );

  const selectedSchedule = useMemo(
    () => schedule.find((s) => s.day === selectedDay),
    [schedule, selectedDay]
  );

  const handleSlotPress = useCallback(
    (slot: TimeSlot) => {
      onSlotPress(slot, selectedDay);
    },
    [onSlotPress, selectedDay]
  );

  const availableCount = useMemo(
    () =>
      selectedSchedule?.slots.filter((s) => !bookedSlotIds.has(s.id)).length ??
      0,
    [selectedSchedule, bookedSlotIds]
  );

  return (
    <View style={styles.container}>
      {/* Day tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dayScroll}
        contentContainerStyle={styles.dayScrollContent}
      >
        {schedule.map((daySchedule) => {
          const isSelected = daySchedule.day === selectedDay;
          const date = getNextDateForDay(daySchedule.day);
          const dateNum = date.getDate();
          const monthStr = date.toLocaleDateString('en-AU', { month: 'short' });
          const bookedInDay = daySchedule.slots.filter((s) =>
            bookedSlotIds.has(s.id)
          ).length;
          const availInDay = daySchedule.slots.length - bookedInDay;

          return (
            <TouchableOpacity
              key={daySchedule.day}
              style={[styles.dayTab, isSelected && styles.dayTabSelected]}
              onPress={() => setSelectedDay(daySchedule.day)}
              activeOpacity={0.7}
              accessibilityLabel={`${daySchedule.day}, ${availInDay} slots available`}
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
            >
              <Text
                style={[
                  styles.dayAbbrev,
                  isSelected && styles.dayTextSelected,
                ]}
              >
                {DAY_ABBREV[daySchedule.day]}
              </Text>
              <Text
                style={[styles.dayNum, isSelected && styles.dayTextSelected]}
              >
                {dateNum}
              </Text>
              <Text
                style={[
                  styles.dayMonth,
                  isSelected && styles.dayMonthSelected,
                ]}
              >
                {monthStr}
              </Text>
              {availInDay > 0 && (
                <View
                  style={[
                    styles.dayDot,
                    isSelected && styles.dayDotSelected,
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Slot count header */}
      <View style={styles.slotHeader}>
        <Text style={styles.slotHeaderText}>
          {selectedDay} ·{' '}
          <Text style={styles.slotHeaderCount}>
            {availableCount} slot{availableCount !== 1 ? 's' : ''} available
          </Text>
        </Text>
      </View>

      {/* Slot grid */}
      {selectedSchedule ? (
        <FlatList
          data={selectedSchedule.slots}
          keyExtractor={(item) => item.id}
          numColumns={2}
          scrollEnabled={false}
          contentContainerStyle={styles.slotsGrid}
          columnWrapperStyle={styles.slotRow}
          renderItem={({ item }) => (
            <SlotItem
              slot={item}
              isBooked={bookedSlotIds.has(item.id)}
              onPress={handleSlotPress}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.noSlots}>No slots for this day.</Text>
          }
        />
      ) : (
        <Text style={styles.noSlots}>No availability for this day.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Day tabs
  dayScroll: {
    flexGrow: 0,
  },
  dayScrollContent: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  dayTab: {
    width: 64,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  dayTabSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayAbbrev: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textTertiary,
    letterSpacing: 0.5,
  },
  dayNum: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extrabold,
    color: Colors.textPrimary,
    lineHeight: 28,
  },
  dayMonth: {
    fontSize: 10,
    color: Colors.textTertiary,
    fontWeight: Typography.weights.medium,
  },
  dayTextSelected: {
    color: Colors.textInverse,
  },
  dayMonthSelected: {
    color: 'rgba(255,255,255,0.75)',
  },
  dayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
    marginTop: 3,
  },
  dayDotSelected: {
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  // Slot header
  slotHeader: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  slotHeaderText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  slotHeaderCount: {
    color: Colors.primary,
    fontWeight: Typography.weights.semibold,
  },
  // Slot grid
  slotsGrid: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xxl,
  },
  slotRow: {
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  slot: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.slotAvailableBorder,
    gap: 2,
    ...Shadows.sm,
  },
  slotBooked: {
    backgroundColor: Colors.slotBooked,
    borderColor: Colors.border,
  },
  slotTime: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  slotDash: {
    fontSize: Typography.sizes.xs,
    color: Colors.textTertiary,
  },
  slotTimeBooked: {
    color: Colors.textDisabled,
  },
  bookedBadge: {
    marginTop: Spacing.xs,
    backgroundColor: Colors.errorLight,
    borderRadius: Radius.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  bookedBadgeText: {
    fontSize: 10,
    color: Colors.errorDark,
    fontWeight: Typography.weights.medium,
  },
  noSlots: {
    textAlign: 'center',
    color: Colors.textTertiary,
    fontSize: Typography.sizes.base,
    paddingVertical: Spacing.xxl,
  },
});
