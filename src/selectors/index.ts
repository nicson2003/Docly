import { createSelector } from 'reselect';
import { RootState } from '../store';

// ─── Doctors ────────────────────────────────────────────────────────────────
export const selectDoctors = (state: RootState) => state.doctors.items;

export const selectDoctorById = (doctorId: string) =>
  createSelector([selectDoctors], doctors =>
    doctors.find(d => d.id === doctorId)
  );

// ─── Bookings ───────────────────────────────────────────────────────────────
export const selectBookings = (state: RootState) => state.bookings.items;

export const selectConfirmedBookings = createSelector(
  [selectBookings],
  bookings => bookings.filter(b => b.status === 'confirmed')
);

export const selectBookedSlotIdsByDoctor = (doctorId: string) =>
  createSelector([selectBookings], bookings => {
    const ids = new Set<string>();
    bookings
      .filter(b => b.doctorId === doctorId && b.status === 'confirmed')
      .forEach(b => ids.add(b.slotId));
    return ids;
  });
