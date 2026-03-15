import { DoctorAvailabilityRaw, Doctor, TimeSlot, DayOfWeek, DaySchedule } from '../types';
import { Colors } from '../theme';

// ─── Constants ────────────────────────────────────────────────────────────────

export const DAY_ORDER: DayOfWeek[] = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
];

// ─── Time Utilities ───────────────────────────────────────────────────────────

/**
 * Parses a time string like " 9:00AM", "10:30PM", " 6:00AM" into total minutes.
 * Handles leading/trailing whitespace.
 */
export function parseTimeToMinutes(timeStr: string): number {
  const trimmed = timeStr.trim().toUpperCase();
  // Matches: "9:00AM", "10:30PM", "12:00PM"
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(AM|PM)$/);
  if (!match) {
    throw new Error(`Invalid time format: "${timeStr}"`);
  }
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3];

  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error(`Out-of-range time: "${timeStr}"`);
  }

  return hours * 60 + minutes;
}

/**
 * Formats total minutes into "9:00 AM" display string.
 */
export function minutesToDisplay(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Formats total minutes into 24h "HH:MM" key string.
 */
export function minutesTo24h(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// ─── Slot Generation ──────────────────────────────────────────────────────────

/**
 * Generates all 30-minute slots within a [start, end) window.
 * A slot requires the full 30 minutes to fit.
 */
export function generateSlots(
  doctorId: string,
  day: DayOfWeek,
  availableAt: string,
  availableUntil: string
): TimeSlot[] {
  let startMin: number;
  let endMin: number;

  try {
    startMin = parseTimeToMinutes(availableAt);
    endMin = parseTimeToMinutes(availableUntil);
  } catch {
    return [];
  }

  if (startMin >= endMin) return [];

  const slots: TimeSlot[] = [];
  let cursor = startMin;

  while (cursor + 30 <= endMin) {
    const slotEnd = cursor + 30;
    const startKey = minutesTo24h(cursor);
    const id = `${doctorId}_${day}_${startKey}`;

    slots.push({
      id,
      doctorId,
      dayOfWeek: day,
      startTime: startKey,
      endTime: minutesTo24h(slotEnd),
      displayStart: minutesToDisplay(cursor),
      displayEnd: minutesToDisplay(slotEnd),
    });

    cursor += 30;
  }

  return slots;
}

// ─── Doctor Processing ────────────────────────────────────────────────────────

/**
 * Generates a deterministic avatar color from a name string.
 */
export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % Colors.avatarPalette.length;
  return Colors.avatarPalette[index];
}

/**
 * Returns up to 2 initials from a doctor name, ignoring "Dr." prefix.
 */
export function getInitials(name: string): string {
  const cleaned = name.replace(/^Dr\.\s+/i, '').trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Builds a stable doctor ID from a name string.
 */
export function buildDoctorId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Transforms raw API data into Doctor domain objects with pre-generated slots.
 * Groups entries by name, merges schedules, deduplicates overlapping windows.
 */
export function processDoctors(raw: DoctorAvailabilityRaw[]): Doctor[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];

  // Group by name
  const byName = new Map<string, DoctorAvailabilityRaw[]>();
  for (const entry of raw) {
    if (!entry?.name || !entry?.day_of_week || !entry?.available_at || !entry?.available_until) {
      continue;
    }
    const list = byName.get(entry.name) ?? [];
    list.push(entry);
    byName.set(entry.name, list);
  }

  const doctors: Doctor[] = [];

  for (const [name, entries] of byName.entries()) {
    const id = buildDoctorId(name);
    const timezone = entries[0].timezone ?? 'UTC';

    // Group entries by day
    const byDay = new Map<DayOfWeek, DoctorAvailabilityRaw[]>();
    for (const e of entries) {
      const day = e.day_of_week as DayOfWeek;
      const dayList = byDay.get(day) ?? [];
      dayList.push(e);
      byDay.set(day, dayList);
    }

    // Build schedule sorted by day order
    const schedule: DaySchedule[] = [];
    for (const day of DAY_ORDER) {
      const dayEntries = byDay.get(day);
      if (!dayEntries) continue;

      // Merge all slot windows for this day (supports multiple windows per day like Dr. Geovany)
      const allSlots: TimeSlot[] = [];
      for (const entry of dayEntries) {
        const slots = generateSlots(id, day, entry.available_at, entry.available_until);
        allSlots.push(...slots);
      }

      // Deduplicate slots by ID
      const seen = new Set<string>();
      const uniqueSlots = allSlots.filter((s) => {
        if (seen.has(s.id)) return false;
        seen.add(s.id);
        return true;
      });

      // Sort by start time
      uniqueSlots.sort((a, b) => a.startTime.localeCompare(b.startTime));

      if (uniqueSlots.length > 0) {
        schedule.push({ day, slots: uniqueSlots });
      }
    }

    doctors.push({
      id,
      name,
      timezone,
      schedule,
      avatarColor: getAvatarColor(name),
      initials: getInitials(name),
    });
  }

  // Sort doctors alphabetically
  return doctors.sort((a, b) => a.name.localeCompare(b.name));
}

// ─── Date Utilities ───────────────────────────────────────────────────────────

/**
 * Returns the next calendar date (from today) that matches a given day name.
 * Used for display purposes only — slots are day-of-week recurring.
 */
export function getNextDateForDay(dayOfWeek: DayOfWeek): Date {
  const dayIndex = DAY_ORDER.indexOf(dayOfWeek);
  const today = new Date();
  const todayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1; // Mon=0
  let diff = dayIndex - todayIndex;
  if (diff < 0) diff += 7;
  if (diff === 0) diff = 0; // Today is fine — show today
  const result = new Date(today);
  result.setDate(today.getDate() + diff);
  return result;
}

/**
 * Formats a Date to "Mon, Mar 15" style string.
 */
export function formatDateShort(date: Date): string {
  return date.toLocaleDateString('en-AU', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Formats an ISO string booking date for display.
 */
export function formatBookingDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-AU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return isoString;
  }
}

/**
 * Generates a unique ID for a booking.
 */
export function generateBookingId(): string {
  return `booking_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
