import {
  parseTimeToMinutes,
  minutesToDisplay,
  minutesTo24h,
  generateSlots,
  getAvatarColor,
  getInitials,
  buildDoctorId,
  processDoctors,
  getNextDateForDay,
  formatDateShort,
  formatBookingDate,
  generateBookingId,
  DAY_ORDER,
} from '../../src/utils/index';
import { DoctorAvailabilityRaw, DayOfWeek } from '../../src/types';

// ── parseTimeToMinutes ──────────────────────────────────────────────────────
describe('parseTimeToMinutes', () => {
  it('parses 9:00AM to 540', () => expect(parseTimeToMinutes('9:00AM')).toBe(540));
  it('parses 12:00PM to 720', () => expect(parseTimeToMinutes('12:00PM')).toBe(720));
  it('parses 12:00AM to 0 midnight', () => expect(parseTimeToMinutes('12:00AM')).toBe(0));
  it('parses 1:00PM to 780', () => expect(parseTimeToMinutes('1:00PM')).toBe(780));
  it('parses 11:59PM to 1439', () => expect(parseTimeToMinutes('11:59PM')).toBe(1439));
  it('parses 6:30AM to 390', () => expect(parseTimeToMinutes('6:30AM')).toBe(390));
  it('handles leading whitespace', () => expect(parseTimeToMinutes(' 9:00AM')).toBe(540));
  it('handles trailing whitespace', () => expect(parseTimeToMinutes('9:00AM ')).toBe(540));
  it('handles lowercase am', () => expect(parseTimeToMinutes('9:00am')).toBe(540));
  it('handles mixed case', () => expect(parseTimeToMinutes('9:00Am')).toBe(540));
  it('parses 10:30PM to 1350', () => expect(parseTimeToMinutes('10:30PM')).toBe(1350));
  it('parses 5:00PM to 1020', () => expect(parseTimeToMinutes('5:00PM')).toBe(1020));
  it('parses 11:30PM to 1410', () => expect(parseTimeToMinutes('11:30PM')).toBe(1410));
  // Negative cases
  it('throws on empty string', () => expect(() => parseTimeToMinutes('')).toThrow());
  it('throws on 900AM missing colon', () => expect(() => parseTimeToMinutes('900AM')).toThrow());
  it('throws on 9AM no minutes', () => expect(() => parseTimeToMinutes('9AM')).toThrow());
  it('throws on gibberish', () => expect(() => parseTimeToMinutes('abc')).toThrow());
  it('throws on missing period', () => expect(() => parseTimeToMinutes('9:00')).toThrow());
  it('throws on out-of-range hours', () => expect(() => parseTimeToMinutes('25:00PM')).toThrow());
  it('throws on out-of-range minutes', () => expect(() => parseTimeToMinutes('9:75AM')).toThrow());
});

// ── minutesToDisplay ────────────────────────────────────────────────────────
describe('minutesToDisplay', () => {
  it('0 to 12:00 AM', () => expect(minutesToDisplay(0)).toBe('12:00 AM'));
  it('540 to 9:00 AM', () => expect(minutesToDisplay(540)).toBe('9:00 AM'));
  it('720 to 12:00 PM', () => expect(minutesToDisplay(720)).toBe('12:00 PM'));
  it('780 to 1:00 PM', () => expect(minutesToDisplay(780)).toBe('1:00 PM'));
  it('1020 to 5:00 PM', () => expect(minutesToDisplay(1020)).toBe('5:00 PM'));
  it('1350 to 10:30 PM', () => expect(minutesToDisplay(1350)).toBe('10:30 PM'));
  it('1439 to 11:59 PM', () => expect(minutesToDisplay(1439)).toBe('11:59 PM'));
  it('pads minutes under 10', () => expect(minutesToDisplay(541)).toBe('9:01 AM'));
  it('719 to 11:59 AM', () => expect(minutesToDisplay(719)).toBe('11:59 AM'));
  it('1 to 12:01 AM', () => expect(minutesToDisplay(1)).toBe('12:01 AM'));
});

// ── minutesTo24h ────────────────────────────────────────────────────────────
describe('minutesTo24h', () => {
  it('0 to 00:00', () => expect(minutesTo24h(0)).toBe('00:00'));
  it('540 to 09:00', () => expect(minutesTo24h(540)).toBe('09:00'));
  it('750 to 12:30', () => expect(minutesTo24h(750)).toBe('12:30'));
  it('1020 to 17:00', () => expect(minutesTo24h(1020)).toBe('17:00'));
  it('1439 to 23:59', () => expect(minutesTo24h(1439)).toBe('23:59'));
  it('pads hours under 10', () => expect(minutesTo24h(60)).toBe('01:00'));
  it('pads minutes under 10', () => expect(minutesTo24h(9)).toBe('00:09'));
});

// ── generateSlots ───────────────────────────────────────────────────────────
describe('generateSlots', () => {
  const doc = 'dr_smith';
  const day: DayOfWeek = 'Monday';

  it('generates 4 slots for 9AM to 11AM', () =>
    expect(generateSlots(doc, day, '9:00AM', '11:00AM').length).toBe(4));
  it('slot id has correct format', () =>
    expect(generateSlots(doc, day, '9:00AM', '9:30AM')[0].id).toBe('dr_smith_Monday_09:00'));
  it('displayStart is correct', () =>
    expect(generateSlots(doc, day, '9:00AM', '9:30AM')[0].displayStart).toBe('9:00 AM'));
  it('displayEnd is correct', () =>
    expect(generateSlots(doc, day, '9:00AM', '9:30AM')[0].displayEnd).toBe('9:30 AM'));
  it('startTime is in 24h format', () =>
    expect(generateSlots(doc, day, '1:00PM', '1:30PM')[0].startTime).toBe('13:00'));
  it('endTime is in 24h format', () =>
    expect(generateSlots(doc, day, '1:00PM', '1:30PM')[0].endTime).toBe('13:30'));
  it('returns empty if window under 30 min', () =>
    expect(generateSlots(doc, day, '9:00AM', '9:29AM').length).toBe(0));
  it('returns empty if start after end', () =>
    expect(generateSlots(doc, day, '10:00AM', '9:00AM').length).toBe(0));
  it('returns empty if start equals end', () =>
    expect(generateSlots(doc, day, '9:00AM', '9:00AM').length).toBe(0));
  it('returns empty on invalid start', () =>
    expect(generateSlots(doc, day, 'bad', '10:00AM').length).toBe(0));
  it('returns empty on invalid end', () =>
    expect(generateSlots(doc, day, '9:00AM', 'bad').length).toBe(0));
  it('assigns doctorId to every slot', () =>
    generateSlots('dr_jones', day, '9:00AM', '10:00AM').forEach(s =>
      expect(s.doctorId).toBe('dr_jones')));
  it('assigns dayOfWeek to every slot', () =>
    generateSlots(doc, 'Friday', '9:00AM', '10:00AM').forEach(s =>
      expect(s.dayOfWeek).toBe('Friday')));
  it('PM window 4 slots 3PM to 5PM', () => {
    const slots = generateSlots(doc, day, '3:00PM', '5:00PM');
    expect(slots.length).toBe(4);
    expect(slots[0].startTime).toBe('15:00');
    expect(slots[3].endTime).toBe('17:00');
  });
  it('exact 30-min window produces 1 slot', () =>
    expect(generateSlots(doc, day, '9:00AM', '9:30AM').length).toBe(1));
  it('full day 8AM to 6PM produces 20 slots', () =>
    expect(generateSlots(doc, day, '8:00AM', '6:00PM').length).toBe(20));
  it('9AM to 10AM produces 2 slots', () =>
    expect(generateSlots(doc, day, '9:00AM', '10:00AM').length).toBe(2));
});

// ── getAvatarColor ──────────────────────────────────────────────────────────
describe('getAvatarColor', () => {
  it('returns a string', () => expect(typeof getAvatarColor('Dr. Smith')).toBe('string'));
  it('is consistent for same name', () =>
    expect(getAvatarColor('Dr. Smith')).toBe(getAvatarColor('Dr. Smith')));
  it('returns different colors for different names', () => {
    const colors = new Set(
      ['Dr. Smith', 'Dr. Jones', 'Dr. Brown', 'Dr. Wilson', 'Dr. Taylor'].map(getAvatarColor),
    );
    expect(colors.size).toBeGreaterThan(1);
  });
  it('handles empty string', () => expect(() => getAvatarColor('')).not.toThrow());
  it('handles single character', () => expect(() => getAvatarColor('A')).not.toThrow());
});

// ── getInitials ─────────────────────────────────────────────────────────────
describe('getInitials', () => {
  it('first and last initials', () => expect(getInitials('John Smith')).toBe('JS'));
  it('strips Dr. prefix', () => expect(getInitials('Dr. John Smith')).toBe('JS'));
  it('strips lowercase dr. prefix', () => expect(getInitials('dr. Jane Doe')).toBe('JD'));
  it('single name returns first letter', () => expect(getInitials('Madonna')).toBe('M'));
  it('three words uses first and last', () => expect(getInitials('Mary Ann Jones')).toBe('MJ'));
  it('empty string returns question mark', () => expect(getInitials('')).toBe('?'));
  it('returns uppercase', () => expect(getInitials('alice bob')).toBe('AB'));
  it('Dr prefix with one name', () => expect(getInitials('Dr. Alice')).toBe('A'));
  it('handles extra spaces', () => expect(getInitials('  John  Smith  ')).toBe('JS'));
});

// ── buildDoctorId ───────────────────────────────────────────────────────────
describe('buildDoctorId', () => {
  it('lowercases and replaces spaces with underscores', () =>
    expect(buildDoctorId('John Smith')).toBe('john_smith'));
  it('no leading or trailing underscores', () =>
    expect(buildDoctorId('Smith')).not.toMatch(/^_|_$/));
  it('handles special characters to alphanumeric only', () =>
    expect(buildDoctorId("Dr. O'Brien")).toMatch(/^[a-z0-9_]+$/));
  it('consistent for same name', () =>
    expect(buildDoctorId('John Smith')).toBe(buildDoctorId('John Smith')));
  it('returns string for empty input', () =>
    expect(typeof buildDoctorId('')).toBe('string'));
});

// ── processDoctors ──────────────────────────────────────────────────────────
describe('processDoctors', () => {
  const makeEntry = (o: Partial<DoctorAvailabilityRaw> = {}): DoctorAvailabilityRaw => ({
    name: 'Dr. Alice Smith',
    timezone: 'Australia/Sydney',
    day_of_week: 'Monday',
    available_at: '9:00AM',
    available_until: '12:00PM',
    ...o,
  });

  it('empty array input returns empty array', () => expect(processDoctors([])).toEqual([]));
  it('null input returns empty array', () => expect(processDoctors(null as any)).toEqual([]));
  it('undefined input returns empty array', () => expect(processDoctors(undefined as any)).toEqual([]));
  it('processes single doctor with one day', () => {
    const result = processDoctors([makeEntry()]);
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('Dr. Alice Smith');
  });
  it('9AM to 12PM produces 6 slots', () =>
    expect(processDoctors([makeEntry()])[0].schedule[0].slots.length).toBe(6));
  it('groups multiple days for same doctor', () => {
    const result = processDoctors([
      makeEntry({ day_of_week: 'Monday' }),
      makeEntry({ day_of_week: 'Wednesday' }),
      makeEntry({ day_of_week: 'Friday' }),
    ]);
    expect(result.length).toBe(1);
    expect(result[0].schedule.length).toBe(3);
  });
  it('merges multiple windows per day', () => {
    const result = processDoctors([
      makeEntry({ available_at: '9:00AM', available_until: '12:00PM' }),
      makeEntry({ available_at: '3:00PM', available_until: '5:00PM' }),
    ]);
    expect(result[0].schedule[0].slots.length).toBeGreaterThan(6);
  });
  it('deduplicates identical slot windows', () => {
    const result = processDoctors([
      makeEntry({ available_at: '9:00AM', available_until: '10:00AM' }),
      makeEntry({ available_at: '9:00AM', available_until: '10:00AM' }),
    ]);
    expect(result[0].schedule[0].slots.length).toBe(2);
  });
  it('sorts days in weekly order', () => {
    const result = processDoctors([
      makeEntry({ day_of_week: 'Friday' }),
      makeEntry({ day_of_week: 'Monday' }),
      makeEntry({ day_of_week: 'Wednesday' }),
    ]);
    expect(result[0].schedule.map(s => s.day)).toEqual(['Monday', 'Wednesday', 'Friday']);
  });
  it('sorts doctors alphabetically', () => {
    const result = processDoctors([
      makeEntry({ name: 'Dr. Zara' }),
      makeEntry({ name: 'Dr. Alice' }),
      makeEntry({ name: 'Dr. Mike' }),
    ]);
    expect(result.map(d => d.name)).toEqual(['Dr. Alice', 'Dr. Mike', 'Dr. Zara']);
  });
  it('skips entry with empty name', () => {
    expect(processDoctors([makeEntry(), { ...makeEntry(), name: '' }]).length).toBe(1);
  });
  it('skips entry with empty day_of_week', () => {
    expect(processDoctors([makeEntry(), { ...makeEntry(), day_of_week: '' }]).length).toBe(1);
  });
  it('skips entry with empty available_at', () => {
    expect(processDoctors([makeEntry(), { ...makeEntry(), available_at: '' }]).length).toBe(1);
  });
  it('attaches avatarColor and initials', () => {
    const result = processDoctors([makeEntry()]);
    expect(result[0].avatarColor).toBeTruthy();
    expect(result[0].initials).toBeTruthy();
  });
  it('invalid time range produces no schedule entries', () =>
    expect(
      processDoctors([makeEntry({ available_at: '5:00PM', available_until: '9:00AM' })])[0].schedule.length,
    ).toBe(0));
  it('slots are sorted by startTime within each day', () => {
    const result = processDoctors([
      makeEntry({ available_at: '3:00PM', available_until: '4:00PM' }),
      makeEntry({ available_at: '9:00AM', available_until: '10:00AM' }),
    ]);
    const slots = result[0].schedule[0].slots;
    expect(slots[0].startTime < slots[slots.length - 1].startTime).toBe(true);
  });
  it('null entry in array does not throw', () =>
    expect(() => processDoctors([makeEntry(), null as any])).not.toThrow());
  it('entry with null name does not throw', () =>
    expect(() =>
      processDoctors([
        { name: null, timezone: 'UTC', day_of_week: 'Monday', available_at: '9:00AM', available_until: '10:00AM' } as any,
      ]),
    ).not.toThrow());
});

// ── getNextDateForDay ───────────────────────────────────────────────────────
describe('getNextDateForDay', () => {
  it('returns a Date object', () =>
    expect(getNextDateForDay('Monday')).toBeInstanceOf(Date));
  it('returns date within next 7 days', () => {
    const result = getNextDateForDay('Wednesday');
    const diff = (result.getTime() - Date.now()) / 86400000;
    expect(diff).toBeGreaterThanOrEqual(0);
    expect(diff).toBeLessThan(7);
  });
  it('does not throw for any day of week', () =>
    DAY_ORDER.forEach(d => expect(() => getNextDateForDay(d)).not.toThrow()));
});

// ── formatDateShort ─────────────────────────────────────────────────────────
describe('formatDateShort', () => {
  it('returns a non-empty string', () => {
    const result = formatDateShort(new Date('2024-01-15'));
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

// ── formatBookingDate ───────────────────────────────────────────────────────
describe('formatBookingDate', () => {
  it('formats a valid ISO string', () => {
    const result = formatBookingDate('2024-03-15T09:00:00.000Z');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
  it('returns string for invalid input', () =>
    expect(typeof formatBookingDate('not-a-date')).toBe('string'));
  it('returns string for empty input', () =>
    expect(typeof formatBookingDate('')).toBe('string'));
});

// ── generateBookingId ───────────────────────────────────────────────────────
describe('generateBookingId', () => {
  it('returns a string', () => expect(typeof generateBookingId()).toBe('string'));
  it('starts with booking_', () => expect(generateBookingId()).toMatch(/^booking_/));
  it('generates 100 unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, generateBookingId));
    expect(ids.size).toBe(100);
  });
});

// ── DAY_ORDER ───────────────────────────────────────────────────────────────
describe('DAY_ORDER', () => {
  it('has 7 days', () => expect(DAY_ORDER.length).toBe(7));
  it('starts with Monday', () => expect(DAY_ORDER[0]).toBe('Monday'));
  it('ends with Sunday', () => expect(DAY_ORDER[6]).toBe('Sunday'));
});