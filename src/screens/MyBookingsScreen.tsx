import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { cancelBooking } from '../store/slices/bookingsSlice';
import { Booking } from '../types';
import { Colors, Typography, Spacing } from '../theme';
import BookingCard from '../components/bookings/BookingCard';
import EmptyState from '../components/common/EmptyState';

type Filter = 'all' | 'confirmed' | 'cancelled';

export default function MyBookingsScreen() {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>('confirmed');

  const allBookings = useAppSelector(s => s.bookings.items);

  const filteredBookings = useMemo(() => {
    const sorted = [...allBookings].sort(
      (a, b) => new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime(),
    );
    if (filter === 'all') return sorted;
    return sorted.filter(b => b.status === filter);
  }, [allBookings, filter]);

  const confirmedCount = useMemo(
    () => allBookings.filter(b => b.status === 'confirmed').length,
    [allBookings],
  );
  const cancelledCount = useMemo(
    () => allBookings.filter(b => b.status === 'cancelled').length,
    [allBookings],
  );

  const handleCancel = useCallback(
    (bookingId: string) => dispatch(cancelBooking(bookingId)),
    [dispatch],
  );

  const FILTERS: { key: Filter; label: string; count: number }[] = [
    { key: 'confirmed', label: 'Upcoming', count: confirmedCount },
    { key: 'cancelled', label: 'Cancelled', count: cancelledCount },
    { key: 'all', label: 'All', count: allBookings.length },
  ];

  return (
    <View style={styles.screen}>
      <FlatList
        data={filteredBookings}
        keyExtractor={item => item.id}
        renderItem={({ item, index }: { item: Booking; index: number }) => (
          <BookingCard booking={item} index={index} onCancel={handleCancel} />
        )}
        ListHeaderComponent={
          <View>
            <View
              style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}
            >
              <View style={styles.headerContent}>
                <View>
                  <Text style={styles.greeting}>Docly</Text>
                  <Text style={styles.headerTitle}>My Bookings</Text>
                  <Text style={styles.headerSub}>
                    {confirmedCount} upcoming appointment
                    {confirmedCount !== 1 ? 's' : ''}
                  </Text>
                </View>
                <View style={styles.logoCircle}>
                  <Text style={styles.logoEmoji}>📋</Text>
                </View>
              </View>
            </View>
            <View style={styles.filterRow}>
              {FILTERS.map(f => (
                <TouchableOpacity
                  key={f.key}
                  style={[
                    styles.filterTab,
                    filter === f.key && styles.filterTabActive,
                  ]}
                  onPress={() => setFilter(f.key)}
                  activeOpacity={0.7}
                  accessibilityLabel={`Show ${f.label} bookings`}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: filter === f.key }}
                >
                  <Text
                    style={[
                      styles.filterText,
                      filter === f.key && styles.filterTextActive,
                    ]}
                  >
                    {f.label}
                  </Text>
                  {f.count > 0 && (
                    <View
                      style={[
                        styles.filterBadge,
                        filter === f.key && styles.filterBadgeActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterBadgeText,
                          filter === f.key && styles.filterBadgeTextActive,
                        ]}
                      >
                        {f.count}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon={filter === 'confirmed' ? '📅' : '📭'}
            title={
              filter === 'confirmed'
                ? 'No upcoming appointments'
                : filter === 'cancelled'
                ? 'No cancelled appointments'
                : 'No bookings yet'
            }
            subtitle={
              filter === 'confirmed'
                ? 'Head to the Doctors tab to book your first appointment.'
                : undefined
            }
          />
        }
        contentContainerStyle={
          filteredBookings.length === 0
            ? styles.emptyContent
            : styles.listContent
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.lg,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: Spacing.base,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: Spacing.md,
  },
  greeting: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.extrabold,
    color: Colors.textInverse,
    marginTop: 2,
  },
  headerSub: {
    fontSize: Typography.sizes.sm,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
  },
  logoCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: { fontSize: 26 },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.textSecondary,
  },
  filterTextActive: { color: Colors.textInverse },
  filterBadge: {
    backgroundColor: Colors.borderLight,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 20,
    alignItems: 'center',
  },
  filterBadgeActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
  },
  filterBadgeTextActive: { color: Colors.textInverse },
  listContent: { paddingBottom: Spacing.xxxl },
  emptyContent: { flexGrow: 1 },
});
