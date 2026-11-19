import {
  calculateSplit,
  type CreateSplitInput,
  type DiscountType,
  type SplitCalcResult,
} from '@coinbook/shared';

export const OWNER_KEY = 'me';
export const OWNER_NAME = 'Kamu';
export const STEP_LABELS = ['Info', 'Peserta', 'Item', 'Biaya tambahan'] as const;

export interface WizardPerson {
  key: string;
  name: string;
}

export interface WizardItem {
  key: string;
  name: string;
  price: number | null;
  qty: number;
  personKeys: string[];
}

export interface WizardState {
  step: number;
  seq: number;
  title: string;
  date: string;
  walletId: string;
  people: WizardPerson[];
  items: WizardItem[];
  tax: string;
  service: string;
  discountType: DiscountType;
  discountValue: number | null;
}

export type WizardAction =
  | { type: 'step'; step: number }
  | { type: 'info'; patch: Partial<Pick<WizardState, 'title' | 'date' | 'walletId'>> }
  | { type: 'addPerson'; name: string }
  | { type: 'removePerson'; key: string }
  | { type: 'addItem' }
  | { type: 'item'; key: string; patch: Partial<Omit<WizardItem, 'key'>> }
  | { type: 'togglePerson'; itemKey: string; personKey: string }
  | { type: 'extras'; patch: Partial<Pick<WizardState, 'tax' | 'service' | 'discountType' | 'discountValue'>> };

export function initialWizard(date: string, walletId: string): WizardState {
  return {
    step: 1,
    seq: 1,
    title: '',
    date,
    walletId,
    people: [{ key: OWNER_KEY, name: OWNER_NAME }],
    items: [{ key: 'i0', name: '', price: null, qty: 1, personKeys: [] }],
    tax: '',
    service: '',
    discountType: 'NOMINAL',
    discountValue: 0,
  };
}

export function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'step':
      return { ...state, step: action.step };
    case 'info':
      return { ...state, ...action.patch };
    case 'addPerson':
      return {
        ...state,
        seq: state.seq + 1,
        people: [...state.people, { key: `p${state.seq}`, name: action.name }],
      };
    case 'removePerson':
      return {
        ...state,
        people: state.people.filter((p) => p.key !== action.key),
        items: state.items.map((it) => ({
          ...it,
          personKeys: it.personKeys.filter((k) => k !== action.key),
        })),
      };
    case 'addItem':
      return {
        ...state,
        seq: state.seq + 1,
        items: [
          ...state.items,
          { key: `i${state.seq}`, name: '', price: null, qty: 1, personKeys: [] },
        ],
      };
    case 'item':
      return {
        ...state,
        items: state.items.map((it) => (it.key === action.key ? { ...it, ...action.patch } : it)),
      };
    case 'togglePerson':
      return {
        ...state,
        items: state.items.map((it) => {
          if (it.key !== action.itemKey) return it;
          const has = it.personKeys.includes(action.personKey);
          return {
            ...it,
            personKeys: has
              ? it.personKeys.filter((k) => k !== action.personKey)
              : [...it.personKeys, action.personKey],
          };
        }),
      };
    case 'extras':
      return { ...state, ...action.patch };
  }
}

export function percentToBps(text: string): number {
  const n = Number(text.replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : 0;
}

export function discountValue(state: WizardState): number {
  const v = state.discountValue ?? 0;
  return state.discountType === 'PERCENT' ? v * 100 : v;
}

export function isDuplicateName(people: WizardPerson[], name: string): boolean {
  const n = name.trim().toLocaleLowerCase('id');
  return people.some((p) => p.name.toLocaleLowerCase('id') === n);
}

export function previewSplit(state: WizardState): SplitCalcResult | null {
  const items = state.items
    .filter((it) => it.personKeys.length > 0 && (it.price ?? 0) > 0)
    .map((it) => ({ name: it.name || '—', price: it.price ?? 0, qty: it.qty, personKeys: it.personKeys }));
  try {
    return calculateSplit({
      people: state.people,
      items,
      taxBps: percentToBps(state.tax),
      serviceBps: percentToBps(state.service),
      discountType: state.discountType,
      discountValue: discountValue(state),
    });
  } catch {
    return null;
  }
}

export interface StepErrors {
  title?: string;
  people?: string;
  items: Record<string, { name?: string; price?: string; who?: boolean }>;
}

export function stepErrors(state: WizardState, step: number): StepErrors | null {
  const errors: StepErrors = { items: {} };
  let failed = false;
  if (step === 1 && !state.title.trim()) {
    errors.title = 'Judul belum diisi.';
    failed = true;
  }
  if (step === 2 && state.people.length < 2) {
    errors.people = 'Tambahkan minimal satu teman.';
    failed = true;
  }
  if (step === 3) {
    for (const it of state.items) {
      const e = {
        name: it.name.trim() ? undefined : 'Nama item belum diisi.',
        price: it.price ? undefined : 'Harga belum diisi.',
        who: it.personKeys.length === 0,
      };
      if (e.name || e.price || e.who) {
        errors.items[it.key] = e;
        failed = true;
      }
    }
  }
  return failed ? errors : null;
}

export function toPayload(state: WizardState): CreateSplitInput {
  return {
    title: state.title.trim(),
    date: state.date,
    walletId: state.walletId,
    taxBps: percentToBps(state.tax),
    serviceBps: percentToBps(state.service),
    discountType: state.discountType,
    discountValue: discountValue(state),
    people: state.people.map((p) => ({ ...p, isOwner: p.key === OWNER_KEY })),
    items: state.items.map((it) => ({
      name: it.name.trim(),
      price: it.price ?? 0,
      qty: it.qty,
      personKeys: it.personKeys,
    })),
  };
}
