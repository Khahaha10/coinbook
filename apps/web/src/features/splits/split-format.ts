import { formatRupiah, fromDateOnly, type DateOnly, type SplitDetailDto } from '@coinbook/shared';

const longFormat = new Intl.DateTimeFormat('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});
const shortFormat = new Intl.DateTimeFormat('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});

export function longDate(date: DateOnly): string {
  return longFormat.format(fromDateOnly(date));
}

export function extrasLabel(split: { discountAmount: number }): string {
  return split.discountAmount > 0 ? 'Pajak, service, diskon' : 'Pajak + service';
}

export function shareText(split: SplitDetailDto, bankInfo: string | null): string {
  const when = shortFormat.format(fromDateOnly(split.date)).replace(',', '');
  const lines = split.people
    .filter((p) => !p.isOwner)
    .map((p) => `${p.name} ${formatRupiah(p.share)}${p.debt?.status === 'PAID' ? ' (lunas)' : ''}`);
  const link = split.shareUrl.replace(/^https?:\/\//, '');
  const footer = [bankInfo ? `Transfer ke ${bankInfo}.` : null, `Lihat struk lengkap: ${link}`]
    .filter(Boolean)
    .join('\n');
  return `Halo! Ini rincian ${split.title}, ${when}:\n${lines.join('\n')}\n\n${footer}`;
}
