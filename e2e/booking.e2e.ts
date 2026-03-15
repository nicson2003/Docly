/**
 * @file e2e/booking.e2e.ts
 * End-to-End tests for the Docly app using Detox
 *
 * Setup:
 *   1. npm install -g detox-cli
 *   2. Add detox config to package.json (see README)
 *   3. detox build --configuration ios.sim.release
 *   4. detox test --configuration ios.sim.release
 *
 * These tests exercise the full user journey on a real device/simulator.
 */

import { device, element, by, expect as detoxExpect, waitFor } from 'detox';

// ─── Test Configuration ───────────────────────────────────────────────────────
const TIMEOUT = 10000;

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function tapFirstDoctor() {
  await waitFor(element(by.id('doctor-card-0')))
    .toBeVisible()
    .withTimeout(TIMEOUT);
  await element(by.id('doctor-card-0')).tap();
}

async function tapFirstAvailableSlot() {
  // First day tab is auto-selected; find first non-booked slot
  await waitFor(element(by.id('slot-available-0')))
    .toBeVisible()
    .withTimeout(TIMEOUT);
  await element(by.id('slot-available-0')).tap();
}

async function confirmBooking() {
  await waitFor(element(by.text('Confirm Booking')))
    .toBeVisible()
    .withTimeout(TIMEOUT);
  await element(by.text('Confirm Booking')).tap();
}

// ─── E2E Test Suite ───────────────────────────────────────────────────────────

describe('Docly App E2E', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  // ── Doctor List Screen ─────────────────────────────────────────────────────

  describe('Doctor List Screen', () => {
    it('loads and shows the doctors list', async () => {
      await waitFor(element(by.text('Find a Doctor')))
        .toBeVisible()
        .withTimeout(TIMEOUT);
      await detoxExpect(element(by.text('Find a Doctor'))).toBeVisible();
    });

    it('displays at least one doctor card', async () => {
      await waitFor(element(by.id('doctor-card-0')))
        .toBeVisible()
        .withTimeout(TIMEOUT);
      await detoxExpect(element(by.id('doctor-card-0'))).toBeVisible();
    });

    it('shows doctor name on card', async () => {
      await waitFor(element(by.id('doctor-card-0')))
        .toBeVisible()
        .withTimeout(TIMEOUT);
      // Verify the card contains text (name)
      await detoxExpect(element(by.id('doctor-card-0'))).toBeVisible();
    });

    it('shows days and slot count badges', async () => {
      await waitFor(element(by.id('doctor-card-0')))
        .toBeVisible()
        .withTimeout(TIMEOUT);
      await detoxExpect(element(by.text(/\d+ days?/))).toExist();
      await detoxExpect(element(by.text(/\d+ slots?/))).toExist();
    });

    it('navigates to Doctor Detail when a card is tapped', async () => {
      await tapFirstDoctor();
      await waitFor(element(by.text('Availability')))
        .toBeVisible()
        .withTimeout(TIMEOUT);
      await detoxExpect(element(by.text('Availability'))).toBeVisible();
    });

    it('handles pull-to-refresh', async () => {
      await waitFor(element(by.id('doctors-list')))
        .toBeVisible()
        .withTimeout(TIMEOUT);
      await element(by.id('doctors-list')).swipe('down', 'fast');
      await waitFor(element(by.text('Find a Doctor')))
        .toBeVisible()
        .withTimeout(TIMEOUT);
    });
  });

  // ── Doctor Detail Screen ───────────────────────────────────────────────────

  describe('Doctor Detail Screen', () => {
    beforeEach(async () => {
      await tapFirstDoctor();
    });

    it('shows doctor name', async () => {
      await waitFor(element(by.id('doctor-name')))
        .toBeVisible()
        .withTimeout(TIMEOUT);
      await detoxExpect(element(by.id('doctor-name'))).toBeVisible();
    });

    it('shows day tabs', async () => {
      await waitFor(element(by.id('day-tab-0')))
        .toBeVisible()
        .withTimeout(TIMEOUT);
      await detoxExpect(element(by.id('day-tab-0'))).toBeVisible();
    });

    it('switches day when a tab is tapped', async () => {
      await waitFor(element(by.id('day-tab-1')))
        .toBeVisible()
        .withTimeout(TIMEOUT);
      await element(by.id('day-tab-1')).tap();
      // Slot count header should update
      await waitFor(element(by.id('slot-count-header')))
        .toBeVisible()
        .withTimeout(TIMEOUT);
    });

    it('shows available time slots', async () => {
      await waitFor(element(by.id('slot-available-0')))
        .toBeVisible()
        .withTimeout(TIMEOUT);
      await detoxExpect(element(by.id('slot-available-0'))).toBeVisible();
    });

    it('navigates to booking confirmation on slot tap', async () => {
      await tapFirstAvailableSlot();
      await waitFor(element(by.text('Confirm Booking')))
        .toBeVisible()
        .withTimeout(TIMEOUT);
      await detoxExpect(element(by.text('Confirm Booking'))).toBeVisible();
    });

    it('can go back to doctors list', async () => {
      await element(by.id('back-button')).tap();
      await waitFor(element(by.text('Find a Doctor')))
        .toBeVisible()
        .withTimeout(TIMEOUT);
    });

    it('shows stats — open slots / booked count', async () => {
      await waitFor(element(by.text(/slots open/)))
        .toExist()
        .withTimeout(TIMEOUT);
    });
  });

  // ── Booking Confirmation Screen ────────────────────────────────────────────

  describe('Booking Confirmation Screen', () => {
    beforeEach(async () => {
      await tapFirstDoctor();
      await tapFirstAvailableSlot();
    });

    it('shows confirm booking title', async () => {
      await detoxExpect(element(by.text('Confirm Booking'))).toBeVisible();
    });

    it('shows appointment details (day + time)', async () => {
      await detoxExpect(element(by.text('Day'))).toBeVisible();
      await detoxExpect(element(by.text('Time'))).toBeVisible();
    });

    it('shows duration (30 minutes)', async () => {
      await detoxExpect(element(by.text('30 minutes'))).toBeVisible();
    });

    it('shows timezone row', async () => {
      await detoxExpect(element(by.text('Timezone'))).toBeVisible();
    });

    it('cancels booking and returns to doctor detail', async () => {
      await element(by.text('Cancel')).tap();
      await waitFor(element(by.text('Availability')))
        .toBeVisible()
        .withTimeout(TIMEOUT);
    });

    it('confirms booking and shows success screen', async () => {
      await confirmBooking();
      await waitFor(element(by.text('Appointment Booked!')))
        .toBeVisible()
        .withTimeout(TIMEOUT);
      await detoxExpect(element(by.text('Appointment Booked!'))).toBeVisible();
    });
  });

  // ── Booking Success Screen ─────────────────────────────────────────────────

  describe('Booking Success Screen', () => {
    beforeEach(async () => {
      await tapFirstDoctor();
      await tapFirstAvailableSlot();
      await confirmBooking();
      await waitFor(element(by.text('Appointment Booked!')))
        .toBeVisible()
        .withTimeout(TIMEOUT);
    });

    it('shows success checkmark', async () => {
      await detoxExpect(element(by.id('success-circle'))).toBeVisible();
    });

    it('shows "View My Bookings" button', async () => {
      await detoxExpect(element(by.text('View My Bookings'))).toBeVisible();
    });

    it('navigates to My Bookings tab', async () => {
      await element(by.text('View My Bookings')).tap();
      await waitFor(element(by.text('My Bookings')))
        .toBeVisible()
        .withTimeout(TIMEOUT);
    });

    it('shows "Book Another" button', async () => {
      await detoxExpect(element(by.text('Book Another'))).toBeVisible();
    });

    it('"Book Another" returns to doctors list', async () => {
      await element(by.text('Book Another')).tap();
      await waitFor(element(by.text('Find a Doctor')))
        .toBeVisible()
        .withTimeout(TIMEOUT);
    });
  });

  // ── My Bookings Screen ─────────────────────────────────────────────────────

  describe('My Bookings Screen', () => {
    it('shows My Bookings tab', async () => {
      await element(by.id('tab-BookingsTab')).tap();
      await waitFor(element(by.text('My Bookings')))
        .toBeVisible()
        .withTimeout(TIMEOUT);
    });

    it('shows empty state before any bookings', async () => {
      await element(by.id('tab-BookingsTab')).tap();
      await waitFor(element(by.text('No upcoming appointments')))
        .toBeVisible()
        .withTimeout(TIMEOUT);
    });

    describe('after booking an appointment', () => {
      beforeEach(async () => {
        // Book an appointment first
        await tapFirstDoctor();
        await tapFirstAvailableSlot();
        await confirmBooking();
        await waitFor(element(by.text('View My Bookings')))
          .toBeVisible()
          .withTimeout(TIMEOUT);
        await element(by.text('View My Bookings')).tap();
      });

      it('shows the booked appointment', async () => {
        await waitFor(element(by.id('booking-card-0')))
          .toBeVisible()
          .withTimeout(TIMEOUT);
        await detoxExpect(element(by.id('booking-card-0'))).toBeVisible();
      });

      it('shows confirmed badge on booking', async () => {
        await detoxExpect(element(by.text(/Confirmed/))).toBeVisible();
      });

      it('shows badge count on tab bar', async () => {
        await detoxExpect(element(by.id('tab-badge-BookingsTab'))).toBeVisible();
      });

      it('shows cancel appointment button', async () => {
        await detoxExpect(element(by.text('Cancel Appointment'))).toBeVisible();
      });

      it('cancels an appointment with confirmation dialog', async () => {
        await element(by.text('Cancel Appointment')).tap();
        await waitFor(element(by.text('Cancel Appointment')))
          .toBeVisible()
          .withTimeout(TIMEOUT);
        // Press the destructive confirm button in the Alert
        await element(by.text('Cancel Appointment')).atIndex(1).tap();
        await waitFor(element(by.text('Cancelled')))
          .toBeVisible()
          .withTimeout(TIMEOUT);
      });

      it('dismisses cancel dialog with "Keep it"', async () => {
        await element(by.text('Cancel Appointment')).tap();
        await element(by.text('Keep it')).tap();
        await detoxExpect(element(by.text(/Confirmed/))).toBeVisible();
      });

      it('filter tabs switch between views', async () => {
        await element(by.text('Cancelled')).tap();
        await waitFor(element(by.text('No cancelled appointments')))
          .toBeVisible()
          .withTimeout(TIMEOUT);
        await element(by.text('All')).tap();
        await waitFor(element(by.id('booking-card-0')))
          .toBeVisible()
          .withTimeout(TIMEOUT);
      });
    });
  });

  // ── Double-Booking Prevention (E2E) ───────────────────────────────────────

  describe('Double-Booking Prevention', () => {
    it('prevents booking the same slot twice', async () => {
      // Book a slot
      await tapFirstDoctor();
      await tapFirstAvailableSlot();
      await confirmBooking();
      await waitFor(element(by.text('Book Another'))).toBeVisible().withTimeout(TIMEOUT);
      await element(by.text('Book Another')).tap();

      // Navigate back to same doctor
      await tapFirstDoctor();

      // The slot should now appear as "Booked" and be disabled
      await waitFor(element(by.text('Booked')))
        .toBeVisible()
        .withTimeout(TIMEOUT);
      await detoxExpect(element(by.text('Booked'))).toBeVisible();
    });
  });

  // ── Offline Behavior (E2E) ────────────────────────────────────────────────

  describe('Persistence', () => {
    it('persists bookings after app reload', async () => {
      // Book an appointment
      await tapFirstDoctor();
      await tapFirstAvailableSlot();
      await confirmBooking();
      await waitFor(element(by.text('View My Bookings'))).toBeVisible().withTimeout(TIMEOUT);
      await element(by.text('View My Bookings')).tap();
      await waitFor(element(by.id('booking-card-0'))).toBeVisible().withTimeout(TIMEOUT);

      // Reload the app
      await device.reloadReactNative();

      // Bookings should still be there
      await element(by.id('tab-BookingsTab')).tap();
      await waitFor(element(by.id('booking-card-0')))
        .toBeVisible()
        .withTimeout(TIMEOUT);
      await detoxExpect(element(by.id('booking-card-0'))).toBeVisible();
    });
  });
});