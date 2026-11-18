import type { DiscountType } from '../types/enums';
export interface SplitPersonInput {
  key: string;
  name: string;
}
export interface SplitItemInput {
  name: string;
  price: number;
  qty: number;
  personKeys: readonly string[];
}
export interface SplitCalcInput {
  people: readonly SplitPersonInput[];
  items: readonly SplitItemInput[];
  taxBps: number;
  serviceBps: number;
  discountType: DiscountType;
  discountValue: number;
}
export interface SplitLine {
  label: string;
  amount: number;
}
export interface SplitPersonResult {
  key: string;
  share: number;
  subtotal: number;
  extras: number;
  lines: SplitLine[];
}
export interface SplitCalcResult {
  subtotal: number;
  taxAmount: number;
  serviceAmount: number;
  discountAmount: number;
  grandTotal: number;
  people: SplitPersonResult[];
}
export type SplitCalcErrorCode =
  'ITEM_UNASSIGNED' | 'UNKNOWN_PERSON' | 'INVALID_NUMBER' | 'NEGATIVE_TOTAL';
export class SplitCalcError extends Error {
  constructor(
    readonly code: SplitCalcErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'SplitCalcError';
  }
}
const BPS = 10000n;
const FRACTIONS: Record<string, string> = {
  '1/2': '½',
  '1/3': '⅓',
  '1/4': '¼',
  '2/3': '⅔',
  '3/4': '¾',
};
function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}
function lcm(a: number, b: number): number {
  return (a / gcd(a, b)) * b;
}
function divRoundHalfUp(a: bigint, b: bigint): bigint {
  return (2n * a + b) / (2n * b);
}
function assertNonNegativeInt(n: number, what: string): void {
  if (!Number.isSafeInteger(n) || n < 0) {
    throw new SplitCalcError('INVALID_NUMBER', `${what} must be a non-negative integer, got ${n}`);
  }
}
export function itemLabel(name: string, qty: number, sharers: number): string {
  if (qty % sharers === 0) {
    const k = qty / sharers;
    return k === 1 ? name : `${name} ×${k}`;
  }
  const g = gcd(qty, sharers);
  const key = `${qty / g}/${sharers / g}`;
  return `${name} ${FRACTIONS[key] ?? key}`;
}
export function calculateSplit(input: SplitCalcInput): SplitCalcResult {
  const { people, items, taxBps, serviceBps, discountType, discountValue } = input;
  assertNonNegativeInt(taxBps, 'taxBps');
  assertNonNegativeInt(serviceBps, 'serviceBps');
  assertNonNegativeInt(discountValue, 'discountValue');
  const index = new Map(people.map((p, i) => [p.key, i]));
  items.forEach((it) => {
    assertNonNegativeInt(it.price, `price of ${it.name}`);
    if (!Number.isSafeInteger(it.qty) || it.qty < 1) {
      throw new SplitCalcError('INVALID_NUMBER', `qty of ${it.name} must be ≥ 1`);
    }
    if (it.personKeys.length === 0) {
      throw new SplitCalcError('ITEM_UNASSIGNED', `${it.name} has nobody assigned`);
    }
    it.personKeys.forEach((k) => {
      if (!index.has(k)) throw new SplitCalcError('UNKNOWN_PERSON', `Unknown person ${k}`);
    });
  });
  const L = items.reduce((acc, it) => lcm(acc, new Set(it.personKeys).size), 1);
  const bigL = BigInt(L);
  const weights = people.map(() => 0n);
  const lines: SplitLine[][] = people.map(() => []);
  let S = 0n;
  items.forEach((it) => {
    const sharers = [...new Set(it.personKeys)];
    const n = BigInt(sharers.length);
    const total = BigInt(it.price) * BigInt(it.qty);
    S += total;
    const label = itemLabel(it.name, it.qty, sharers.length);
    const amount = Number(divRoundHalfUp(total, n));
    sharers.forEach((k) => {
      const i = index.get(k) as number;
      weights[i] = (weights[i] as bigint) + (total * bigL) / n;
      (lines[i] as SplitLine[]).push({ label, amount });
    });
  });
  const discount10k =
    discountType === 'PERCENT' ? S * BigInt(discountValue) : BigInt(discountValue) * BPS;
  const total10k = S * (BPS + BigInt(taxBps) + BigInt(serviceBps)) - discount10k;
  if (total10k < 0n) {
    throw new SplitCalcError('NEGATIVE_TOTAL', 'Discount is larger than the bill');
  }
  const G = divRoundHalfUp(total10k, BPS);
  const W = S * bigL;
  const floors = weights.map((w) => (W === 0n ? 0n : (w * G) / W));
  const remainders = weights.map((w) => (W === 0n ? 0n : (w * G) % W));
  let leftover = G - floors.reduce((a, b) => a + b, 0n);
  const order = people
    .map((_, i) => i)
    .sort((a, b) => {
      const ra = remainders[a] as bigint;
      const rb = remainders[b] as bigint;
      return ra === rb ? a - b : rb > ra ? 1 : -1;
    });
  for (const i of order) {
    if (leftover === 0n) break;
    floors[i] = (floors[i] as bigint) + 1n;
    leftover -= 1n;
  }
  return {
    subtotal: Number(S),
    taxAmount: Number(divRoundHalfUp(S * BigInt(taxBps), BPS)),
    serviceAmount: Number(divRoundHalfUp(S * BigInt(serviceBps), BPS)),
    discountAmount: Number(divRoundHalfUp(discount10k, BPS)),
    grandTotal: Number(G),
    people: people.map((p, i) => {
      const share = Number(floors[i]);
      const subtotal = Number(divRoundHalfUp(weights[i] as bigint, bigL));
      return {
        key: p.key,
        share,
        subtotal,
        extras: share - subtotal,
        lines: lines[i] as SplitLine[],
      };
    }),
  };
}
