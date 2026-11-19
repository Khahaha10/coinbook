import { SplitDetailPage } from '@/features/splits/components/split-detail-page';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SplitDetailPage id={id} />;
}
