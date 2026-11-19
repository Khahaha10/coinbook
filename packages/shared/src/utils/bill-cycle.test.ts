import { describe, expect, it } from 'vitest';
import { billStatus, monthlyEquivalent, nextDueDate } from './bill-cycle';

describe('nextDueDate', () => {
  it('moves the 31st into February, then back to the 31st', () => {
    expect(nextDueDate('2026-01-31', 'MONTHLY', 31)).toBe('2026-02-28');
    expect(nextDueDate('2026-02-28', 'MONTHLY', 31)).toBe('2026-03-31');
  });

  it('uses 29 Feb in a leap year', () => {
    expect(nextDueDate('2028-01-31', 'MONTHLY', 31)).toBe('2028-02-29');
    expect(nextDueDate('2028-01-30', 'MONTHLY', 30)).toBe('2028-02-29');
  });

  it('moves a 31st anchor to 30 Apr and back to 31 May', () => {
    expect(nextDueDate('2026-03-31', 'MONTHLY', 31)).toBe('2026-04-30');
    expect(nextDueDate('2026-04-30', 'MONTHLY', 31)).toBe('2026-05-31');
  });

  it('rolls 15 Dec over to 15 Jan of the next year', () => {
    expect(nextDueDate('2026-12-15', 'MONTHLY', 15)).toBe('2027-01-15');
  });

  it('keeps yearly bills on the same month and day', () => {
    expect(nextDueDate('2026-11-21', 'YEARLY', 21)).toBe('2027-11-21');
  });

  it('moves a yearly 29 Feb to 28 Feb in non-leap years and back in leap years', () => {
    expect(nextDueDate('2028-02-29', 'YEARLY', 29)).toBe('2029-02-28');
    expect(nextDueDate('2031-02-28', 'YEARLY', 29)).toBe('2032-02-29');
  });

  it('rejects invalid anchor days', () => {
    expect(() => nextDueDate('2026-11-01', 'MONTHLY', 0)).toThrow(RangeError);
    expect(() => nextDueDate('2026-11-01', 'MONTHLY', 32)).toThrow(RangeError);
    expect(() => nextDueDate('2026-11-01', 'MONTHLY', 1.5)).toThrow(RangeError);
  });
});

describe('billStatus', () => {
  const today = '2026-11-18';

  it('is OVERDUE before the due date', () => {
    expect(billStatus({ nextDueDate: '2026-11-16', lastPaidDueDate: null, today })).toEqual({
      status: 'OVERDUE',
      daysUntilDue: -2,
    });
  });

  it('is DUE_SOON from day 0 to day 7', () => {
    expect(billStatus({ nextDueDate: today, lastPaidDueDate: null, today })).toEqual({
      status: 'DUE_SOON',
      daysUntilDue: 0,
    });
    expect(billStatus({ nextDueDate: '2026-11-19', lastPaidDueDate: null, today }).status).toBe(
      'DUE_SOON',
    );
    expect(billStatus({ nextDueDate: '2026-11-25', lastPaidDueDate: null, today })).toEqual({
      status: 'DUE_SOON',
      daysUntilDue: 7,
    });
  });

  it('is UPCOMING after 7 days', () => {
    expect(billStatus({ nextDueDate: '2026-11-26', lastPaidDueDate: null, today })).toEqual({
      status: 'UPCOMING',
      daysUntilDue: 8,
    });
  });

  it('is PAID when paid this month and the next due date is in a later month', () => {
    expect(
      billStatus({ nextDueDate: '2026-12-17', lastPaidDueDate: '2026-11-17', today }),
    ).toEqual({ status: 'PAID', daysUntilDue: 29 });
  });

  it('is not PAID when the last payment was for an earlier month', () => {
    expect(
      billStatus({ nextDueDate: '2026-11-21', lastPaidDueDate: '2026-10-21', today }).status,
    ).toBe('DUE_SOON');
  });
});

describe('monthlyEquivalent', () => {
  it('keeps monthly amounts and rounds yearly ones to a monthly figure', () => {
    expect(monthlyEquivalent(54990, 'MONTHLY')).toBe(54990);
    expect(monthlyEquivalent(1200000, 'YEARLY')).toBe(100000);
    expect(monthlyEquivalent(59000, 'YEARLY')).toBe(4917);
  });
});
