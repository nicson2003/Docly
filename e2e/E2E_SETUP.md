# E2E Tests — Step-by-Step Setup Guide

The E2E tests use **Detox** (primary) with **Maestro** as a simpler alternative.
Both require the app to run on a real simulator/emulator — no mocking.

---

## Folder Structure

```
ShiftCareApp/
├── e2e/
│   ├── booking.e2e.ts          ← All Detox test scenarios (30 tests)
│   ├── jest.config.js          ← Jest config for Detox runner
│   ├── detox.config.json       ← Detox device/app configuration
│   └── full_booking_flow.yaml  ← Maestro alternative flows
│
└── src_patches/                ← Copy these files into your src/ (adds testIDs)
    ├── AppNavigator.tsx        → src/navigation/AppNavigator.tsx
    ├── ScreenHeader.tsx        → src/components/common/ScreenHeader.tsx
    ├── DoctorCard.tsx          → src/components/doctors/DoctorCard.tsx
    ├── TimeSlotGrid.tsx        → src/components/doctors/TimeSlotGrid.tsx
    ├── BookingCard.tsx         → src/components/bookings/BookingCard.tsx
    ├── BookingSuccessScreen.tsx→ src/screens/BookingSuccessScreen.tsx
    ├── DoctorsListScreen.tsx   → src/screens/DoctorsListScreen.tsx
    ├── DoctorDetailScreen.tsx  → src/screens/DoctorDetailScreen.tsx
    └── MyBookingsScreen.tsx    → src/screens/MyBookingsScreen.tsx
```

---

## What testIDs were added (and why)

| testID | Component | Used by |
|--------|-----------|---------|
| `doctor-card-{index}` | DoctorCard | Tap first doctor |
| `doctors-list` | DoctorsListScreen FlatList | Pull-to-refresh |
| `doctor-name` | DoctorDetailScreen Text | Assert doctor name visible |
| `day-tab-{index}` | TimeSlotGrid day buttons | Tap second day tab |
| `slot-available-{index}` | TimeSlotGrid slot buttons | Tap first open slot |
| `slot-booked-{index}` | TimeSlotGrid booked slots | Assert slot is booked |
| `slot-count-header` | TimeSlotGrid header View | Assert slot count updates |
| `back-button` | ScreenHeader back button | Navigate back |
| `success-circle` | BookingSuccessScreen | Assert success animation |
| `tab-DoctorsTab` | AppNavigator bottom tab | Switch to Doctors tab |
| `tab-BookingsTab` | AppNavigator bottom tab | Switch to Bookings tab |
| `booking-card-{index}` | BookingCard | Assert booking visible |

---

## Step 1 — Install Detox

```bash
# Install Detox in your project
npm install --save-dev detox @types/detox

# Install Detox CLI globally
npm install -g detox-cli

# iOS only: install AppleSimulatorUtils
brew tap wix/brew && brew install applesimutils
```

## Step 2 — Build the app for E2E

```bash
# iOS — build once, test many times
npm run e2e:build:ios

# Android
npm run e2e:build:android
```

> ⚠️ You must rebuild after any source code change that affects the app binary.
> You do NOT need to rebuild for test-only changes.

---

## Step 3 — Run the E2E tests

```bash
# Make sure a simulator is running first:
# iOS: open Xcode → Simulator → iPhone 16
# Android: open Android Studio → AVD Manager → start Pixel 7

# Run all E2E tests
npm run e2e:ios

# Run a single test file
detox test --configuration ios.sim.release e2e/booking.e2e.ts

# Run a specific describe block
detox test --configuration ios.sim.release --testNamePattern="Doctor List Screen"
```

---

## Maestro Alternative (simpler, no build required)

Maestro is easier to set up — it works against a **debug build** running in the simulator.

### Install Maestro

```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

### Run Maestro flows

```bash
# Start Metro + app first
npx react-native run-ios   # or run-android

# Then in a second terminal:
maestro test e2e/full_booking_flow.yaml
```

### The 5 flows in full_booking_flow.yaml

| Flow | Covers |
|------|--------|
| 1 | Full booking journey end-to-end |
| 2 | Cancel an appointment |
| 3 | Double-booking prevention |
| 4 | Persistence after app restart |
| 5 | Filter tabs (Upcoming / Cancelled / All) |

---

## Test Coverage — What each E2E scenario tests

### Doctor List Screen (6 tests)
- App loads and header is visible
- At least one doctor card appears
- Day/slot count badges displayed
- Tapping a card navigates to Availability
- Pull-to-refresh reloads data
- Doctor name shown on card

### Doctor Detail Screen (7 tests)
- Doctor name visible
- Day tabs rendered
- Switching day tab updates slot count header
- Available slots shown
- Tapping a slot opens Booking Confirmation
- Back button returns to list
- Stats chips (open slots count) displayed

### Booking Confirmation Screen (6 tests)
- Title "Confirm Booking" visible
- Day and Time rows shown
- Duration shows "30 minutes"
- Timezone row present
- Cancel returns to Doctor Detail
- Confirm navigates to Success screen

### Booking Success Screen (5 tests)
- Success circle animation visible
- "View My Bookings" button present
- Tapping it navigates to My Bookings tab
- "Book Another" button present
- "Book Another" returns to Doctors list

### My Bookings Screen (9 tests)
- Tab visible
- Empty state shown before any bookings
- After booking: card appears with Confirmed badge
- Tab bar badge count visible
- Cancel button present
- Cancel shows Alert → confirm cancels booking
- Cancel Alert → "Keep it" dismisses without cancelling
- Filter tabs: Cancelled / All switch correctly

### Double-Booking Prevention (1 test)
- After booking a slot, navigating back shows that slot as "Booked" and disabled

### Persistence (1 test)
- Booking survives `device.reloadReactNative()`

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `detox: command not found` | `npm install -g detox-cli` |
| `No simulator found` | Open Xcode → Simulator → start iPhone 16 |
| `element not found: doctor-card-0` | Ensure Step 1 patches were applied (testIDs missing) |
| `Build failed` | Run `cd ios && pod install && cd ..` then rebuild |
| `Tests timeout` | Increase `TIMEOUT` constant in `booking.e2e.ts` to `15000` |
| `Android: INSTALL_FAILED` | Run `adb reverse tcp:8081 tcp:8081` |
