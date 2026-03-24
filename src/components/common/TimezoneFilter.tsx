import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import TimezoneChip from './TimezoneChip';
import { Colors, Typography, Spacing } from '../../theme';

type Doctor = { id: string; timezone: string };

type TimezoneFilterProps = {
  timezones: string[];
  doctors: Doctor[];
  selectedTimezone: string | null;
  onSelect: (tz: string | null) => void;
};

export function timezoneLabel(tz: string): string {
  return tz.replace('Australia/', '').replace('_', ' ');
}

function TimezoneFilterComponent({
  timezones,
  doctors,
  selectedTimezone,
  onSelect,
}: TimezoneFilterProps) {
  return (
    <View style={styles.filterSection}>
      <Text style={styles.filterLabel}>Filter by timezone</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterChipsRow}
      >
        {/* "All" chip */}
        <TimezoneChip
          label="🌏 All"
          active={!selectedTimezone}
          onPress={() => onSelect(null)}
        />

        {/* Timezone chips */}
        {timezones.map(tz => {
          const active = selectedTimezone === tz;
          const count = doctors.filter(d => d.timezone === tz).length;
          return (
            <TimezoneChip
              key={tz}
              label={timezoneLabel(tz)}
              active={active}
              count={count}
              onPress={() => onSelect(tz)}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

export default React.memo(TimezoneFilterComponent);

const styles = StyleSheet.create({
  filterSection: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  filterLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  filterChipsRow: {
    gap: Spacing.sm,
    paddingRight: Spacing.sm,
  },
});
