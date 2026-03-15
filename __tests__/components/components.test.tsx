/**
 * @file components.test.tsx
 * Component render/interaction tests
 * Tests DoctorCard, BookingCard, common components
 */

import React from 'react';
import { Alert, Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import DoctorAvatar from '../../src/components/common/DoctorAvatar';
import EmptyState from '../../src/components/common/EmptyState';
import ErrorState from '../../src/components/common/ErrorState';
import LoadingState from '../../src/components/common/LoadingState';
import DoctorCard from '../../src/components/doctors/DoctorCard';
import BookingCard from '../../src/components/bookings/BookingCard';
import ScreenHeader from '../../src/components/common/ScreenHeader';
import { Doctor, Booking } from '../../src/types';

// ─── Mock SafeAreaContext ─────────────────────────────────────────────────────

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: any) => children,
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeDoctor = (overrides: Partial<Doctor> = {}): Doctor => ({
  id: 'dr_alice_smith',
  name: 'Dr. Alice Smith',
  timezone: 'Australia/Sydney',
  schedule: [
    {
      day: 'Monday',
      slots: [
        {
          id: 'slot_1',
          doctorId: 'dr_alice_smith',
          dayOfWeek: 'Monday',
          startTime: '09:00',
          endTime: '09:30',
          displayStart: '9:00 AM',
          displayEnd: '9:30 AM',
        },
        {
          id: 'slot_2',
          doctorId: 'dr_alice_smith',
          dayOfWeek: 'Monday',
          startTime: '09:30',
          endTime: '10:00',
          displayStart: '9:30 AM',
          displayEnd: '10:00 AM',
        },
      ],
    },
    {
      day: 'Wednesday',
      slots: [
        {
          id: 'slot_3',
          doctorId: 'dr_alice_smith',
          dayOfWeek: 'Wednesday',
          startTime: '10:00',
          endTime: '10:30',
          displayStart: '10:00 AM',
          displayEnd: '10:30 AM',
        },
      ],
    },
  ],
  avatarColor: '#0D7377',
  initials: 'AS',
  ...overrides,
});

const makeBooking = (overrides: Partial<Booking> = {}): Booking => ({
  id: 'booking_001',
  doctorId: 'dr_alice_smith',
  doctorName: 'Dr. Alice Smith',
  doctorTimezone: 'Australia/Sydney',
  slotId: 'slot_1',
  dayOfWeek: 'Monday',
  startTime: '09:00',
  endTime: '09:30',
  displayStart: '9:00 AM',
  displayEnd: '9:30 AM',
  bookedAt: '2024-03-15T09:00:00.000Z',
  status: 'confirmed',
  isPendingSync: false,
  ...overrides,
});

// ─── DoctorAvatar ─────────────────────────────────────────────────────────────

describe('DoctorAvatar', () => {
  it('renders initials', () => {
    const { getByText } = render(
      <DoctorAvatar initials="AS" color="#0D7377" />,
    );
    expect(getByText('AS')).toBeTruthy();
  });

  it('renders with custom size', () => {
    const { getByText } = render(
      <DoctorAvatar initials="JD" color="#7C3AED" size={64} />,
    );
    expect(getByText('JD')).toBeTruthy();
  });

  it('renders with default size when not specified', () => {
    const { getByText } = render(
      <DoctorAvatar initials="AB" color="#DC2626" />,
    );
    expect(getByText('AB')).toBeTruthy();
  });
});

// ─── EmptyState ───────────────────────────────────────────────────────────────

describe('EmptyState', () => {
  it('renders title', () => {
    const { getByText } = render(<EmptyState title="No doctors found" />);
    expect(getByText('No doctors found')).toBeTruthy();
  });

  it('renders subtitle when provided', () => {
    const { getByText } = render(
      <EmptyState title="No results" subtitle="Try again later" />,
    );
    expect(getByText('Try again later')).toBeTruthy();
  });

  it('does not render subtitle when not provided', () => {
    const { queryByText } = render(<EmptyState title="Empty" />);
    expect(queryByText('Try again later')).toBeNull();
  });

  it('renders custom icon', () => {
    const { getByText } = render(<EmptyState icon="🩺" title="No doctors" />);
    expect(getByText('🩺')).toBeTruthy();
  });

  it('renders default icon when not provided', () => {
    const { getByText } = render(<EmptyState title="Empty" />);
    expect(getByText('📭')).toBeTruthy();
  });
});

// ─── ErrorState ───────────────────────────────────────────────────────────────

describe('ErrorState', () => {
  it('renders error message', () => {
    const { getByText } = render(<ErrorState message="Network error" />);
    expect(getByText('Network error')).toBeTruthy();
  });

  it('renders retry button when onRetry provided', () => {
    const onRetry = jest.fn();
    const { getByText } = render(
      <ErrorState message="Error" onRetry={onRetry} />,
    );
    expect(getByText('Try Again')).toBeTruthy();
  });

  it('does not render retry button when onRetry not provided', () => {
    const { queryByText } = render(<ErrorState message="Error" />);
    expect(queryByText('Try Again')).toBeNull();
  });

  it('calls onRetry when retry button pressed', () => {
    const onRetry = jest.fn();
    const { getByText } = render(
      <ErrorState message="Error" onRetry={onRetry} />,
    );
    fireEvent.press(getByText('Try Again'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders the error title', () => {
    const { getByText } = render(<ErrorState message="Something broke" />);
    expect(getByText('Something went wrong')).toBeTruthy();
  });
});

// ─── LoadingState ─────────────────────────────────────────────────────────────

describe('LoadingState', () => {
  it('renders default message', () => {
    const { getByText } = render(<LoadingState />);
    expect(getByText('Loading...')).toBeTruthy();
  });

  it('renders custom message', () => {
    const { getByText } = render(
      <LoadingState message="Fetching doctors..." />,
    );
    expect(getByText('Fetching doctors...')).toBeTruthy();
  });
});

// ─── DoctorCard ───────────────────────────────────────────────────────────────

describe('DoctorCard', () => {
  it('renders doctor name', () => {
    const { getByText } = render(
      <DoctorCard doctor={makeDoctor()} index={0} onPress={() => {}} />,
    );
    expect(getByText('Dr. Alice Smith')).toBeTruthy();
  });

  it('calls onPress with doctor ID', () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <DoctorCard doctor={makeDoctor()} index={0} onPress={onPress} />,
    );
    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalledWith('dr_alice_smith');
  });

  it('shows available days count', () => {
    const { getByText } = render(
      <DoctorCard doctor={makeDoctor()} index={0} onPress={() => {}} />,
    );
    expect(getByText(/2 days/)).toBeTruthy();
  });

  it('shows total slot count', () => {
    const { getByText } = render(
      <DoctorCard doctor={makeDoctor()} index={0} onPress={() => {}} />,
    );
    expect(getByText(/3 slots/)).toBeTruthy();
  });

  it('shows timezone label', () => {
    const { getByText } = render(
      <DoctorCard doctor={makeDoctor()} index={0} onPress={() => {}} />,
    );
    expect(getByText(/Sydney/)).toBeTruthy();
  });

  it('renders singular day label when only 1 schedule day', () => {
    const doctor = makeDoctor({ schedule: [makeDoctor().schedule[0]] });
    const { getByText } = render(
      <DoctorCard doctor={doctor} index={0} onPress={() => {}} />,
    );
    // RN splits text across nodes — match the badge text directly
    expect(getByText(/1 day/)).toBeTruthy();
    // Confirm "days" (plural) is NOT present
    expect(() => getByText(/1 days/)).toThrow();
  });

  it('renders singular slot label when only 1 slot', () => {
    const doctor = makeDoctor({
      schedule: [{ day: 'Monday', slots: [makeDoctor().schedule[0].slots[0]] }],
    });
    const { getByText } = render(
      <DoctorCard doctor={doctor} index={0} onPress={() => {}} />,
    );
    // Match the badge text directly
    expect(getByText(/1 slot/)).toBeTruthy();
    // Confirm "slots" (plural) is NOT present
    expect(() => getByText(/1 slots/)).toThrow();
  });
});

// ─── BookingCard ──────────────────────────────────────────────────────────────

describe('BookingCard', () => {
  it('renders doctor name', () => {
    const { getByText } = render(
      <BookingCard booking={makeBooking()} index={0} onCancel={() => {}} />,
    );
    expect(getByText('Dr. Alice Smith')).toBeTruthy();
  });

  it('renders day of week', () => {
    const { getByText } = render(
      <BookingCard booking={makeBooking()} index={0} onCancel={() => {}} />,
    );
    expect(getByText('Monday')).toBeTruthy();
  });

  it('renders time range', () => {
    const { getByText } = render(
      <BookingCard booking={makeBooking()} index={0} onCancel={() => {}} />,
    );
    expect(getByText(/9:00 AM/)).toBeTruthy();
  });

  it('shows confirmed status badge', () => {
    const { getByText } = render(
      <BookingCard booking={makeBooking()} index={0} onCancel={() => {}} />,
    );
    expect(getByText(/Confirmed/)).toBeTruthy();
  });

  it('shows cancelled status for cancelled booking', () => {
    const { getByText } = render(
      <BookingCard
        booking={makeBooking({ status: 'cancelled' })}
        index={0}
        onCancel={() => {}}
      />,
    );
    expect(getByText('Cancelled')).toBeTruthy();
  });

  it('shows cancel button for confirmed bookings', () => {
    const { getByText } = render(
      <BookingCard booking={makeBooking()} index={0} onCancel={() => {}} />,
    );
    expect(getByText('Cancel Appointment')).toBeTruthy();
  });

  it('hides cancel button for cancelled bookings', () => {
    const { queryByText } = render(
      <BookingCard
        booking={makeBooking({ status: 'cancelled' })}
        index={0}
        onCancel={() => {}}
      />,
    );
    expect(queryByText('Cancel Appointment')).toBeNull();
  });

  it('shows offline badge when isPendingSync is true', () => {
    const { getByText } = render(
      <BookingCard
        booking={makeBooking({ isPendingSync: true })}
        index={0}
        onCancel={() => {}}
      />,
    );
    expect(getByText(/offline/i)).toBeTruthy();
  });

  it('does not show offline badge when isPendingSync is false', () => {
    const { queryByText } = render(
      <BookingCard
        booking={makeBooking({ isPendingSync: false })}
        index={0}
        onCancel={() => {}}
      />,
    );
    expect(queryByText(/offline/i)).toBeNull();
  });

  it('does not show offline badge when cancelled even if isPendingSync is true', () => {
    const { queryByText } = render(
      <BookingCard
        booking={makeBooking({ status: 'cancelled', isPendingSync: true })}
        index={0}
        onCancel={() => {}}
      />,
    );
    expect(queryByText(/will sync/i)).toBeNull();
  });

  it('renders timezone label', () => {
    const { getByText } = render(
      <BookingCard booking={makeBooking()} index={0} onCancel={() => {}} />,
    );
    expect(getByText(/Sydney/)).toBeTruthy();
  });
});

// ─── ScreenHeader ─────────────────────────────────────────────────────────────

describe('ScreenHeader', () => {
  it('renders the title', () => {
    const { getByText } = render(<ScreenHeader title="Find a Doctor" />);
    expect(getByText('Find a Doctor')).toBeTruthy();
  });

  it('renders subtitle when provided', () => {
    const { getByText } = render(
      <ScreenHeader title="Doctors" subtitle="Choose a specialist" />,
    );
    expect(getByText('Choose a specialist')).toBeTruthy();
  });

  it('does not render subtitle when not provided', () => {
    const { queryByText } = render(<ScreenHeader title="Doctors" />);
    expect(queryByText('Choose a specialist')).toBeNull();
  });

  it('renders back button when showBack is true', () => {
    const { getByLabelText } = render(
      <ScreenHeader title="Detail" showBack onBack={() => {}} />,
    );
    expect(getByLabelText('Go back')).toBeTruthy();
  });

  it('does not render back button when showBack is false', () => {
    const { queryByLabelText } = render(<ScreenHeader title="Home" />);
    expect(queryByLabelText('Go back')).toBeNull();
  });

  it('calls onBack when back button is pressed', () => {
    const onBack = jest.fn();
    const { getByLabelText } = render(
      <ScreenHeader title="Detail" showBack onBack={onBack} />,
    );
    fireEvent.press(getByLabelText('Go back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('renders rightElement when provided', () => {
    const { getByText } = render(
      <ScreenHeader title="Doctors" rightElement={<Text>Edit</Text>} />,
    );
    expect(getByText('Edit')).toBeTruthy();
  });

  it('elevated prop does not cause a crash', () => {
    expect(() =>
      render(<ScreenHeader title="Elevated" elevated />),
    ).not.toThrow();
  });

  it('renders without subtitle or back button by default', () => {
    const { queryByLabelText } = render(<ScreenHeader title="Home" />);
    expect(queryByLabelText('Go back')).toBeNull();
  });
});

// ─── BookingCard — handleCancel Alert flow (lines 21-29) ─────────────────────

const makeBookingForCancel = (overrides: Partial<Booking> = {}): Booking => ({
  id: 'booking_cancel_test',
  doctorId: 'dr_alice_smith',
  doctorName: 'Dr. Alice Smith',
  doctorTimezone: 'Australia/Sydney',
  slotId: 'slot_1',
  dayOfWeek: 'Monday',
  startTime: '09:00',
  endTime: '09:30',
  displayStart: '9:00 AM',
  displayEnd: '9:30 AM',
  bookedAt: '2024-03-15T09:00:00.000Z',
  status: 'confirmed',
  isPendingSync: false,
  ...overrides,
});

describe('BookingCard — handleCancel Alert flow', () => {
  beforeEach(() => {
    jest.spyOn(Alert, 'alert');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('pressing Cancel Appointment opens an Alert', () => {
    const { getByText } = render(
      <BookingCard
        booking={makeBookingForCancel()}
        index={0}
        onCancel={jest.fn()}
      />,
    );
    fireEvent.press(getByText('Cancel Appointment'));
    expect(Alert.alert).toHaveBeenCalledTimes(1);
  });

  it('Alert title is "Cancel Appointment"', () => {
    const { getByText } = render(
      <BookingCard
        booking={makeBookingForCancel()}
        index={0}
        onCancel={jest.fn()}
      />,
    );
    fireEvent.press(getByText('Cancel Appointment'));
    expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe(
      'Cancel Appointment',
    );
  });

  it('Alert message contains the doctor name', () => {
    const { getByText } = render(
      <BookingCard
        booking={makeBookingForCancel()}
        index={0}
        onCancel={jest.fn()}
      />,
    );
    fireEvent.press(getByText('Cancel Appointment'));
    const message = (Alert.alert as jest.Mock).mock.calls[0][1] as string;
    expect(message).toContain('Dr. Alice Smith');
  });

  it('Alert message contains the day of week', () => {
    const { getByText } = render(
      <BookingCard
        booking={makeBookingForCancel()}
        index={0}
        onCancel={jest.fn()}
      />,
    );
    fireEvent.press(getByText('Cancel Appointment'));
    const message = (Alert.alert as jest.Mock).mock.calls[0][1] as string;
    expect(message).toContain('Monday');
  });

  it('Alert has both "Keep it" and "Cancel Appointment" buttons', () => {
    const { getByText } = render(
      <BookingCard
        booking={makeBookingForCancel()}
        index={0}
        onCancel={jest.fn()}
      />,
    );
    fireEvent.press(getByText('Cancel Appointment'));
    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2] as any[];
    expect(buttons.find(b => b.text === 'Keep it')).toBeTruthy();
    expect(buttons.find(b => b.text === 'Cancel Appointment')).toBeTruthy();
  });

  it('"Keep it" button has style "cancel"', () => {
    const { getByText } = render(
      <BookingCard
        booking={makeBookingForCancel()}
        index={0}
        onCancel={jest.fn()}
      />,
    );
    fireEvent.press(getByText('Cancel Appointment'));
    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2] as any[];
    expect(buttons.find(b => b.text === 'Keep it').style).toBe('cancel');
  });

  it('"Cancel Appointment" button has style "destructive"', () => {
    const { getByText } = render(
      <BookingCard
        booking={makeBookingForCancel()}
        index={0}
        onCancel={jest.fn()}
      />,
    );
    fireEvent.press(getByText('Cancel Appointment'));
    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2] as any[];
    expect(buttons.find(b => b.text === 'Cancel Appointment').style).toBe(
      'destructive',
    );
  });

  it('confirming the destructive button calls onCancel with the booking id', () => {
    const onCancel = jest.fn();
    const { getByText } = render(
      <BookingCard
        booking={makeBookingForCancel()}
        index={0}
        onCancel={onCancel}
      />,
    );
    fireEvent.press(getByText('Cancel Appointment'));
    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2] as any[];
    buttons.find((b: any) => b.style === 'destructive').onPress();
    expect(onCancel).toHaveBeenCalledWith('booking_cancel_test');
  });

  it('"Keep it" does not call onCancel', () => {
    const onCancel = jest.fn();
    const { getByText } = render(
      <BookingCard
        booking={makeBookingForCancel()}
        index={0}
        onCancel={onCancel}
      />,
    );
    fireEvent.press(getByText('Cancel Appointment'));
    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2] as any[];
    // cancel-style button has no onPress — it simply dismisses the Alert
    const keepBtn = buttons.find((b: any) => b.text === 'Keep it');
    expect(keepBtn.onPress).toBeUndefined();
    expect(onCancel).not.toHaveBeenCalled();
  });
});
