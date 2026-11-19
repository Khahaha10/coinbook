'use client';

import { formatRupiah, todayInJakarta, type WalletDto } from '@coinbook/shared';
import { Check, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useReducer, useState } from 'react';
import { ReceiptSlip } from '@/components/coinbook/receipt-slip';
import { Panel } from '@/components/ui/badge';
import { Button, buttonClasses } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useWallets } from '@/features/wallets/hooks/use-wallets';
import { DEFAULT_ERROR_MESSAGE } from '@/lib/api/errors';
import { cn } from '@/lib/cn';
import { useCreateSplit } from '../hooks/use-splits';
import { extrasLabel, longDate } from '../split-format';
import {
  initialWizard,
  OWNER_KEY,
  previewSplit,
  STEP_LABELS,
  stepErrors,
  toPayload,
  wizardReducer,
  type StepErrors,
} from '../wizard-state';
import { StepExtras, StepInfo, StepItems, StepPeople } from './wizard-steps';

function Steps({ step }: { step: number }) {
  return (
    <ol className="steps" aria-label="Langkah">
      {STEP_LABELS.map((label, i) => {
        const n = i + 1;
        const done = n < step;
        return (
          <li
            key={label}
            className={cn(n === step && 'cur', done && 'done')}
            aria-current={n === step ? 'step' : undefined}
          >
            <span className="num">
              {done ? (
                <>
                  <Check size={16} aria-hidden="true" />
                  <span className="sr">Selesai: </span>
                </>
              ) : (
                n
              )}
            </span>
            <span className="sl">{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

function Wizard({ wallets }: { wallets: WalletDto[] }) {
  const router = useRouter();
  const toast = useToast();
  const create = useCreateSplit();
  const [state, dispatch] = useReducer(
    wizardReducer,
    undefined,
    () => initialWizard(todayInJakarta(), wallets[0]?.id ?? ''),
  );
  const [errors, setErrors] = useState<StepErrors | null>(null);
  const preview = previewSplit(state);
  const people = state.people
    .map((p, i) => ({ person: p, result: preview?.people[i] }))
    .filter((r) => r.result && r.result.subtotal > 0);
  const discountAmount = preview?.discountAmount ?? 0;

  const goTo = (step: number) => {
    setErrors(null);
    dispatch({ type: 'step', step });
  };

  const next = () => {
    const found = stepErrors(state, state.step);
    setErrors(found);
    if (found) return;
    if (state.step < 4) {
      goTo(state.step + 1);
      return;
    }
    create.mutate(toPayload(state), {
      onSuccess: (detail) => router.push(`/splits/${detail.id}`),
      onError: () => toast.show(DEFAULT_ERROR_MESSAGE, 'error'),
    });
  };

  const isLast = state.step === 4;
  return (
    <>
      <Steps step={state.step} />
      <div className={cn('wz', isLast && 'two')}>
        <Panel as="section" aria-labelledby="wz-h">
          {state.step === 1 ? <StepInfo state={state} dispatch={dispatch} errors={errors} wallets={wallets} /> : null}
          {state.step === 2 ? <StepPeople state={state} dispatch={dispatch} errors={errors} /> : null}
          {state.step === 3 ? <StepItems state={state} dispatch={dispatch} errors={errors} /> : null}
          {isLast ? (
            <StepExtras
              state={state}
              dispatch={dispatch}
              errors={errors}
              grandTotal={preview?.grandTotal ?? 0}
              summary={people.map((r) => ({ name: r.person.name, total: r.result?.share ?? 0 }))}
            />
          ) : null}
        </Panel>
        {isLast ? (
          <section aria-labelledby="wz-prev">
            <h2 className="mb-4 text-h2 leading-[1.2] font-medium" id="wz-prev">
              Pratinjau struk
            </h2>
            <div className="desk-slips">
              {people.map(({ person, result }) =>
                result ? (
                  <div key={person.key} className="slot">
                    <ReceiptSlip
                      title={state.title}
                      date={longDate(state.date)}
                      heading={person.key === OWNER_KEY ? 'Bagianmu' : `Bagian ${person.name}`}
                      groups={[
                        [
                          ...result.lines.map((l) => ({
                            label: l.label,
                            value: formatRupiah(l.amount, { prefix: false }),
                          })),
                          {
                            label: extrasLabel({ discountAmount }),
                            value: formatRupiah(result.extras, { prefix: false }),
                            muted: true,
                          },
                        ],
                      ]}
                      total={formatRupiah(result.share)}
                    />
                  </div>
                ) : null,
              )}
            </div>
          </section>
        ) : null}
      </div>
      <div className="wz-bar">
        {state.step === 1 ? (
          <Link className={buttonClasses({ variant: 'secondary' })} href="/splits">
            Batal
          </Link>
        ) : (
          <Button variant="secondary" onClick={() => goTo(state.step - 1)}>
            Kembali
          </Button>
        )}
        <Button onClick={next} disabled={create.isPending}>
          {isLast ? 'Buat patungan' : 'Lanjut'}
        </Button>
      </div>
    </>
  );
}

export function SplitWizardPage() {
  const wallets = useWallets();
  const active = wallets.data?.data.filter((w) => !w.isArchived);
  return (
    <>
      <Link className="back" href="/splits">
        <ChevronLeft size={18} aria-hidden="true" />
        Patungan
      </Link>
      <h1 className="mb-5 text-h1 leading-[1.2] font-medium tracking-[-0.01em]">Buat patungan</h1>
      {active ? <Wizard wallets={active} /> : <Panel className="h-64 max-w-[640px]" aria-busy="true" />}
    </>
  );
}

