import { configureStore, combineReducers } from '@reduxjs/toolkit';
import bookingsReducer, {
  addBooking,
  cancelBooking,
  markSynced,
  replaceBookings,
} from '../../src/store/slices/bookingsSlice';
import doctorsReducer, {
  clearError,
  fetchDoctors,
} from '../../src/store/slices/doctorsSlice';
import type { BookingsState, DoctorsState, Booking, Doctor } from '../../src/types';
import { doctorService } from '../../src/services/api';

// ── Helpers ──────────────────────────────────────────────────────────────────

const makePayload = (
  o: Partial<Omit<Booking, 'id' | 'bookedAt' | 'status'>> = {},
): Omit<Booking, 'id' | 'bookedAt' | 'status'> => ({
  doctorId: 'dr_alice',
  doctorName: 'Dr. Alice',
  doctorTimezone: 'Australia/Sydney',
  slotId: 'dr_alice_Monday_09:00',
  dayOfWeek: 'Monday',
  startTime: '09:00',
  endTime: '09:30',
  displayStart: '9:00 AM',
  displayEnd: '9:30 AM',
  isPendingSync: false,
  ...o,
});

const makeDoctor = (o: Partial<Doctor> = {}): Doctor => ({
  id: 'dr_alice',
  name: 'Dr. Alice',
  timezone: 'Australia/Sydney',
  schedule: [],
  avatarColor: '#0D7377',
  initials: 'AS',
  ...o,
});

const emptyBookings: BookingsState = { items: [] };
const emptyDoctors: DoctorsState = { items: [], loading: false, error: null, lastFetched: null };

// ── addBooking ────────────────────────────────────────────────────────────────

describe('addBooking', () => {
  it('adds booking to empty state', () =>
    expect(bookingsReducer(emptyBookings, addBooking(makePayload())).items.length).toBe(1));

  it('status is confirmed', () =>
    expect(bookingsReducer(emptyBookings, addBooking(makePayload())).items[0].status).toBe('confirmed'));

  it('assigns a unique id', () =>
    expect(bookingsReducer(emptyBookings, addBooking(makePayload())).items[0].id).toBeTruthy());

  it('assigns ISO bookedAt timestamp', () => {
    const t = bookingsReducer(emptyBookings, addBooking(makePayload())).items[0].bookedAt;
    expect(new Date(t).getTime()).not.toBeNaN();
  });

  it('preserves all payload fields', () => {
    const b = bookingsReducer(emptyBookings, addBooking(makePayload())).items[0];
    expect(b.doctorId).toBe('dr_alice');
    expect(b.slotId).toBe('dr_alice_Monday_09:00');
    expect(b.displayStart).toBe('9:00 AM');
  });

  it('prevents double-booking same doctor and slot', () => {
    let s = bookingsReducer(emptyBookings, addBooking(makePayload()));
    s = bookingsReducer(s, addBooking(makePayload()));
    expect(s.items.length).toBe(1);
  });

  it('allows rebooking after cancellation', () => {
    let s = bookingsReducer(emptyBookings, addBooking(makePayload()));
    s = bookingsReducer(s, cancelBooking(s.items[0].id));
    s = bookingsReducer(s, addBooking(makePayload()));
    expect(s.items.filter(b => b.status === 'confirmed').length).toBe(1);
  });

  it('allows different slots for same doctor', () => {
    let s = bookingsReducer(emptyBookings, addBooking(makePayload({ slotId: 'slot_a' })));
    s = bookingsReducer(s, addBooking(makePayload({ slotId: 'slot_b' })));
    expect(s.items.length).toBe(2);
  });

  it('allows same slot for different doctors', () => {
    let s = bookingsReducer(emptyBookings, addBooking(makePayload({ doctorId: 'dr_a', slotId: 'slot_1' })));
    s = bookingsReducer(s, addBooking(makePayload({ doctorId: 'dr_b', slotId: 'slot_1' })));
    expect(s.items.length).toBe(2);
  });

  it('preserves isPendingSync true for offline bookings', () =>
    expect(
      bookingsReducer(emptyBookings, addBooking(makePayload({ isPendingSync: true }))).items[0].isPendingSync,
    ).toBe(true));
});

// ── cancelBooking ─────────────────────────────────────────────────────────────

describe('cancelBooking', () => {
  it('sets status to cancelled', () => {
    let s = bookingsReducer(emptyBookings, addBooking(makePayload()));
    s = bookingsReducer(s, cancelBooking(s.items[0].id));
    expect(s.items[0].status).toBe('cancelled');
  });

  it('sets isPendingSync to false on cancel', () => {
    let s = bookingsReducer(emptyBookings, addBooking(makePayload({ isPendingSync: true })));
    s = bookingsReducer(s, cancelBooking(s.items[0].id));
    expect(s.items[0].isPendingSync).toBe(false);
  });

  it('unknown id does nothing', () => {
    let s = bookingsReducer(emptyBookings, addBooking(makePayload()));
    s = bookingsReducer(s, cancelBooking('no_such_id'));
    expect(s.items[0].status).toBe('confirmed');
  });

  it('does not remove the booking record', () => {
    let s = bookingsReducer(emptyBookings, addBooking(makePayload()));
    s = bookingsReducer(s, cancelBooking(s.items[0].id));
    expect(s.items.length).toBe(1);
  });

  it('only cancels the targeted booking', () => {
    let s = bookingsReducer(emptyBookings, addBooking(makePayload({ slotId: 'slot_a' })));
    s = bookingsReducer(s, addBooking(makePayload({ slotId: 'slot_b' })));
    s = bookingsReducer(s, cancelBooking(s.items[0].id));
    expect(s.items[0].status).toBe('cancelled');
    expect(s.items[1].status).toBe('confirmed');
  });
});

// ── markSynced ────────────────────────────────────────────────────────────────

describe('markSynced', () => {
  it('sets isPendingSync to false', () => {
    let s = bookingsReducer(emptyBookings, addBooking(makePayload({ isPendingSync: true })));
    s = bookingsReducer(s, markSynced(s.items[0].id));
    expect(s.items[0].isPendingSync).toBe(false);
  });

  it('unknown id does nothing', () => {
    let s = bookingsReducer(emptyBookings, addBooking(makePayload({ isPendingSync: true })));
    s = bookingsReducer(s, markSynced('unknown_id'));
    expect(s.items[0].isPendingSync).toBe(true);
  });
});

// ── replaceBookings ───────────────────────────────────────────────────────────

describe('replaceBookings', () => {
  it('replaces all items in state', () => {
    let s = bookingsReducer(emptyBookings, addBooking(makePayload()));
    const restored: Booking[] = [{
      ...makePayload(),
      id: 'restored_1',
      bookedAt: new Date().toISOString(),
      status: 'confirmed',
    }];
    s = bookingsReducer(s, replaceBookings(restored));
    expect(s.items.length).toBe(1);
    expect(s.items[0].id).toBe('restored_1');
  });

  it('can replace with empty array', () => {
    let s = bookingsReducer(emptyBookings, addBooking(makePayload()));
    s = bookingsReducer(s, replaceBookings([]));
    expect(s.items.length).toBe(0);
  });
});

// ── initial state ─────────────────────────────────────────────────────────────

describe('bookingsReducer initial state', () => {
  it('returns empty items for unknown action', () =>
    expect(bookingsReducer(undefined, { type: '@@UNKNOWN' }).items).toEqual([]));
});

// ── doctorsSlice — clearError ─────────────────────────────────────────────────

describe('clearError', () => {
  it('sets error to null', () =>
    expect(doctorsReducer({ ...emptyDoctors, error: 'oops' }, clearError()).error).toBeNull());

  it('does not affect items', () =>
    expect(
      doctorsReducer({ ...emptyDoctors, items: [makeDoctor()], error: 'err' }, clearError()).items.length,
    ).toBe(1));
});

// ── doctorsSlice — async thunk state transitions ──────────────────────────────

describe('doctorsSlice async transitions', () => {
  it('pending sets loading true and clears error', () => {
    const s = doctorsReducer({ ...emptyDoctors, error: 'old' }, { type: fetchDoctors.pending.type });
    expect(s.loading).toBe(true);
    expect(s.error).toBeNull();
  });

  it('fulfilled sets loading false and populates items', () => {
    const s = doctorsReducer(emptyDoctors, {
      type: fetchDoctors.fulfilled.type,
      payload: [makeDoctor()],
    });
    expect(s.loading).toBe(false);
    expect(s.items.length).toBe(1);
  });

  it('fulfilled clears error', () => {
    const s = doctorsReducer(
      { ...emptyDoctors, error: 'previous error' },
      { type: fetchDoctors.fulfilled.type, payload: [] },
    );
    expect(s.error).toBeNull();
  });

  it('fulfilled sets lastFetched as ISO string', () => {
    const s = doctorsReducer(emptyDoctors, { type: fetchDoctors.fulfilled.type, payload: [] });
    expect(new Date(s.lastFetched!).getTime()).not.toBeNaN();
  });

  it('rejected sets loading false and error message', () => {
    const s = doctorsReducer(emptyDoctors, {
      type: fetchDoctors.rejected.type,
      payload: 'Network error',
    });
    expect(s.loading).toBe(false);
    expect(s.error).toBe('Network error');
  });

  it('rejected uses fallback message when payload is undefined', () =>
    expect(
      doctorsReducer(emptyDoctors, { type: fetchDoctors.rejected.type, payload: undefined }).error,
    ).toBeTruthy());

  it('returns initial state for unknown action', () =>
    expect(doctorsReducer(undefined, { type: '@@UNKNOWN' })).toEqual(emptyDoctors));
});

// Mock the api service so tests don't hit the network
jest.mock('../../src/services/api', () => ({
  doctorService: {
    fetchAvailability: jest.fn(),
  },
}));
 
// Also mock processDoctors to return predictable output
jest.mock('../../src/utils', () => {
  const actual = jest.requireActual('../../src/utils');
  return {
    ...actual,
    processDoctors: jest.fn((raw: any[]) =>
      raw.map((r: any, i: number) => ({
        id: `doctor_${i}`,
        name: r.name ?? `Doctor ${i}`,
        timezone: r.timezone ?? 'UTC',
        schedule: [],
        avatarColor: '#000',
        initials: 'XX',
      })),
    ),
  };
});
 
function makeFetchStore() {
  return configureStore({
    reducer: combineReducers({
      doctors: doctorsReducer,
      bookings: bookingsReducer,
    }),
  });
}
 
const RAW_DOCTOR = {
  name: 'Dr. Fetch Test',
  timezone: 'Australia/Sydney',
  day_of_week: 'Monday',
  available_at: '9:00AM',
  available_until: '5:00PM',
};
 
// ─── fetchDoctors thunk ───────────────────────────────────────────────────────
 
describe('fetchDoctors thunk — body coverage (lines 14-36)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
 
  it('fetches and stores doctors on success', async () => {
    (doctorService.fetchAvailability as jest.Mock).mockResolvedValueOnce([RAW_DOCTOR]);
    const store = makeFetchStore();
    await store.dispatch(fetchDoctors());
    expect(store.getState().doctors.items.length).toBe(1);
    expect(store.getState().doctors.loading).toBe(false);
    expect(store.getState().doctors.error).toBeNull();
  });
 
  it('sets lastFetched after a successful fetch', async () => {
    (doctorService.fetchAvailability as jest.Mock).mockResolvedValueOnce([RAW_DOCTOR]);
    const store = makeFetchStore();
    await store.dispatch(fetchDoctors());
    expect(store.getState().doctors.lastFetched).not.toBeNull();
    expect(new Date(store.getState().doctors.lastFetched!).getTime()).not.toBeNaN();
  });
 
  it('rejects with message when API returns empty array', async () => {
    (doctorService.fetchAvailability as jest.Mock).mockResolvedValueOnce([]);
    const store = makeFetchStore();
    await store.dispatch(fetchDoctors());
    expect(store.getState().doctors.error).toBeTruthy();
    expect(store.getState().doctors.items.length).toBe(0);
  });
 
  it('rejects with error message on fetch failure', async () => {
    (doctorService.fetchAvailability as jest.Mock).mockRejectedValueOnce(
      new Error('Network timeout'),
    );
    const store = makeFetchStore();
    await store.dispatch(fetchDoctors());
    expect(store.getState().doctors.error).toBe('Network timeout');
    expect(store.getState().doctors.loading).toBe(false);
  });
 
  it('uses fallback error message when error has no message', async () => {
    (doctorService.fetchAvailability as jest.Mock).mockRejectedValueOnce('raw string error');
    const store = makeFetchStore();
    await store.dispatch(fetchDoctors());
    expect(store.getState().doctors.error).toBeTruthy();
  });
 
  it('skips fetch when data is fresh (within 5 minutes)', async () => {
    (doctorService.fetchAvailability as jest.Mock).mockResolvedValueOnce([RAW_DOCTOR]);
    const store = makeFetchStore();
    // First fetch — populates items and lastFetched
    await store.dispatch(fetchDoctors());
    expect((doctorService.fetchAvailability as jest.Mock).mock.calls.length).toBe(1);
    // Second fetch immediately after — should use cached data
    await store.dispatch(fetchDoctors());
    expect((doctorService.fetchAvailability as jest.Mock).mock.calls.length).toBe(1);
  });
 
  it('force refresh bypasses the cache', async () => {
    (doctorService.fetchAvailability as jest.Mock).mockResolvedValue([RAW_DOCTOR]);
    const store = makeFetchStore();
    await store.dispatch(fetchDoctors());
    await store.dispatch(fetchDoctors({ forceRefresh: true }));
    expect((doctorService.fetchAvailability as jest.Mock).mock.calls.length).toBe(2);
  });
 
  it('fetches when items are empty even if lastFetched is set', async () => {
    (doctorService.fetchAvailability as jest.Mock).mockResolvedValue([RAW_DOCTOR]);
    const store = makeFetchStore();
    // Manually inject a lastFetched but leave items empty
    store.dispatch({ type: 'doctors/fetchDoctors/fulfilled', payload: [] });
    // items.length is 0 — cache should not be used
    (doctorService.fetchAvailability as jest.Mock).mockClear();
    (doctorService.fetchAvailability as jest.Mock).mockResolvedValueOnce([RAW_DOCTOR]);
    await store.dispatch(fetchDoctors());
    expect((doctorService.fetchAvailability as jest.Mock).mock.calls.length).toBe(1);
  });
 
  it('loading is true during pending, false after fulfilled', async () => {
    let resolvePromise!: (v: any) => void;
    const pending = new Promise(res => { resolvePromise = res; });
    (doctorService.fetchAvailability as jest.Mock).mockReturnValueOnce(pending);
    const store = makeFetchStore();
    const thunkPromise = store.dispatch(fetchDoctors());
    expect(store.getState().doctors.loading).toBe(true);
    resolvePromise([RAW_DOCTOR]);
    await thunkPromise;
    expect(store.getState().doctors.loading).toBe(false);
  });
 
  it('loading is false after rejection', async () => {
    (doctorService.fetchAvailability as jest.Mock).mockRejectedValueOnce(new Error('fail'));
    const store = makeFetchStore();
    await store.dispatch(fetchDoctors());
    expect(store.getState().doctors.loading).toBe(false);
  });
});
 