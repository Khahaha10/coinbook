import { describe, expect, it } from 'vitest';
import { formatRupiah, MINUS, parseRupiahInput } from './money';

describe('formatRupiah', () => {
  it('formats zero', () => {
    expect(formatRupiah(0)).toBe('Rp0');
    expect(formatRupiah(0, { sign: true })).toBe('+Rp0');
  });

  it('formats positive amounts with dot thousands separators', () => {
    expect(formatRupiah(4250000)).toBe('Rp4.250.000');
    expect(formatRupiah(999)).toBe('Rp999');
    expect(formatRupiah(1000)).toBe('Rp1.000');
  });

  it('uses U+2212 for negatives, never a hyphen', () => {
    expect(formatRupiah(-35000)).toBe(`${MINUS}Rp35.000`);
    expect(formatRupiah(-35000)).not.toContain('-');
    expect(MINUS.codePointAt(0)).toBe(0x2212);
  });

  it('treats negative zero as negative', () => {
    expect(formatRupiah(-0)).toBe(`${MINUS}Rp0`);
  });

  it('adds a plus sign only when asked', () => {
    expect(formatRupiah(45500, { sign: true })).toBe('+Rp45.500');
    expect(formatRupiah(-45500, { sign: true })).toBe(`${MINUS}Rp45.500`);
  });

  it('drops the prefix for ledger rows', () => {
    expect(formatRupiah(-35000, { prefix: false })).toBe(`${MINUS}35.000`);
    expect(formatRupiah(45500, { prefix: false, sign: true })).toBe('+45.500');
  });

  it('formats large numbers', () => {
    expect(formatRupiah(999_999_999_999)).toBe('Rp999.999.999.999');
    expect(formatRupiah(Number.MAX_SAFE_INTEGER)).toBe('Rp9.007.199.254.740.991');
  });

  it('rejects floats and unsafe integers', () => {
    expect(() => formatRupiah(10.5)).toThrow(RangeError);
    expect(() => formatRupiah(Number.MAX_SAFE_INTEGER + 1)).toThrow(RangeError);
    expect(() => formatRupiah(Number.NaN)).toThrow(RangeError);
  });
});

describe('parseRupiahInput', () => {
  it('keeps digits only', () => {
    expect(parseRupiahInput('25.000')).toBe(25000);
    expect(parseRupiahInput('Rp 1.234.567')).toBe(1234567);
    expect(parseRupiahInput('0')).toBe(0);
  });

  it('returns null for empty input', () => {
    expect(parseRupiahInput('')).toBeNull();
    expect(parseRupiahInput('Rp')).toBeNull();
  });

  it('ignores a minus sign because amounts are entered as positive numbers', () => {
    expect(parseRupiahInput('-5000')).toBe(5000);
  });

  it('returns null when the number is not a safe integer', () => {
    expect(parseRupiahInput('99999999999999999999')).toBeNull();
  });
});
