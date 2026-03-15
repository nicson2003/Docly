import { configureStore, combineReducers } from '@reduxjs/toolkit';
import bookingsReducer, {
  addBooking,
  cancelBooking,
  markSynced,
} from '../../src/store/slices/bookingsSlice';
import doctorsReducer, { clearError } from '../../src/store/slices/doctorsSlice';
import {
  selectDoctors,
  selectDoctorById,
  selectBookings,
  selectConfirmedBookings,
  selectBookedSlotIdsByDoctor,
} from '../../src/selectors/index';
import type { Booking, Doctor, DoctorsState } from '../../src/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeStore() {
  return configureStore({
    reducer: combineReducers({ doctors: doctorsReducer, bookings: bookingsReducer }),
  });
}

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
  name: 'Dr. Alice Smith',
  timezone: 'Australia/Sydney',
  schedule: [{
    day: 'Monday',
    slots: [{
      id: 'dr_alice_Monday_09:00',
      doctorId: 'dr_alice',
      dayOfWeek: 'Monday',
      startTime: '09:00',
      endTime: '09:30',
      displayStart: '9:00 AM',
      displayEnd: '9:30 AM',
    }],
  }],
  avatarColor: '#0D7377',
  initials: 'AS',
  ...o,
});

const makeBooking = (o: Partial<Booking> = {}): Booking => ({
  id: 'b1',
  doctorId: 'dr_alice',
  doctorName: 'Dr. Alice',
  doctorTimezone: 'UTC',
  slotId: 'slot_1',
  dayOfWeek: 'Monday',
  startTime: '09:00',
  endTime: '09:30',
  displayStart: '9:00 AM',
  displayEnd: '9:30 AM',
  bookedAt: new Date().toISOString(),
  status: 'confirmed',
  isPendingSync: false,
  ...o,
});

function buildState(doctors: Doctor[] = [], bookings: Booking[] = []) {
  return {
    doctors: { items: doctors, loading: false, error: null, lastFetched: null } as DoctorsState,
    bookings: { items: bookings },
  };
}

// ── Full Booking Workflow ──────────────────────────────────────────────────────

describe('Full Booking Workflow', () => {
  it('books an appointment end-to-end', () => {
    const store = makeStore();
    store.dispatch(addBooking(makePayload()));
    expect(store.getState().bookings.items.length).toBe(1);
    expect(store.getState().bookings.items[0].status).toBe('confirmed');
  });

  it('prevents double-booking same doctor and slot', () => {
    const store = makeStore();
    store.dispatch(addBooking(makePayload()));
    store.dispatch(addBooking(makePayload()));
    expect(store.getState().bookings.items.length).toBe(1);
  });

  it('cancels a booking', () => {
    const store = makeStore();
    store.dispatch(addBooking(makePayload()));
    const id = store.getState().bookings.items[0].id;
    store.dispatch(cancelBooking(id));
    expect(store.getState().bookings.items[0].status).toBe('cancelled');
  });

  it('allows rebooking after cancel', () => {
    const store = makeStore();
    store.dispatch(addBooking(makePayload()));
    const id = store.getState().bookings.items[0].id;
    store.dispatch(cancelBooking(id));
    store.dispatch(addBooking(makePayload()));
    const confirmed = store.getState().bookings.items.filter(b => b.status === 'confirmed');
    expect(confirmed.length).toBe(1);
  });

  it('books multiple different slots', () => {
    const store = makeStore();
    ['slot_a', 'slot_b', 'slot_c'].forEach(slotId =>
      store.dispatch(addBooking(makePayload({ slotId }))),
    );
    expect(store.getState().bookings.items.length).toBe(3);
  });

  it('markSynced clears offline flag', () => {
    const store = makeStore();
    store.dispatch(addBooking(makePayload({ isPendingSync: true })));
    const id = store.getState().bookings.items[0].id;
    store.dispatch(markSynced(id));
    expect(store.getState().bookings.items[0].isPendingSync).toBe(false);
  });

  it('clearError resets doctor fetch error', () => {
    const store = makeStore();
    store.dispatch({ type: 'doctors/fetchDoctors/rejected', payload: 'timeout' });
    expect(store.getState().doctors.error).toBe('timeout');
    store.dispatch(clearError());
    expect(store.getState().doctors.error).toBeNull();
  });

  it('20 rapid bookings are all stored', () => {
    const store = makeStore();
    for (let i = 0; i < 20; i++) {
      store.dispatch(addBooking(makePayload({ slotId: `slot_${i}` })));
    }
    expect(store.getState().bookings.items.length).toBe(20);
  });

  it('all booking IDs are unique', () => {
    const store = makeStore();
    for (let i = 0; i < 10; i++) {
      store.dispatch(addBooking(makePayload({ slotId: `unique_${i}` })));
    }
    const ids = store.getState().bookings.items.map(b => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('cancelling one does not affect others', () => {
    const store = makeStore();
    store.dispatch(addBooking(makePayload({ slotId: 'slot_1' })));
    store.dispatch(addBooking(makePayload({ slotId: 'slot_2' })));
    store.dispatch(cancelBooking(store.getState().bookings.items[0].id));
    const confirmed = store.getState().bookings.items.filter(b => b.status === 'confirmed');
    expect(confirmed.length).toBe(1);
    expect(confirmed[0].slotId).toBe('slot_2');
  });

  it('error is cleared after successful fetch', () => {
    const store = makeStore();
    store.dispatch({ type: 'doctors/fetchDoctors/rejected', payload: 'timeout' });
    store.dispatch({ type: 'doctors/fetchDoctors/fulfilled', payload: [] });
    expect(store.getState().doctors.error).toBeNull();
  });

  it('Saturday and Sunday bookings work correctly', () => {
    const store = makeStore();
    store.dispatch(addBooking(makePayload({ dayOfWeek: 'Saturday' })));
    store.dispatch(addBooking(makePayload({ dayOfWeek: 'Sunday', slotId: 'slot_sun' })));
    expect(store.getState().bookings.items.length).toBe(2);
  });
});

// ── Selectors ─────────────────────────────────────────────────────────────────

describe('selectDoctors', () => {
  it('returns doctors array', () =>
    expect(selectDoctors(buildState([makeDoctor()]) as any).length).toBe(1));

  it('returns empty array when no doctors', () =>
    expect(selectDoctors(buildState() as any).length).toBe(0));
});

describe('selectDoctorById', () => {
  it('returns the correct doctor', () => {
    const state = buildState([makeDoctor()]);
    expect(selectDoctorById('dr_alice')(state as any)?.id).toBe('dr_alice');
  });

  it('returns undefined for unknown id', () =>
    expect(selectDoctorById('unknown')(buildState([makeDoctor()]) as any)).toBeUndefined());

  it('is memoized — same reference for same state', () => {
    const state = buildState([makeDoctor()]);
    const sel = selectDoctorById('dr_alice');
    expect(sel(state as any)).toBe(sel(state as any));
  });
});

describe('selectBookings', () => {
  it('returns all bookings', () =>
    expect(selectBookings(buildState([], [makeBooking()]) as any).length).toBe(1));

  it('returns empty array when no bookings', () =>
    expect(selectBookings(buildState() as any).length).toBe(0));
});

describe('selectConfirmedBookings', () => {
  it('returns only confirmed bookings', () => {
    const state = buildState([], [
      makeBooking(),
      makeBooking({ id: 'b2', slotId: 'slot_2', status: 'cancelled' }),
    ]);
    expect(selectConfirmedBookings(state as any).length).toBe(1);
  });

  it('returns empty when all are cancelled', () =>
    expect(
      selectConfirmedBookings(buildState([], [makeBooking({ status: 'cancelled' })]) as any).length,
    ).toBe(0));

  it('returns empty when no bookings', () =>
    expect(selectConfirmedBookings(buildState() as any).length).toBe(0));
});

describe('selectBookedSlotIdsByDoctor', () => {
  it('returns Set containing confirmed slot id', () => {
    const state = buildState([], [makeBooking({ doctorId: 'dr_alice', slotId: 'slot_abc' })]);
    const ids = selectBookedSlotIdsByDoctor('dr_alice')(state as any);
    expect(ids).toBeInstanceOf(Set);
    expect(ids.has('slot_abc')).toBe(true);
  });

  it('excludes cancelled bookings', () => {
    const state = buildState([], [makeBooking({ slotId: 'slot_xyz', status: 'cancelled' })]);
    expect(selectBookedSlotIdsByDoctor('dr_alice')(state as any).has('slot_xyz')).toBe(false);
  });

  it('returns empty Set for unknown doctor', () =>
    expect(selectBookedSlotIdsByDoctor('nobody')(buildState() as any).size).toBe(0));

  it('only includes slots for the target doctor', () => {
    const state = buildState([], [
      makeBooking({ doctorId: 'dr_alice', slotId: 'slot_alice' }),
      makeBooking({ id: 'b2', doctorId: 'dr_bob', slotId: 'slot_bob' }),
    ]);
    const ids = selectBookedSlotIdsByDoctor('dr_alice')(state as any);
    expect(ids.has('slot_alice')).toBe(true);
    expect(ids.has('slot_bob')).toBe(false);
  });

  it('is memoized — same reference when state unchanged', () => {
    const state = buildState([], [makeBooking()]);
    const sel = selectBookedSlotIdsByDoctor('dr_alice');
    expect(sel(state as any)).toBe(sel(state as any));
  });

  it('includes all confirmed slots for same doctor', () => {
    const state = buildState([], [
      makeBooking({ slotId: 's1' }),
      makeBooking({ id: 'b2', slotId: 's2' }),
      makeBooking({ id: 'b3', slotId: 's3' }),
    ]);
    expect(selectBookedSlotIdsByDoctor('dr_alice')(state as any).size).toBe(3);
  });
});