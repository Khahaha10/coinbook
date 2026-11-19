import type { WalletType } from '@coinbook/shared';
import { Banknote, Landmark, Smartphone, type LucideIcon } from 'lucide-react';

export const WALLET_ICONS: Record<WalletType, LucideIcon> = {
  BANK: Landmark,
  EWALLET: Smartphone,
  CASH: Banknote,
};

export const WALLET_TYPE_LABELS: Record<WalletType, string> = {
  BANK: 'Bank',
  EWALLET: 'E-wallet',
  CASH: 'Tunai',
};
