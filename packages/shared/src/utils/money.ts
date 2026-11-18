export const MINUS = '−';
export interface FormatRupiahOptions {
  sign?: boolean;
  prefix?: boolean;
}
function assertRupiah(n: number): void {
  if (!Number.isSafeInteger(n)) {
    throw new RangeError(`Rupiah amounts must be safe integers, got ${n}`);
  }
}
function groupThousands(abs: number): string {
  return String(abs).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
export function formatRupiah(n: number, opts: FormatRupiahOptions = {}): string {
  assertRupiah(n);
  const { sign = false, prefix = true } = opts;
  const negative = n < 0 || Object.is(n, -0);
  const signText = negative ? MINUS : sign ? '+' : '';
  return `${signText}${prefix ? 'Rp' : ''}${groupThousands(Math.abs(n))}`;
}
export function parseRupiahInput(input: string): number | null {
  const digits = input.replace(/\D/g, '');
  if (digits === '') return null;
  const n = Number(digits);
  return Number.isSafeInteger(n) ? n : null;
}
