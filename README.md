# Docly — ShiftCare Technical Challenge

A React Native appointment booking app built for the ShiftCare technical challenge.

## Setup & Installation

### Prerequisites

- Node.js >= 22.11.0
- Ruby (for CocoaPods)
- Xcode (iOS) or Android Studio (Android)

### Install

```bash
# 1. Install JS dependencies
npm install

# 2. Install iOS native dependencies
cd ios && pod install && cd ..
```

### Run

```bash
# iOS Simulator
npx react-native run-ios

# Android Emulator (ensure one is running)
npx react-native run-android

# Metro bundler (separate terminal)
npx react-native start
```

### Test

```bash
npm test                # run all tests once
npm run test:coverage   # with coverage report
npm run test:watch      # watch mode
npm run type-check      # TypeScript check
```

---

## Project Structure

```
ShiftCareApp/
├── App.tsx
├── src/
│   ├── types/index.ts
│   ├── theme/index.ts
│   ├── services/api.ts
│   ├── utils/index.ts
│   ├── store/
│   │   ├── index.ts
│   │   └── slices/
│   │       ├── doctorsSlice.ts
│   │       └── bookingsSlice.ts
│   ├── hooks/useRedux.ts
│   ├── navigation/AppNavigator.tsx
│   ├── screens/
│   │   ├── DoctorsListScreen.tsx
│   │   ├── DoctorDetailScreen.tsx
│   │   ├── BookingConfirmationScreen.tsx
│   │   ├── BookingSuccessScreen.tsx
│   │   ├── MyBookingsScreen.tsx
│   │   └── CalendarBookingScreen.tsx
│   └── components/
│       ├── common/
│       ├── doctors/
│       └── bookings/
└── __tests__/
    ├── utils/
    │   ├── utils.test.ts
    │   └── api.test.ts
    ├── store/
    │   ├── slices.ts
    │   └── integration.test.ts
    ├── components/
    │   ├── components.test.tsx
    │   └── screenheader.android.test.tsx
    └── screens/
        └── calendarbookingscreen.test.tsx
```

---

## Screens

### 1. Doctors List (DoctorsTab)
Displays all active doctors fetched from the API. Shows name, available days, total slots, and timezone. Supports pull-to-refresh and error/empty states.

### 2. Doctor Detail / Availability
Weekly schedule with 30-minute time slots organised by day. Booked slots are visually disabled. Tapping an available slot navigates to Booking Confirmation.

### 3. Calendar Booking (CalendarTab)
Google Calendar-style booking flow:
1. Browse a month calendar — teal dots mark days with available doctors
2. Tap a date — a horizontal strip of 30-minute time chips appears
3. Tap a time chip — available doctors slide up at the bottom
4. Tap a doctor — a confirmation bottom sheet modal appears
5. Confirm — booking is saved and the app navigates to My Bookings

### 4. Booking Confirmation
Modal screen summarising the selected doctor, date, time, duration, and timezone before committing the booking.

### 5. Booking Success
Animated success screen shown after confirming. Offers navigation to My Bookings or back to the Doctors list.

### 6. My Bookings (BookingsTab)
Lists all bookings with Upcoming / Cancelled / All filter tabs. Shows a badge count of confirmed appointments on the tab bar. Cancellation requires Alert confirmation.

---

## Navigation

Three bottom tabs: **Doctors | Calendar | My Bookings**

The Calendar tab is the new primary booking entry point. The Doctors tab preserves the original slot-grid flow via Doctor Detail. Both flows share the same Redux store and booking rules.

---

## Architecture Decisions

### React Native 0.84 + React 19
Enables the New Architecture (Fabric + JSI) by default, eliminating the bridge bottleneck and delivering synchronous layout measurements.

### Redux Toolkit + redux-persist
RTK provides type-safe reducers and async thunks. Only bookings are persisted to AsyncStorage — doctors are always re-fetched from the API (with a 5-minute in-memory cache to avoid redundant requests within a session).

### Slot Generation
30-minute slots are computed once at fetch time in processDoctors(). Slot IDs use the format {doctorId}_{day}_{HH:MM}, making booked-slot lookups O(1) via Set.has() per slot render.

### Multiple Windows Per Day
The API can return multiple availability windows per doctor per day (e.g., Dr. Geovany Keebler: 7AM–2PM + 3PM–5PM on Thursday). These are merged, deduplicated, and sorted into a single slot list per day.

### Double-Booking Prevention
Enforced at two layers:
- UI layer: confirmed doctorId::slotId pairs are stored in a Set. Doctors with a matching key are removed from the available list before rendering.
- Redux layer: addBooking guards against doctorId + slotId + status === confirmed duplicates regardless of how the action is dispatched.

### Calendar Screen — Zero New Slices
CalendarBookingScreen reads directly from state.doctors.items and state.bookings.items and dispatches the existing addBooking action. No new Redux state was introduced.

---

## Timezone Assumptions

| Assumption | Detail |
|---|---|
| Display only | Timezones shown as labels (e.g., "Perth time") |
| No UTC conversion | Slot times are in the doctor's local timezone |
| Weekly recurrence | Slots repeat on the same day every week |
| No DST handling | See Future Enhancements |

---

## App Usage

1. **Doctors tab** — browse available doctors, tap one to see their weekly slot grid, tap a slot to book.
2. **Calendar tab** — pick a date on the calendar, select a time chip, pick a doctor from the list, confirm in the bottom sheet modal.
3. **My Bookings tab** — view confirmed appointments (badge shows count), cancel with confirmation dialog.

---

## Testing

### Test structure

| File | What it covers |
|---|---|
| __tests__/utils/utils.test.ts | 27 utility tests: time parsing, slot generation, doctor processing, date helpers |
| __tests__/utils/api.test.ts | API service: success, HTTP errors, retry logic, timeout, invalid response, network errors |
| __tests__/store/slices.ts | Redux slice unit tests: addBooking, cancelBooking, markSynced, replaceBookings, doctorsSlice transitions |
| __tests__/store/integration.test.ts | Full booking workflow, selector tests, double-booking prevention, edge cases |
| __tests__/components/components.test.tsx | DoctorAvatar, EmptyState, ErrorState, LoadingState, ScreenHeader, DoctorCard, BookingCard including Alert flow |
| __tests__/components/screenheader.android.test.tsx | ScreenHeader Platform.OS android branch (separate file required — StyleSheet.create runs at module load) |
| __tests__/screens/calendarbookingscreen.test.tsx | CalendarBookingScreen: calendar rendering, date/time selection, doctor panel, booked slot filtering, modal, Redux dispatch, edge cases |

### Run tests

```bash
npm test                             # all tests
npm run test:coverage                # with coverage report
npm test -- --testPathPattern="api"  # single file
```

### Coverage thresholds (jest.config.js)

| Metric | Threshold |
|---|---|
| Statements | 97% |
| Branches | 90% |
| Functions | 95% |
| Lines | 97% |

---

## Known Limitations

- No authentication (single-device, local-only experience)
- Slots are weekly-recurring, not bound to a specific calendar date
- No DST-aware timezone conversion
- Doctor data requires network on first launch (no offline cache to AsyncStorage)
- No push notifications or reminders
- ScreenHeader android marginTop branch requires a dedicated test file due to StyleSheet.create running at module load time

---

## Future Enhancements (prioritised)

1. **Backend booking API** — POST bookings server-side with optimistic UI
2. **Authentication** — OAuth/magic link for cross-device sync
3. **DST-aware scheduling** — Intl.DateTimeFormat with real UTC offsets
4. **Specific date booking** — Book a concrete date vs. recurring weekday
5. **Push notifications** — FCM/APNs reminders before appointments
6. **Offline doctor cache** — Persist last-fetched doctors to AsyncStorage
7. **Search & filter** — Filter by timezone, specialty, or available day
8. **Reschedule flow** — Change rather than cancel and rebook
9. **E2E testing** — Detox or Maestro flows for critical paths
10. **FlashList** — Replace FlatList for better large-list performance
11. **AI Booking Assistant** — "Aba" suggests physicians/specialists based on patient symptoms and explains condition severity (Stable, Fair, Serious, Critical, Undetermined)
12. **AI Early Diagnostic** — Subscription feature: early diagnostic for serious/critical patients by scanning facial reactions, eye movements, and smartwatch data (heart rate, blood oxygen, sleep, blood pressure)
13. **Localization** — Support 3–5 major languages
14. **Dark/Light Mode** — Theme switching including larger fonts for patients with poor eyesight