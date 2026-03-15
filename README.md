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
│   ├── types/index.ts          # All TS types
│   ├── theme/index.ts          # Colors, spacing, typography
│   ├── services/api.ts         # Fetch with retry + timeout
│   ├── utils/index.ts          # Time parsing, slot generation, doctor processing
│   ├── store/
│   │   ├── index.ts            # Redux store + redux-persist
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
│   │   └── MyBookingsScreen.tsx
│   └── components/
│       ├── common/             # DoctorAvatar, ScreenHeader, LoadingState, ErrorState, EmptyState
│       ├── doctors/            # DoctorCard, TimeSlotGrid
│       └── bookings/           # BookingCard
└── __tests__/
    ├── utils/utils.test.ts     # 27 utility tests
    ├── utils/api.test.ts       # API service + retry tests
    └── store/
        ├── slices.test.ts      # Redux slice unit tests
        └── integration.test.ts # Full booking workflow tests
```

---

## Architecture Decisions

### React Native 0.84 + React 19
RN 0.84 enables the **New Architecture** by default (Fabric renderer + JSI).
This eliminates the bridge bottleneck and delivers synchronous layout measurements.

### Redux Toolkit + redux-persist
RTK provides type-safe reducers and async thunks. Only `bookings` are persisted
to AsyncStorage — doctors are re-fetched from the API on each launch (with a
5-minute in-memory cache to avoid redundant requests within a session).

### Slot Generation
30-minute slots are computed once at fetch time in `processDoctors()`.
Slot IDs use the format `{doctorId}_{day}_{HH:MM}`, making booked-slot lookups
an O(1) `Set.has()` per slot render.

### Multiple Windows Per Day
The API can return multiple availability windows per doctor per day (e.g., Dr. Geovany
Keebler: 7AM–2PM + 3PM–5PM on Thursday). These are merged, deduplicated, and sorted
into a single slot list per day.

### Double-Booking Prevention
Enforced at the Redux reducer level inside `addBooking`: if a `confirmed` booking
already exists for the same `doctorId + slotId`, the dispatch is silently ignored.
The UI additionally disables booked slot buttons.

### Timezone Handling
Times from the API are assumed to be in the doctor's local timezone and displayed
as labels (e.g., "Sydney time") without client-side conversion. Day chips show
the next upcoming calendar date for orientation only — slots recur weekly.

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
| Select doctor on the list in Doctors list screen |
| Choose desire date and time |
| Confirm booking and check it on My Bookings tab, it will also shows number of confirmed bookings as badge |
| Confirmed bookings can be cancel on My Bookings tab by clicking "Cancel Appointment" then confirm cancellation  |

---

## Known Limitations & Future Enhancements

### Limitations
- No authentication (single-device, local-only experience)
- Slots are weekly-recurring, not bound to a specific date
- No DST-aware timezone conversion
- Doctor data requires network (no offline cache to AsyncStorage)
- No push notifications or reminders

### Future Enhancements (prioritised)
1. **Backend booking API** — POST bookings server-side with optimistic UI
2. **Authentication** — OAuth/magic link for cross-device sync
3. **DST-aware scheduling** — `Intl.DateTimeFormat` with real UTC offsets
4. **Specific date booking** — Book a concrete date vs. recurring weekday
5. **Push notifications** — FCM/APNs reminders before appointments
6. **Offline doctor cache** — Persist last-fetched doctors to AsyncStorage
7. **Search & filter** — Filter by timezone, specialty, or available day
8. **Reschedule flow** — Change rather than cancel + rebook
9. **E2E testing** — Maestro or Detox flows for critical paths
10. **FlashList** — Replace FlatList for better large-list performance
11. **Add AI Booking Assistant** - implement "aba" an ai booking assistant" that can suggest specific physician/specialist depends on patients symptoms.
And also able to explain patient condition from Stable, Fair, Serious, Critical, and Undetermined.
12. **Add AI Early Diagnostic** - for subscription only. implement early diagnostic for serious and critical patient by scanning facial reactions and eye movements, and analyzing data from their smart watches ex: hearth rate & rhythm, blood oxygen saturation, sleep tracking, blood pressure, physical activities and other data.
