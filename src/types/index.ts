// ─── API ──────────────────────────────────────────────────────────────────────

export interface DoctorAvailabilityRaw {
  name: string;
  timezone: string;
  day_of_week: string;
  available_at: string;
  available_until: string;
}

// ─── Domain ───────────────────────────────────────────────────────────────────

export interface TimeSlot {
  id: string;           // "{doctorId}_{day}_{HH:MM}"
  doctorId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;    // "09:00" (24h)
  endTime: string;      // "09:30" (24h)
  displayStart: string; // "9:00 AM"
  displayEnd: string;   // "9:30 AM"
}

export interface DaySchedule {
  day: DayOfWeek;
  slots: TimeSlot[];
}

export interface Doctor {
  id: string;
  name: string;
  timezone: string;
  schedule: DaySchedule[];
  avatarColor: string;
  initials: string;
}

export type DayOfWeek =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

// ─── Bookings ─────────────────────────────────────────────────────────────────

export type BookingStatus = 'confirmed' | 'cancelled';

export interface Booking {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorTimezone: string;
  slotId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;    // "09:00"
  endTime: string;      // "09:30"
  displayStart: string; // "9:00 AM"
  displayEnd: string;   // "9:30 AM"
  bookedAt: string;     // ISO string
  status: BookingStatus;
  isPendingSync: boolean; // true when booked offline
}

// ─── Redux State ──────────────────────────────────────────────────────────────

export interface DoctorsState {
  items: Doctor[];
  loading: boolean;
  error: string | null;
  lastFetched: string | null;
}

export interface BookingsState {
  items: Booking[];
}

export interface RootState {
  doctors: DoctorsState;
  bookings: BookingsState;
}

// ─── Navigation ───────────────────────────────────────────────────────────────

export type RootStackParamList = {
  MainTabs: undefined;
  DoctorDetail: { doctorId: string };
  BookingConfirmation: {
    doctorId: string;
    slotId: string;
    dayOfWeek: DayOfWeek;
  };
  BookingSuccess: {
    bookingId: string;
  };
};

export type BottomTabParamList = {
  DoctorsTab: undefined;
  CalendarTab: undefined;
  BookingsTab: undefined;
};
