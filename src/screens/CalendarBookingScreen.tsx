/* eslint-disable react-hooks/exhaustive-deps */
import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Animated,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RootStackParamList, Doctor, DayOfWeek } from '../types';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { addBooking } from '../store/slices/bookingsSlice';
import { Colors, Typography, Spacing, Radius, Shadows } from '../theme';
import DoctorAvatar from '../components/common/DoctorAvatar';
import {
  getInitials,
  getAvatarColor,
  minutesToDisplay,
  DAY_ORDER,
} from '../utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AvailableDoctor {
  doctor: Doctor;
  slotId: string;
  displayStart: string;
  displayEnd: string;
  startTime: string;
  endTime: string;
  dayOfWeek: DayOfWeek;
}

type Nav = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

const SCREEN_WIDTH = Dimensions.get('window').width;
const DAY_CELL_SIZE = Math.floor((SCREEN_WIDTH - Spacing.base * 2) / 7);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns "Monday" … "Sunday" for a JS Date (JS Sunday=0 → index 6 in DAY_ORDER). */
function toDayOfWeek(date: Date): DayOfWeek {
  const jsDay = date.getDay(); // 0=Sun … 6=Sat
  const idx = jsDay === 0 ? 6 : jsDay - 1; // Mon=0 … Sun=6
  return DAY_ORDER[idx];
}

/** Converts a "HH:MM" 24h string to total minutes. */
function to24hMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/** ISO date string "YYYY-MM-DD" for a Date object (local). */
function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(date.getDate()).padStart(2, '0')}`;
}

/** "Tue, Mar 18" */
function formatHeaderDate(date: Date): string {
  return date.toLocaleDateString('en-AU', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/** "March 2025" */
function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface DayCellProps {
  date: Date | null; // null = empty padding cell
  isToday: boolean;
  isSelected: boolean;
  hasDoctors: boolean;
  isPast: boolean;
  onPress: (date: Date) => void;
}

const DayCell = React.memo(
  ({
    date,
    isToday,
    isSelected,
    hasDoctors,
    isPast,
    onPress,
  }: DayCellProps) => {
    if (!date) {
      return <View style={[styles.dayCell, styles.dayCellEmpty]} />;
    }

    return (
      <TouchableOpacity
        style={[
          styles.dayCell,
          isSelected && styles.dayCellSelected,
          isPast && styles.dayCellPast,
        ]}
        onPress={() => onPress(date)}
        disabled={isPast}
        activeOpacity={0.7}
        accessibilityLabel={`${date.getDate()} ${isSelected ? 'selected' : ''}`}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected, disabled: isPast }}
      >
        <Text
          style={[
            styles.dayCellText,
            isToday && !isSelected && styles.dayCellTextToday,
            isSelected && styles.dayCellTextSelected,
            isPast && styles.dayCellTextPast,
          ]}
        >
          {date.getDate()}
        </Text>
        {hasDoctors && !isPast && (
          <View
            style={[styles.dayCellDot, isSelected && styles.dayCellDotSelected]}
          />
        )}
      </TouchableOpacity>
    );
  },
);

interface TimeChipProps {
  slotMins: number;
  isSelected: boolean;
  doctorCount: number;
  onPress: (slotMins: number) => void;
}

const TimeChip = React.memo(
  ({ slotMins, isSelected, doctorCount, onPress }: TimeChipProps) => (
    <TouchableOpacity
      style={[styles.timeChip, isSelected && styles.timeChipSelected]}
      onPress={() => onPress(slotMins)}
      activeOpacity={0.7}
      accessibilityLabel={`${minutesToDisplay(
        slotMins,
      )}, ${doctorCount} doctor${doctorCount !== 1 ? 's' : ''} available`}
      accessibilityRole="button"
    >
      <Text
        style={[styles.timeChipText, isSelected && styles.timeChipTextSelected]}
      >
        {minutesToDisplay(slotMins)}
      </Text>
      {doctorCount > 0 && (
        <View
          style={[
            styles.timeChipBadge,
            isSelected && styles.timeChipBadgeSelected,
          ]}
        >
          <Text
            style={[
              styles.timeChipBadgeText,
              isSelected && styles.timeChipBadgeTextSelected,
            ]}
          >
            {doctorCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  ),
);

interface DoctorRowProps {
  item: AvailableDoctor;
  onPress: (item: AvailableDoctor) => void;
}

const DoctorRow = React.memo(({ item, onPress }: DoctorRowProps) => {
  const color = getAvatarColor(item.doctor.name);
  const initials = getInitials(item.doctor.name);
  const tzLabel = item.doctor.timezone.replace('Australia/', '');

  return (
    <TouchableOpacity
      style={styles.doctorRow}
      onPress={() => onPress(item)}
      activeOpacity={0.75}
      accessibilityLabel={`Book ${item.doctor.name}`}
      accessibilityRole="button"
    >
      <View style={[styles.doctorRowAccent, { backgroundColor: color }]} />
      <DoctorAvatar initials={initials} color={color} size={46} />
      <View style={styles.doctorRowInfo}>
        <Text style={styles.doctorRowName} numberOfLines={1}>
          {item.doctor.name}
        </Text>
        <Text style={styles.doctorRowMeta}>
          {item.displayStart} – {item.displayEnd} · {tzLabel}
        </Text>
      </View>
      <View style={styles.doctorRowArrow}>
        <Text style={styles.doctorRowArrowText}>›</Text>
      </View>
    </TouchableOpacity>
  );
});

// ─── Confirmation Modal ───────────────────────────────────────────────────────

interface ConfirmModalProps {
  visible: boolean;
  item: AvailableDoctor | null;
  selectedDate: Date | null;
  onClose: () => void;
  onConfirm: () => void;
}

function ConfirmModal({
  visible,
  item,
  selectedDate,
  onClose,
  onConfirm,
}: ConfirmModalProps) {
  const slideAnim = useRef(new Animated.Value(300)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!item || !selectedDate) return null;

  const color = getAvatarColor(item.doctor.name);
  const initials = getInitials(item.doctor.name);
  const tzLabel = item.doctor.timezone.replace('Australia/', '');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Animated.View style={[styles.modalBackdrop, { opacity: backdropAnim }]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          onPress={onClose}
        />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[styles.modalSheet, { transform: [{ translateY: slideAnim }] }]}
      >
        {/* Handle */}
        <View style={styles.modalHandle} />

        {/* Doctor header */}
        <View style={styles.modalDoctorHeader}>
          <DoctorAvatar initials={initials} color={color} size={56} />
          <View style={styles.modalDoctorInfo}>
            <Text style={styles.modalDoctorName}>{item.doctor.name}</Text>
            <Text style={styles.modalDoctorTz}>📍 {tzLabel} time</Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.modalDetails}>
          <ModalDetailRow
            icon="📅"
            label="Date"
            value={formatHeaderDate(selectedDate)}
          />
          <View style={styles.modalDetailDivider} />
          <ModalDetailRow
            icon="⏰"
            label="Time"
            value={`${item.displayStart} – ${item.displayEnd}`}
          />
          <View style={styles.modalDetailDivider} />
          <ModalDetailRow icon="⏱" label="Duration" value="30 minutes" />
          <View style={styles.modalDetailDivider} />
          <ModalDetailRow
            icon="🌏"
            label="Timezone"
            value={`${tzLabel} (${item.doctor.timezone})`}
          />
        </View>

        <View style={styles.modalNotice}>
          <Text style={styles.modalNoticeText}>
            ℹ️ Slots recur weekly. Booking is saved locally on this device.
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.modalActions}>
          <TouchableOpacity
            style={styles.modalCancelBtn}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.modalConfirmBtn}
            onPress={onConfirm}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Confirm appointment booking"
          >
            <Text style={styles.modalConfirmText}>Confirm Booking</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

function ModalDetailRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.modalDetailRow}>
      <Text style={styles.modalDetailIcon}>{icon}</Text>
      <View style={styles.modalDetailContent}>
        <Text style={styles.modalDetailLabel}>{label}</Text>
        <Text style={styles.modalDetailValue}>{value}</Text>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CalendarBookingScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();

  const doctors = useAppSelector(s => s.doctors.items);
  const bookings = useAppSelector(s => s.bookings.items);

  // Calendar state
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [viewDate, setViewDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlotMins, setSelectedSlotMins] = useState<number | null>(null);
  const [pendingItem, setPendingItem] = useState<AvailableDoctor | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Animation for the bottom panel
  const panelAnim = useRef(new Animated.Value(0)).current;
  const doctorsAnim = useRef(new Animated.Value(0)).current;

  // Confirmed booking slot IDs — for disabling already-booked slots
  const confirmedSlotIds = useMemo(() => {
    const ids = new Set<string>();
    bookings
      .filter(b => b.status === 'confirmed')
      .forEach(b => ids.add(`${b.doctorId}::${b.slotId}`));
    return ids;
  }, [bookings]);

  // ── Calendar grid ──────────────────────────────────────────────────────────

  /** All days that have ≥1 available doctor (used for dot indicator). */
  const daysWithDoctors = useMemo(() => {
    const set = new Set<string>();
    doctors.forEach(doctor => {
      doctor.schedule.forEach(daySchedule => {
        // Find the next N occurrences of this day across the viewable range
        const targetDay = daySchedule.day;
        // Mark the next 8 weeks
        for (let w = 0; w < 8; w++) {
          const dayIdx = DAY_ORDER.indexOf(targetDay); // 0=Mon … 6=Sun
          const todayIdx = today.getDay() === 0 ? 6 : today.getDay() - 1;
          let diff = dayIdx - todayIdx + w * 7;
          if (diff < 0) diff += 7;
          const d = new Date(today);
          d.setDate(today.getDate() + diff);
          set.add(toDateKey(d));
        }
      });
    });
    return set;
  }, [doctors, today]);

  /** Builds the 6×7 grid of Date | null cells for the current view month. */
  const calendarCells = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Shift so Monday is index 0
    const offset = firstDay === 0 ? 6 : firstDay - 1;
    const cells: (Date | null)[] = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(year, month, d));
    }
    // Pad to complete last row
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewDate]);

  // ── Available slots for the selected date ─────────────────────────────────

  /** All unique 30-min slot times (in minutes) available on the selected date. */
  const availableSlotMins = useMemo(() => {
    if (!selectedDate) return [];
    const dayName = toDayOfWeek(selectedDate);
    const slotSet = new Set<number>();

    doctors.forEach(doctor => {
      const daySchedule = doctor.schedule.find(s => s.day === dayName);
      if (!daySchedule) return;
      daySchedule.slots.forEach(slot => {
        slotSet.add(to24hMinutes(slot.startTime));
      });
    });

    return Array.from(slotSet).sort((a, b) => a - b);
  }, [selectedDate, doctors]);

  /** Number of available (non-booked) doctors per slot minute. */
  const doctorCountPerSlot = useMemo(() => {
    const map = new Map<number, number>();
    if (!selectedDate) return map;
    const dayName = toDayOfWeek(selectedDate);

    availableSlotMins.forEach(mins => {
      let count = 0;
      doctors.forEach(doctor => {
        const daySchedule = doctor.schedule.find(s => s.day === dayName);
        if (!daySchedule) return;
        const slot = daySchedule.slots.find(
          s => to24hMinutes(s.startTime) === mins,
        );
        if (!slot) return;
        const key = `${doctor.id}::${slot.id}`;
        if (!confirmedSlotIds.has(key)) count++;
      });
      map.set(mins, count);
    });
    return map;
  }, [selectedDate, doctors, availableSlotMins, confirmedSlotIds]);

  /** Doctors available at the selected slot. */
  const availableDoctors = useMemo((): AvailableDoctor[] => {
    if (!selectedDate || selectedSlotMins === null) return [];
    const dayName = toDayOfWeek(selectedDate);
    const result: AvailableDoctor[] = [];

    doctors.forEach(doctor => {
      const daySchedule = doctor.schedule.find(s => s.day === dayName);
      if (!daySchedule) return;
      const slot = daySchedule.slots.find(
        s => to24hMinutes(s.startTime) === selectedSlotMins,
      );
      if (!slot) return;
      const key = `${doctor.id}::${slot.id}`;
      if (confirmedSlotIds.has(key)) return; // already booked
      result.push({
        doctor,
        slotId: slot.id,
        displayStart: slot.displayStart,
        displayEnd: slot.displayEnd,
        startTime: slot.startTime,
        endTime: slot.endTime,
        dayOfWeek: dayName,
      });
    });

    return result;
  }, [selectedDate, selectedSlotMins, doctors, confirmedSlotIds]);

  // ── Interactions ──────────────────────────────────────────────────────────

  const handleMonthChange = useCallback((dir: 1 | -1) => {
    setViewDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + dir);
      return d;
    });
    setSelectedDate(null);
    setSelectedSlotMins(null);
  }, []);

  const handleDatePress = useCallback(
    (date: Date) => {
      setSelectedDate(date);
      setSelectedSlotMins(null);
      // Animate slots panel in
      panelAnim.setValue(0);
      Animated.spring(panelAnim, {
        toValue: 1,
        tension: 70,
        friction: 12,
        useNativeDriver: true,
      }).start();
    },
    [panelAnim],
  );

  const handleSlotPress = useCallback(
    (slotMins: number) => {
      setSelectedSlotMins(prev => (prev === slotMins ? null : slotMins));
      doctorsAnim.setValue(0);
      Animated.spring(doctorsAnim, {
        toValue: 1,
        tension: 70,
        friction: 12,
        useNativeDriver: true,
      }).start();
    },
    [doctorsAnim],
  );

  const handleDoctorPress = useCallback((item: AvailableDoctor) => {
    setPendingItem(item);
    setModalVisible(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setModalVisible(false);
    setTimeout(() => setPendingItem(null), 300);
  }, []);

  const handleConfirm = useCallback(() => {
    if (!pendingItem) return;
    dispatch(
      addBooking({
        doctorId: pendingItem.doctor.id,
        doctorName: pendingItem.doctor.name,
        doctorTimezone: pendingItem.doctor.timezone,
        slotId: pendingItem.slotId,
        dayOfWeek: pendingItem.dayOfWeek,
        startTime: pendingItem.startTime,
        endTime: pendingItem.endTime,
        displayStart: pendingItem.displayStart,
        displayEnd: pendingItem.displayEnd,
        isPendingSync: false,
      }),
    );
    setModalVisible(false);
    setTimeout(() => {
      setPendingItem(null);
      // Navigate to My Bookings tab
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    }, 320);
  }, [pendingItem, dispatch, navigation]);

  // ── Derived display values ────────────────────────────────────────────────

  const panelTranslateY = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [24, 0],
  });
  const doctorsTranslateY = doctorsAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  const selectedDateLabel = selectedDate
    ? formatHeaderDate(selectedDate)
    : null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerApp}>Docly</Text>
          <Text style={styles.headerTitle}>Book Appointment</Text>
          {selectedDateLabel ? (
            <Text style={styles.headerSub}>{selectedDateLabel}</Text>
          ) : (
            <Text style={styles.headerSub}>Select a date to get started</Text>
          )}
        </View>
        <View style={styles.headerIcon}>
          <Text style={styles.headerIconText}>📆</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Month Navigation ──────────────────────────────────────────── */}
        <View style={styles.monthNav}>
          <TouchableOpacity
            style={styles.monthNavBtn}
            onPress={() => handleMonthChange(-1)}
            accessibilityLabel="Previous month"
            accessibilityRole="button"
          >
            <Text style={styles.monthNavBtnText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthNavLabel}>{formatMonthYear(viewDate)}</Text>
          <TouchableOpacity
            style={styles.monthNavBtn}
            onPress={() => handleMonthChange(1)}
            accessibilityLabel="Next month"
            accessibilityRole="button"
          >
            <Text style={styles.monthNavBtnText}>›</Text>
          </TouchableOpacity>
        </View>

        {/* ── Day-of-week labels ────────────────────────────────────────── */}
        <View style={styles.dowRow}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <View key={i} style={styles.dowCell}>
              <Text style={styles.dowText}>{d}</Text>
            </View>
          ))}
        </View>

        {/* ── Calendar Grid ─────────────────────────────────────────────── */}
        <View style={styles.calendarGrid}>
          {calendarCells.map((date, idx) => {
            const dateKey = date ? toDateKey(date) : null;
            const isToday = !!date && date.getTime() === today.getTime();
            const isSelected =
              !!date &&
              !!selectedDate &&
              date.getTime() === selectedDate.getTime();
            const hasDoctors = !!dateKey && daysWithDoctors.has(dateKey);
            const isPast = !!date && date < today;

            return (
              <DayCell
                key={dateKey ?? `empty-${idx}`}
                date={date}
                isToday={isToday}
                isSelected={isSelected}
                hasDoctors={hasDoctors}
                isPast={isPast}
                onPress={handleDatePress}
              />
            );
          })}
        </View>

        {/* ── Legend ───────────────────────────────────────────────────── */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={styles.legendDot} />
            <Text style={styles.legendText}>Doctors available</Text>
          </View>
        </View>

        {/* ── Time Slots Panel ─────────────────────────────────────────── */}
        {selectedDate && availableSlotMins.length > 0 && (
          <Animated.View
            style={[
              styles.slotsPanel,
              {
                opacity: panelAnim,
                transform: [{ translateY: panelTranslateY }],
              },
            ]}
          >
            <View style={styles.slotsPanelHeader}>
              <Text style={styles.slotsPanelTitle}>
                {formatHeaderDate(selectedDate)}
              </Text>
              <View style={styles.slotsPanelBadge}>
                <Text style={styles.slotsPanelBadgeText}>
                  {availableSlotMins.length} slots
                </Text>
              </View>
            </View>
            <Text style={styles.slotsPanelSub}>Select a time</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.timeChipsScroll}
            >
              {availableSlotMins.map(mins => (
                <TimeChip
                  key={mins}
                  slotMins={mins}
                  isSelected={selectedSlotMins === mins}
                  doctorCount={doctorCountPerSlot.get(mins) ?? 0}
                  onPress={handleSlotPress}
                />
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* ── No slots message ─────────────────────────────────────────── */}
        {selectedDate && availableSlotMins.length === 0 && (
          <Animated.View
            style={[
              styles.noSlotsCard,
              {
                opacity: panelAnim,
                transform: [{ translateY: panelTranslateY }],
              },
            ]}
          >
            <Text style={styles.noSlotsEmoji}>😔</Text>
            <Text style={styles.noSlotsTitle}>No doctors available</Text>
            <Text style={styles.noSlotsSub}>
              No doctors are scheduled on {formatHeaderDate(selectedDate)}. Try
              another date.
            </Text>
          </Animated.View>
        )}

        {/* ── Available Doctors ─────────────────────────────────────────── */}
        {selectedSlotMins !== null && (
          <Animated.View
            style={[
              styles.doctorsPanel,
              {
                opacity: doctorsAnim,
                transform: [{ translateY: doctorsTranslateY }],
              },
            ]}
          >
            <View style={styles.doctorsPanelHeader}>
              <Text style={styles.doctorsPanelTitle}>
                {availableDoctors.length > 0
                  ? `${availableDoctors.length} doctor${
                      availableDoctors.length !== 1 ? 's' : ''
                    } available`
                  : 'No doctors available'}
              </Text>
              <Text style={styles.doctorsPanelSub}>
                {minutesToDisplay(selectedSlotMins)} –{' '}
                {minutesToDisplay(selectedSlotMins + 30)}
              </Text>
            </View>

            {availableDoctors.length > 0 ? (
              availableDoctors.map(item => (
                <DoctorRow
                  key={`${item.doctor.id}-${item.slotId}`}
                  item={item}
                  onPress={handleDoctorPress}
                />
              ))
            ) : (
              <View style={styles.noDoctorsRow}>
                <Text style={styles.noDoctorsText}>
                  All doctors are fully booked at this time. Try another slot.
                </Text>
              </View>
            )}
          </Animated.View>
        )}

        {/* Bottom padding */}
        <View style={{ height: insets.bottom + Spacing.xxl }} />
      </ScrollView>

      {/* ── Confirmation Modal ───────────────────────────────────────────── */}
      <ConfirmModal
        visible={modalVisible}
        item={pendingItem}
        selectedDate={selectedDate}
        onClose={handleModalClose}
        onConfirm={handleConfirm}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Header
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerApp: {
    fontSize: Typography.sizes.xs,
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
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconText: { fontSize: 26 },

  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
  },

  // Month navigation
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  monthNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  monthNavBtnText: {
    fontSize: 22,
    lineHeight: 26,
    color: Colors.primary,
    fontWeight: Typography.weights.semibold,
  },
  monthNavLabel: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },

  // Day-of-week row
  dowRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  dowCell: {
    width: DAY_CELL_SIZE,
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  dowText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.textTertiary,
    letterSpacing: 0.5,
  },

  // Calendar grid
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.sm,
  },
  dayCell: {
    width: DAY_CELL_SIZE,
    height: DAY_CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: DAY_CELL_SIZE / 2,
    marginVertical: 1,
  },
  dayCellEmpty: {},
  dayCellSelected: {
    backgroundColor: Colors.primary,
  },
  dayCellPast: {},
  dayCellText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
  },
  dayCellTextToday: {
    color: Colors.primary,
    fontWeight: Typography.weights.bold,
  },
  dayCellTextSelected: {
    color: Colors.textInverse,
    fontWeight: Typography.weights.bold,
  },
  dayCellTextPast: {
    color: Colors.textDisabled,
  },
  dayCellDot: {
    position: 'absolute',
    bottom: 4,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.accent,
  },
  dayCellDotSelected: {
    backgroundColor: 'rgba(255,255,255,0.8)',
  },

  // Legend
  legend: {
    flexDirection: 'row',
    gap: Spacing.lg,
    paddingHorizontal: Spacing.xs,
    marginBottom: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
  },
  legendToday: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textTertiary,
  },

  // Slots panel
  slotsPanel: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    ...Shadows.sm,
  },
  slotsPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 2,
  },
  slotsPanelTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  slotsPanelBadge: {
    backgroundColor: Colors.primarySurface,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  slotsPanelBadgeText: {
    fontSize: Typography.sizes.xs,
    color: Colors.primaryDark,
    fontWeight: Typography.weights.semibold,
  },
  slotsPanelSub: {
    fontSize: Typography.sizes.xs,
    color: Colors.textTertiary,
    marginBottom: Spacing.md,
  },
  timeChipsScroll: {
    gap: Spacing.sm,
    paddingRight: Spacing.sm,
  },

  // Time chips
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceSecondary,
  },
  timeChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  timeChipText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  timeChipTextSelected: {
    color: Colors.textInverse,
  },
  timeChipBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.accent + '33',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  timeChipBadgeSelected: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  timeChipBadgeText: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
  },
  timeChipBadgeTextSelected: {
    color: Colors.textInverse,
  },

  // No slots
  noSlotsCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.base,
    alignItems: 'center',
    ...Shadows.sm,
  },
  noSlotsEmoji: { fontSize: 40, marginBottom: Spacing.sm },
  noSlotsTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  noSlotsSub: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Doctors panel
  doctorsPanel: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.base,
    ...Shadows.sm,
  },
  doctorsPanelHeader: {
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
  },
  doctorsPanelTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  doctorsPanelSub: {
    fontSize: Typography.sizes.xs,
    color: Colors.textTertiary,
    fontWeight: Typography.weights.medium,
  },
  noDoctorsRow: {
    padding: Spacing.base,
  },
  noDoctorsText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Doctor row
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  doctorRowAccent: {
    width: 3,
    height: 46,
    borderRadius: 2,
  },
  doctorRowInfo: { flex: 1, gap: 3 },
  doctorRowName: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  doctorRowMeta: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
  },
  doctorRowArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorRowArrowText: {
    fontSize: 20,
    lineHeight: 24,
    color: Colors.primary,
    fontWeight: Typography.weights.semibold,
  },

  // Confirmation modal
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.55)',
  },
  modalSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.xl,
    paddingTop: Spacing.md,
    ...Shadows.lg,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  modalDoctorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.primarySurface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.base,
  },
  modalDoctorInfo: { flex: 1, gap: 2 },
  modalDoctorName: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  modalDoctorTz: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  modalDetails: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  modalDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    gap: Spacing.md,
  },
  modalDetailDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginHorizontal: Spacing.sm,
  },
  modalDetailIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  modalDetailContent: { flex: 1 },
  modalDetailLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textTertiary,
    fontWeight: Typography.weights.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  modalDetailValue: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginTop: 1,
  },
  modalNotice: {
    backgroundColor: Colors.primarySurface,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.base,
  },
  modalNoticeText: {
    fontSize: Typography.sizes.xs,
    color: Colors.primaryDark,
    lineHeight: 18,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  modalCancelBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.base,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
  },
  modalConfirmBtn: {
    flex: 2,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.base,
    alignItems: 'center',
    ...Shadows.md,
  },
  modalConfirmText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.textInverse,
  },
});
