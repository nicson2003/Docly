import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Booking, BookingsState } from '../../types';
import { generateBookingId } from '../../utils';

const initialState: BookingsState = {
  items: [],
};

const bookingsSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    addBooking(state, action: PayloadAction<Omit<Booking, 'id' | 'bookedAt' | 'status'>>) {
      const payload = action.payload;

      // Guard: prevent double-booking same doctor + slot
      const alreadyBooked = state.items.some(
        (b) =>
          b.doctorId === payload.doctorId &&
          b.slotId === payload.slotId &&
          b.status === 'confirmed'
      );
      if (alreadyBooked) return;

      const booking: Booking = {
        ...payload,
        id: generateBookingId(),
        bookedAt: new Date().toISOString(),
        status: 'confirmed',
      };
      state.items.push(booking);
    },

    cancelBooking(state, action: PayloadAction<string>) {
      const booking = state.items.find((b) => b.id === action.payload);
      if (booking) {
        booking.status = 'cancelled';
        booking.isPendingSync = false;
      }
    },

    markSynced(state, action: PayloadAction<string>) {
      const booking = state.items.find((b) => b.id === action.payload);
      if (booking) {
        booking.isPendingSync = false;
      }
    },

    // Used when restoring persisted state (redux-persist hydration)
    replaceBookings(state, action: PayloadAction<Booking[]>) {
      state.items = action.payload;
    },
  },
});

export const { addBooking, cancelBooking, markSynced, replaceBookings } =
  bookingsSlice.actions;
export default bookingsSlice.reducer;
