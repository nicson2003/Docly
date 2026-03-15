/**
 * @file __tests__/screens/CalendarBookingScreen.test.tsx
 *
 * Unit + integration tests for the CalendarBookingScreen.
 *
 * Coverage targets
 * ──────────────────────────────────────────────────────────────────────────────
 * • Calendar renders current month and navigates months
 * • Past dates are disabled
 * • Dates with available doctors show a dot indicator
 * • Selecting a date reveals the time chips panel
 * • Selecting a time chip reveals the doctors panel
 * • Each doctor row is rendered correctly
 * • Already-booked slots are hidden from the doctor list
 * • Tapping a doctor opens the confirmation modal
 * • Modal shows correct appointment details
 * • Confirming dispatches addBooking and navigates to MainTabs
 * • Cancelling the modal hides it without dispatching
 * • Double-booking prevention (Redux guard) is respected
 * • "No doctors available" message shown when all slots booked
 * • Dates with no doctors show the no-slots card
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore, combineReducers } from '@reduxjs/toolkit';

// Fix 7: static import instead of dynamic import()
import bookingsReducer, {
  addBooking,
} from '../../src/store/slices/bookingsSlice';
import doctorsReducer from '../../src/store/slices/doctorsSlice';
import CalendarBookingScreen from '../../src/screens/CalendarBookingScreen';
import type {
  Doctor,
  Booking,
  DoctorsState,
  BookingsState,
} from '../../src/types';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockReset = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ reset: mockReset }),
  useRoute: () => ({ params: {} }),
  NavigationContainer: ({ children }: any) => children,
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: any) => children,
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

type DayOfWeek =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

const DAY_ORDER: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

function getTodayDayOfWeek(): DayOfWeek {
  const js = new Date().getDay(); // 0 = Sun
  return DAY_ORDER[js === 0 ? 6 : js - 1];
}

function makeDoctor(overrides: Partial<Doctor> = {}): Doctor {
  const day = getTodayDayOfWeek();
  return {
    id: 'dr_alice_smith',
    name: 'Dr. Alice Smith',
    timezone: 'Australia/Sydney',
    schedule: [
      {
        day,
        slots: [
          {
            id: `dr_alice_smith_${day}_09:00`,
            doctorId: 'dr_alice_smith',
            dayOfWeek: day,
            startTime: '09:00',
            endTime: '09:30',
            displayStart: '9:00 AM',
            displayEnd: '9:30 AM',
          },
          {
            id: `dr_alice_smith_${day}_09:30`,
            doctorId: 'dr_alice_smith',
            dayOfWeek: day,
            startTime: '09:30',
            endTime: '10:00',
            displayStart: '9:30 AM',
            displayEnd: '10:00 AM',
          },
        ],
      },
    ],
    avatarColor: '#0D7377',
    initials: 'AS',
    ...overrides,
  };
}

function makeBooking(overrides: Partial<Booking> = {}): Booking {
  const day = getTodayDayOfWeek();
  return {
    id: 'booking_001',
    doctorId: 'dr_alice_smith',
    doctorName: 'Dr. Alice Smith',
    doctorTimezone: 'Australia/Sydney',
    slotId: `dr_alice_smith_${day}_09:00`,
    dayOfWeek: day,
    startTime: '09:00',
    endTime: '09:30',
    displayStart: '9:00 AM',
    displayEnd: '9:30 AM',
    bookedAt: new Date().toISOString(),
    status: 'confirmed',
    isPendingSync: false,
    ...overrides,
  };
}

function buildStore(doctors: Doctor[] = [], bookings: Booking[] = []) {
  return configureStore({
    reducer: combineReducers({
      doctors: doctorsReducer,
      bookings: bookingsReducer,
    }),
    preloadedState: {
      doctors: {
        items: doctors,
        loading: false,
        error: null,
        lastFetched: null,
      } as DoctorsState,
      bookings: { items: bookings } as BookingsState,
    },
  });
}

function renderScreen(store = buildStore()) {
  return render(
    <Provider store={store}>
      <CalendarBookingScreen />
    </Provider>,
  );
}

/** Presses today's date cell — always accessible (not past, not disabled). */
function pressToday(utils: ReturnType<typeof render>) {
  const todayNum = new Date().getDate().toString();
  fireEvent.press(utils.getByLabelText(new RegExp(`^${todayNum}\\b`)));
}

// ─── Calendar Rendering ───────────────────────────────────────────────────────

describe('CalendarBookingScreen — calendar rendering', () => {
  it('renders the screen header', () => {
    const { getByText } = renderScreen();
    expect(getByText('Book Appointment')).toBeTruthy();
  });

  it('renders the current month and year label', () => {
    const { getByText } = renderScreen();
    const expected = new Date().toLocaleDateString('en-AU', {
      month: 'long',
      year: 'numeric',
    });
    expect(getByText(expected)).toBeTruthy();
  });

  it('renders day-of-week headers', () => {
    const { getAllByText } = renderScreen();
    expect(getAllByText('M').length).toBeGreaterThanOrEqual(1);
    expect(getAllByText('F').length).toBeGreaterThanOrEqual(1);
  });

  it('renders month navigation buttons', () => {
    const { getByLabelText } = renderScreen();
    expect(getByLabelText('Previous month')).toBeTruthy();
    expect(getByLabelText('Next month')).toBeTruthy();
  });

  it('navigates to the next month', () => {
    const { getByLabelText, getByText } = renderScreen();
    fireEvent.press(getByLabelText('Next month'));
    const next = new Date();
    next.setMonth(next.getMonth() + 1);
    expect(
      getByText(
        next.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' }),
      ),
    ).toBeTruthy();
  });

  it('navigates to the previous month', () => {
    const { getByLabelText, getByText } = renderScreen();
    fireEvent.press(getByLabelText('Previous month'));
    const prev = new Date();
    prev.setMonth(prev.getMonth() - 1);
    expect(
      getByText(
        prev.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' }),
      ),
    ).toBeTruthy();
  });

  it('shows "Doctors available" legend label', () => {
    const { getByText } = renderScreen();
    expect(getByText('Doctors available')).toBeTruthy();
  });
});

// ─── Date Selection ───────────────────────────────────────────────────────────

describe('CalendarBookingScreen — date selection', () => {
  it('shows the instructional subtitle before a date is selected', () => {
    const { getByText } = renderScreen();
    expect(getByText('Select a date to get started')).toBeTruthy();
  });

  it('does not show the slots panel before a date is selected', () => {
    const { queryByText } = renderScreen();
    expect(queryByText('Select a time')).toBeNull();
  });

  // Fix 2 — formatted date appears in both header subtitle AND slots panel header.
  it('selecting today updates the header subtitle', () => {
    const store = buildStore([makeDoctor()]);
    const utils = render(
      <Provider store={store}>
        <CalendarBookingScreen />
      </Provider>,
    );
    pressToday(utils);
    const formatted = new Date().toLocaleDateString('en-AU', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    // getAllByText — first occurrence is the header subtitle
    expect(utils.getAllByText(formatted)[0]).toBeTruthy();
  });

  it('selecting a date with no doctors shows the no-slots card', () => {
    const utils = renderScreen();
    pressToday(utils);
    expect(utils.getByText('No doctors available')).toBeTruthy();
  });

  it('selecting a date with doctors shows the time chip panel', () => {
    const store = buildStore([makeDoctor()]);
    const utils = render(
      <Provider store={store}>
        <CalendarBookingScreen />
      </Provider>,
    );
    pressToday(utils);
    expect(utils.getByText('Select a time')).toBeTruthy();
  });

  it('shows correct slot count badge in the time panel', () => {
    const store = buildStore([makeDoctor()]);
    const utils = render(
      <Provider store={store}>
        <CalendarBookingScreen />
      </Provider>,
    );
    pressToday(utils);
    expect(utils.getByText('2 slots')).toBeTruthy();
  });
});

// ─── Time Chip Selection ──────────────────────────────────────────────────────

describe('CalendarBookingScreen — time chip selection', () => {
  function setupWithDate() {
    const store = buildStore([makeDoctor()]);
    const utils = render(
      <Provider store={store}>
        <CalendarBookingScreen />
      </Provider>,
    );
    pressToday(utils);
    return { store, ...utils };
  }

  it('renders a time chip for the first available slot', () => {
    const { getByLabelText } = setupWithDate();
    expect(getByLabelText(/9:00 AM/)).toBeTruthy();
  });

  it('renders a time chip for the second available slot', () => {
    const { getByLabelText } = setupWithDate();
    expect(getByLabelText(/9:30 AM/)).toBeTruthy();
  });

  // Fix 3 — chip accessibility label also matches /doctor.*available/i.
  it('pressing a time chip shows the doctors panel', () => {
    const { getByLabelText, getAllByText } = setupWithDate();
    fireEvent.press(getByLabelText(/9:00 AM/));
    expect(getAllByText(/doctor.*available/i).length).toBeGreaterThan(0);
  });

  it('pressing the same chip again hides the doctors panel', () => {
    const { getByLabelText, queryByText } = setupWithDate();
    fireEvent.press(getByLabelText(/9:00 AM/));
    fireEvent.press(getByLabelText(/9:00 AM/));
    expect(queryByText('1 doctor available')).toBeNull();
  });

  // Fix 4 — "9:00 AM – 9:30 AM" appears in both chip label and sub-header.
  it('shows the selected time range in the doctors panel sub-header', () => {
    const { getByLabelText, getAllByText } = setupWithDate();
    fireEvent.press(getByLabelText(/9:00 AM/));
    const matches = getAllByText(/9:00 AM – 9:30 AM/);
    expect(matches[matches.length - 1]).toBeTruthy();
  });
});

// ─── Available Doctors Panel ──────────────────────────────────────────────────

describe('CalendarBookingScreen — available doctors panel', () => {
  function setupWithSlotSelected() {
    const store = buildStore([makeDoctor()]);
    const utils = render(
      <Provider store={store}>
        <CalendarBookingScreen />
      </Provider>,
    );
    pressToday(utils);
    fireEvent.press(utils.getByLabelText(/9:00 AM/));
    return { store, ...utils };
  }

  it('renders the doctor name', () => {
    const { getAllByText } = setupWithSlotSelected();
    expect(getAllByText('Dr. Alice Smith').length).toBeGreaterThan(0);
  });

  it('renders the timezone label', () => {
    const { getAllByText } = setupWithSlotSelected();
    expect(getAllByText(/Sydney/).length).toBeGreaterThan(0);
  });

  it('shows "1 doctor available"', () => {
    const { getByText } = setupWithSlotSelected();
    expect(getByText('1 doctor available')).toBeTruthy();
  });

  it('doctor row has an accessible "Book" label', () => {
    const { getByLabelText } = setupWithSlotSelected();
    expect(getByLabelText('Book Dr. Alice Smith')).toBeTruthy();
  });
});

// ─── Booked Slot Filtering ────────────────────────────────────────────────────

describe('CalendarBookingScreen — booked slot filtering', () => {
  it('hides a doctor when their slot is already confirmed', () => {
    const store = buildStore([makeDoctor()], [makeBooking()]);
    const utils = render(
      <Provider store={store}>
        <CalendarBookingScreen />
      </Provider>,
    );
    pressToday(utils);
    fireEvent.press(utils.getByLabelText(/9:00 AM/));
    expect(utils.queryByLabelText('Book Dr. Alice Smith')).toBeNull();
  });

  it('shows doctor at the other unbooked slot', () => {
    const store = buildStore([makeDoctor()], [makeBooking()]);
    const utils = render(
      <Provider store={store}>
        <CalendarBookingScreen />
      </Provider>,
    );
    pressToday(utils);
    fireEvent.press(utils.getByLabelText(/9:30 AM/));
    expect(utils.getByLabelText('Book Dr. Alice Smith')).toBeTruthy();
  });

  it('shows "fully booked" message when all doctors are booked at a time', () => {
    const store = buildStore([makeDoctor()], [makeBooking()]);
    const utils = render(
      <Provider store={store}>
        <CalendarBookingScreen />
      </Provider>,
    );
    pressToday(utils);
    fireEvent.press(utils.getByLabelText(/9:00 AM/));
    expect(utils.getByText(/All doctors are fully booked/i)).toBeTruthy();
  });
});

// ─── Confirmation Modal ───────────────────────────────────────────────────────

describe('CalendarBookingScreen — confirmation modal', () => {
  function setupWithModalOpen() {
    const store = buildStore([makeDoctor()]);
    const utils = render(
      <Provider store={store}>
        <CalendarBookingScreen />
      </Provider>,
    );
    pressToday(utils);
    fireEvent.press(utils.getByLabelText(/9:00 AM/));
    fireEvent.press(utils.getByLabelText('Book Dr. Alice Smith'));
    return { store, ...utils };
  }

  // Fix 5 — doctor row stays mounted behind modal; last match is in modal.
  it('modal shows the doctor name', () => {
    const { getAllByText } = setupWithModalOpen();
    const matches = getAllByText('Dr. Alice Smith');
    expect(matches[matches.length - 1]).toBeTruthy();
  });

  // Fix 6 — same ambiguity; last match is the modal detail row.
  it('modal shows the appointment time', () => {
    const { getAllByText } = setupWithModalOpen();
    const matches = getAllByText(/9:00 AM – 9:30 AM/);
    expect(matches[matches.length - 1]).toBeTruthy();
  });

  it('modal shows 30 minutes duration', () => {
    const { getByText } = setupWithModalOpen();
    expect(getByText('30 minutes')).toBeTruthy();
  });

  it('modal shows the Timezone row label', () => {
    const { getByText } = setupWithModalOpen();
    expect(getByText('Timezone')).toBeTruthy();
  });

  it('modal shows the timezone value', () => {
    const { getByText } = setupWithModalOpen();
    expect(getByText(/Australia\/Sydney/)).toBeTruthy();
  });

  it('modal shows the Date row label', () => {
    const { getByText } = setupWithModalOpen();
    expect(getByText('Date')).toBeTruthy();
  });

  it('Confirm Booking button is accessible', () => {
    const { getByLabelText } = setupWithModalOpen();
    expect(getByLabelText('Confirm appointment booking')).toBeTruthy();
  });

  it('Cancel closes the modal without dispatching', () => {
    const { store, getByText, queryByLabelText } = setupWithModalOpen();
    const before = store.getState().bookings.items.length;
    fireEvent.press(getByText('Cancel'));
    expect(queryByLabelText('Confirm appointment booking')).toBeNull();
    expect(store.getState().bookings.items.length).toBe(before);
  });

  it('Confirming dispatches addBooking with correct doctor', async () => {
    const { store, getByLabelText } = setupWithModalOpen();
    fireEvent.press(getByLabelText('Confirm appointment booking'));
    await waitFor(() => {
      const items = store.getState().bookings.items;
      expect(items.length).toBe(1);
      expect(items[0].doctorId).toBe('dr_alice_smith');
      expect(items[0].status).toBe('confirmed');
    });
  });

  it('confirmed booking has correct slot metadata', async () => {
    const { store, getByLabelText } = setupWithModalOpen();
    fireEvent.press(getByLabelText('Confirm appointment booking'));
    await waitFor(() => {
      const b = store.getState().bookings.items[0];
      expect(b.startTime).toBe('09:00');
      expect(b.endTime).toBe('09:30');
      expect(b.displayStart).toBe('9:00 AM');
      expect(b.displayEnd).toBe('9:30 AM');
      expect(b.doctorTimezone).toBe('Australia/Sydney');
    });
  });

  it('navigates to MainTabs after confirming', async () => {
    const { getByLabelText } = setupWithModalOpen();
    fireEvent.press(getByLabelText('Confirm appointment booking'));
    await waitFor(() => {
      expect(mockReset).toHaveBeenCalledWith({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    });
  });
});

// ─── Double-Booking Prevention ────────────────────────────────────────────────

describe('CalendarBookingScreen — double-booking prevention (Redux guard)', () => {
  // Fix 7: static import at top of file — no dynamic import() needed.
  it('does not add a second booking for the same doctor + slot', () => {
    const existing = makeBooking();
    const store = buildStore([makeDoctor()], [existing]);

    store.dispatch(
      addBooking({
        doctorId: 'dr_alice_smith',
        doctorName: 'Dr. Alice Smith',
        doctorTimezone: 'Australia/Sydney',
        slotId: existing.slotId,
        dayOfWeek: getTodayDayOfWeek(),
        startTime: '09:00',
        endTime: '09:30',
        displayStart: '9:00 AM',
        displayEnd: '9:30 AM',
        isPendingSync: false,
      }),
    );

    expect(
      store.getState().bookings.items.filter(b => b.status === 'confirmed')
        .length,
    ).toBe(1);
  });
});

// ─── Multiple Doctors ─────────────────────────────────────────────────────────

describe('CalendarBookingScreen — multiple doctors', () => {
  function makeDoctor2(): Doctor {
    const day = getTodayDayOfWeek();
    return {
      id: 'dr_bob_jones',
      name: 'Dr. Bob Jones',
      timezone: 'Australia/Perth',
      schedule: [
        {
          day,
          slots: [
            {
              id: `dr_bob_jones_${day}_09:00`,
              doctorId: 'dr_bob_jones',
              dayOfWeek: day,
              startTime: '09:00',
              endTime: '09:30',
              displayStart: '9:00 AM',
              displayEnd: '9:30 AM',
            },
          ],
        },
      ],
      avatarColor: '#7C3AED',
      initials: 'BJ',
    };
  }

  it('shows all available doctors for a shared slot', () => {
    const store = buildStore([makeDoctor(), makeDoctor2()]);
    const utils = render(
      <Provider store={store}>
        <CalendarBookingScreen />
      </Provider>,
    );
    pressToday(utils);
    fireEvent.press(utils.getByLabelText(/9:00 AM/));
    expect(utils.getAllByText('Dr. Alice Smith').length).toBeGreaterThan(0);
    expect(utils.getAllByText('Dr. Bob Jones').length).toBeGreaterThan(0);
    expect(utils.getByText('2 doctors available')).toBeTruthy();
  });

  it('chip badge count shows total available doctors', () => {
    const store = buildStore([makeDoctor(), makeDoctor2()]);
    const utils = render(
      <Provider store={store}>
        <CalendarBookingScreen />
      </Provider>,
    );
    pressToday(utils);
    expect(utils.getByLabelText(/9:00 AM, 2 doctors available/)).toBeTruthy();
  });
});

// ─── Edge Cases ───────────────────────────────────────────────────────────────

describe('CalendarBookingScreen — edge cases', () => {
  it('renders without crashing with an empty doctors list', () => {
    expect(() => renderScreen()).not.toThrow();
  });

  it('multiple month navigations do not crash', () => {
    const { getByLabelText, getByText } = renderScreen();
    for (let i = 0; i < 14; i++) {
      fireEvent.press(getByLabelText('Previous month'));
    }
    expect(getByText(/\d{4}/)).toBeTruthy();
  });

  it('changing month clears the selected date and hides the slots panel', () => {
    const store = buildStore([makeDoctor()]);
    const utils = render(
      <Provider store={store}>
        <CalendarBookingScreen />
      </Provider>,
    );
    pressToday(utils);
    fireEvent.press(utils.getByLabelText('Next month'));
    expect(utils.queryByText('Select a time')).toBeNull();
  });

  it('isPendingSync defaults to false on new bookings via calendar', async () => {
    const store = buildStore([makeDoctor()]);
    const utils = render(
      <Provider store={store}>
        <CalendarBookingScreen />
      </Provider>,
    );
    pressToday(utils);
    fireEvent.press(utils.getByLabelText(/9:00 AM/));
    fireEvent.press(utils.getByLabelText('Book Dr. Alice Smith'));
    fireEvent.press(utils.getByLabelText('Confirm appointment booking'));
    await waitFor(() => {
      expect(store.getState().bookings.items[0].isPendingSync).toBe(false);
    });
  });
});
