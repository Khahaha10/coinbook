import { describe, expect, it } from 'vitest';
import {
  calculateSplit,
  itemLabel,
  SplitCalcError,
  type SplitCalcInput,
} from './split-calculator';

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
const shares = (input: SplitCalcInput) => calculateSplit(input).people.map((p) => p.share);

const base = { taxBps: 0, serviceBps: 0, discountType: 'NOMINAL' as const, discountValue: 0 };

const warungSate: SplitCalcInput = {
  people: [
    { key: 'me', name: 'Kamu' },
    { key: 'budi', name: 'Budi' },
    { key: 'sari', name: 'Sari' },
    { key: 'dimas', name: 'Dimas' },
  ],
  items: [
    { name: 'Sate ayam', price: 60000, qty: 1, personKeys: ['me', 'budi'] },
    { name: 'Sate kambing', price: 52000, qty: 1, personKeys: ['sari'] },
    { name: 'Es teh', price: 5000, qty: 3, personKeys: ['me', 'budi', 'dimas'] },
    { name: 'Es jeruk', price: 8000, qty: 1, personKeys: ['sari'] },
  ],
  taxBps: 1000,
  serviceBps: 2000,
  discountType: 'NOMINAL',
  discountValue: 0,
};

describe('calculateSplit', () => {
  it('splits Rp100.000 three ways as 33.334 + 33.333 + 33.333', () => {
    const result = shares({
      ...base,
      people: [
        { key: 'a', name: 'A' },
        { key: 'b', name: 'B' },
        { key: 'c', name: 'C' },
      ],
      items: [{ name: 'Makan', price: 100000, qty: 1, personKeys: ['a', 'b', 'c'] }],
    });
    expect(result).toEqual([33334, 33333, 33333]);
    expect(sum(result)).toBe(100000);
  });

  it('reproduces the Warung Sate sample exactly', () => {
    const result = calculateSplit(warungSate);
    expect(result.subtotal).toBe(135000);
    expect(result.taxAmount).toBe(13500);
    expect(result.serviceAmount).toBe(27000);
    expect(result.discountAmount).toBe(0);
    expect(result.grandTotal).toBe(175500);
    expect(result.people.map((p) => p.share)).toEqual([45500, 45500, 78000, 6500]);
    expect(sum(result.people.map((p) => p.share))).toBe(175500);
  });

  it('returns subtotal, extras and labelled lines per person', () => {
    const [me, , sari, dimas] = calculateSplit(warungSate).people;
    expect(me).toMatchObject({ key: 'me', subtotal: 35000, extras: 10500 });
    expect(me?.lines).toEqual([
      { label: 'Sate ayam ½', amount: 30000 },
      { label: 'Es teh', amount: 5000 },
    ]);
    expect(sari).toMatchObject({ subtotal: 60000, extras: 18000 });
    expect(sari?.lines).toEqual([
      { label: 'Sate kambing', amount: 52000 },
      { label: 'Es jeruk', amount: 8000 },
    ]);
    expect(dimas).toMatchObject({ subtotal: 5000, extras: 1500 });
  });

  it('applies a percent discount in basis points', () => {
    const result = calculateSplit({
      ...base,
      discountType: 'PERCENT',
      discountValue: 1000,
      people: [
        { key: 'a', name: 'A' },
        { key: 'b', name: 'B' },
      ],
      items: [{ name: 'Pizza', price: 100000, qty: 1, personKeys: ['a', 'b'] }],
    });
    expect(result.discountAmount).toBe(10000);
    expect(result.grandTotal).toBe(90000);
    expect(result.people.map((p) => p.share)).toEqual([45000, 45000]);
    expect(result.people.map((p) => p.extras)).toEqual([-5000, -5000]);
  });

  it('spreads a nominal discount proportionally to what each person ordered', () => {
    const result = calculateSplit({
      ...base,
      discountValue: 10000,
      people: [
        { key: 'a', name: 'A' },
        { key: 'b', name: 'B' },
        { key: 'c', name: 'C' },
      ],
      items: [
        { name: 'Steak', price: 50000, qty: 1, personKeys: ['a'] },
        { name: 'Pasta', price: 50000, qty: 1, personKeys: ['b', 'c'] },
      ],
    });
    expect(result.grandTotal).toBe(90000);
    expect(result.people.map((p) => p.share)).toEqual([45000, 22500, 22500]);
  });

  it('puts everything on one person when they ordered everything', () => {
    const result = calculateSplit({
      ...warungSate,
      items: warungSate.items.map((it) => ({ ...it, personKeys: ['me'] })),
    });
    expect(result.people.map((p) => p.share)).toEqual([175500, 0, 0, 0]);
    expect(result.people[0]?.lines.map((l) => l.label)).toEqual([
      'Sate ayam',
      'Sate kambing',
      'Es teh ×3',
      'Es jeruk',
    ]);
  });

  it('shares one item between 7 people without losing a rupiah', () => {
    const people = Array.from({ length: 7 }, (_, i) => ({ key: `p${i}`, name: `P${i}` }));
    const result = calculateSplit({
      ...base,
      people,
      items: [{ name: 'Pizza', price: 100000, qty: 1, personKeys: people.map((p) => p.key) }],
    });
    const values = result.people.map((p) => p.share);
    expect(sum(values)).toBe(100000);
    expect(values).toEqual([14286, 14286, 14286, 14286, 14286, 14285, 14285]);
    expect(result.people[0]?.lines).toEqual([{ label: 'Pizza 1/7', amount: 14286 }]);
  });

  it('keeps shares summing exactly to the grand total with tax and service', () => {
    const people = Array.from({ length: 3 }, (_, i) => ({ key: `p${i}`, name: `P${i}` }));
    const result = calculateSplit({
      ...base,
      taxBps: 1100,
      serviceBps: 500,
      people,
      items: [{ name: 'Kopi', price: 33333, qty: 1, personKeys: ['p0', 'p1', 'p2'] }],
    });
    expect(sum(result.people.map((p) => p.share))).toBe(result.grandTotal);
    expect(result.grandTotal).toBe(38666);
  });

  it('rejects an item with nobody assigned', () => {
    expect(() =>
      calculateSplit({
        ...base,
        people: [{ key: 'a', name: 'A' }],
        items: [{ name: 'Kopi', price: 1000, qty: 1, personKeys: [] }],
      }),
    ).toThrow(expect.objectContaining({ code: 'ITEM_UNASSIGNED' }));
  });

  it('rejects unknown people, bad numbers and a discount larger than the bill', () => {
    const people = [{ key: 'a', name: 'A' }];
    const run = (input: Partial<SplitCalcInput>) => () =>
      calculateSplit({
        ...base,
        people,
        items: [{ name: 'Kopi', price: 1000, qty: 1, personKeys: ['a'] }],
        ...input,
      });
    expect(run({ items: [{ name: 'Kopi', price: 1000, qty: 1, personKeys: ['x'] }] })).toThrow(
      expect.objectContaining({ code: 'UNKNOWN_PERSON' }),
    );
    expect(run({ items: [{ name: 'Kopi', price: 10.5, qty: 1, personKeys: ['a'] }] })).toThrow(
      expect.objectContaining({ code: 'INVALID_NUMBER' }),
    );
    expect(run({ items: [{ name: 'Kopi', price: 1000, qty: 0, personKeys: ['a'] }] })).toThrow(
      expect.objectContaining({ code: 'INVALID_NUMBER' }),
    );
    expect(run({ discountValue: 2000 })).toThrow(
      expect.objectContaining({ code: 'NEGATIVE_TOTAL' }),
    );
    expect(run({ discountValue: 2000 })).toThrow(SplitCalcError);
  });
});

describe('itemLabel', () => {
  it('labels whole and fractional portions', () => {
    expect(itemLabel('Es teh', 1, 1)).toBe('Es teh');
    expect(itemLabel('Es teh', 3, 3)).toBe('Es teh');
    expect(itemLabel('Es teh', 2, 1)).toBe('Es teh ×2');
    expect(itemLabel('Sate ayam', 1, 2)).toBe('Sate ayam ½');
    expect(itemLabel('Sate ayam', 1, 3)).toBe('Sate ayam ⅓');
    expect(itemLabel('Sate ayam', 2, 3)).toBe('Sate ayam ⅔');
    expect(itemLabel('Sate ayam', 3, 4)).toBe('Sate ayam ¾');
    expect(itemLabel('Sate ayam', 2, 4)).toBe('Sate ayam ½');
  });
});
