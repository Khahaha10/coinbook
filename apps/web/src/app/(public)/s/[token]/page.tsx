import { shareTokenSchema, type PublicSplitDto } from '@coinbook/shared';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PublicSplitView } from '@/features/splits/components/public-split-view';
import { ApiError } from '@/lib/api/errors';
import { publicApi } from '@/lib/api/server';

export const metadata: Metadata = { robots: { index: false, follow: false } };

async function load(token: string): Promise<PublicSplitDto> {
  if (!shareTokenSchema.safeParse(token).success) notFound();
  try {
    return await publicApi<PublicSplitDto>(`/public/splits/${token}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const split = await load(token);
  return <PublicSplitView token={token} initial={split} />;
}
