'use client';

import { formatRupiah, type WalletDto } from '@coinbook/shared';
import { Archive, Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import { Panel } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useWallets } from '../hooks/use-wallets';
import { WALLET_ICONS, WALLET_TYPE_LABELS } from '../wallet-types';
import { TransferPanel } from './transfer-panel';
import { WalletSheets, type WalletSheetState } from './wallet-sheets';

interface WalletCoverProps {
  wallet: WalletDto;
  onEdit: () => void;
  onArchive: () => void;
}

function WalletCover({ wallet, onEdit, onArchive }: WalletCoverProps) {
  const Icon = WALLET_ICONS[wallet.type];
  return (
    <li className="wcov">
      <div className="wcov-top">
        <span className="ty">
          <Icon size={18} aria-hidden="true" />
          {WALLET_TYPE_LABELS[wallet.type]}
        </span>
        <div className="flex flex-col gap-1">
          <span className="nm">{wallet.name}</span>
          <span className="bl">{formatRupiah(wallet.balance)}</span>
        </div>
      </div>
      <div className="wcov-bot">
        <span className="text-meta text-muted">
          {wallet.transactionCountThisMonth} transaksi bulan ini
        </span>
        <span className="flex">
          <Button variant="quiet" icon aria-label={`Edit ${wallet.name}`} onClick={onEdit}>
            <Pencil size={20} aria-hidden="true" />
          </Button>
          <Button variant="quiet" icon aria-label={`Arsipkan ${wallet.name}`} onClick={onArchive}>
            <Archive size={20} aria-hidden="true" />
          </Button>
        </span>
      </div>
    </li>
  );
}

export function WalletsPage() {
  const wallets = useWallets();
  const [sheet, setSheet] = useState<WalletSheetState>({ mode: 'closed' });
  const active = wallets.data?.data.filter((w) => !w.isArchived) ?? [];

  return (
    <>
      <header className="ph">
        <div className="flex flex-col gap-1">
          <h1 className="text-h1 leading-[1.2] font-medium tracking-[-0.01em]">Dompet</h1>
          {wallets.data ? (
            <p className="text-body">
              Total{' '}
              <span className="font-medium">
                {formatRupiah(active.reduce((sum, w) => sum + w.balance, 0))}
              </span>{' '}
              di{' '}
              {active.length} dompet
            </p>
          ) : null}
        </div>
        <Button variant="secondary" onClick={() => setSheet({ mode: 'create' })}>
          <Plus size={20} aria-hidden="true" />
          Tambah dompet
        </Button>
      </header>
      {wallets.data ? (
        <div className="wl-layout">
          <ul className="wl-grid" aria-label="Daftar dompet">
            {active.map((w) => (
              <WalletCover
                key={w.id}
                wallet={w}
                onEdit={() => setSheet({ mode: 'edit', wallet: w })}
                onArchive={() => setSheet({ mode: 'archive', wallet: w })}
              />
            ))}
          </ul>
          <TransferPanel wallets={active} />
        </div>
      ) : (
        <Panel className="h-64" aria-busy="true" />
      )}
      <WalletSheets state={sheet} onClose={() => setSheet({ mode: 'closed' })} />
    </>
  );
}
