import { describe, expect, it } from 'vitest';
import {
  addDays,
  daysInMonth,
  diffDays,
  fromDateOnly,
  isDateOnly,
  isMonthKey,
  monthOf,
  monthRange,
  shiftMonth,
  todayInJakarta,
} from './dates';

describe('todayInJakarta', () => {
  it('is still the previous day at 16:59 UTC', () => {
    expect(todayInJakarta(new Date('2026-11-17T16:59:59.999Z'))).toBe('2026-11-17');
  });

  it('is already the next day at 17:00 UTC', () => {
    expect(todayInJakarta(new Date('2026-11-17T17:00:00.000Z'))).toBe('2026-11-18');
  });

  it('rolls over months and years at Jakarta midnight', () => {
    expect(todayInJakarta(new Date('2026-12-31T17:00:00.000Z'))).toBe('2027-01-01');
    expect(todayInJakarta(new Date('2026-12-31T16:59:00.000Z'))).toBe('2026-12-31');
  });
});

describe('date-only helpers', () => {
  it('validates real calendar dates', () => {
    expect(isDateOnly('2028-02-29')).toBe(true);
    expect(isDateOnly('2026-02-29')).toBe(false);
    expect(isDateOnly('2026-13-01')).toBe(false);
    expect(isDateOnly('18/11/2026')).toBe(false);
    expect(() => fromDateOnly('2026-02-30')).toThrow(RangeError);
  });

  it('adds and diffs days across month ends', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(diffDays('2026-11-18', '2026-11-16')).toBe(-2);
    expect(diffDays('2026-11-18', '2026-12-17')).toBe(29);
  });

  it('handles months', () => {
    expect(monthOf('2026-11-18')).toBe('2026-11');
    expect(isMonthKey('2026-11')).toBe(true);
    expect(isMonthKey('2026-00')).toBe(false);
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-11', 2)).toBe('2027-01');
    expect(daysInMonth(2028, 2)).toBe(29);
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(monthRange('2026-11')).toEqual({ from: '2026-11-01', to: '2026-11-30' });
    expect(monthRange('2028-02')).toEqual({ from: '2028-02-01', to: '2028-02-29' });
  });
});
