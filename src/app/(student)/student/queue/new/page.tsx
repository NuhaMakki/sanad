import { QueueBookingFlow } from "@/components/queue/QueueBookingFlow";

export default function QueueNewPage({
  searchParams,
}: {
  searchParams: Promise<{ unit?: string }>;
}) {
  return <QueueNewInner searchParams={searchParams} />;
}

async function QueueNewInner({ searchParams }: { searchParams: Promise<{ unit?: string }> }) {
  const params = await searchParams;
  return <QueueBookingFlow preselectedUnitId={params.unit} />;
}
