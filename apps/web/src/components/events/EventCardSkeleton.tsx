import { Skeleton } from '@/components/ui/skeleton';

export function EventCardSkeleton() {
  return (
    <div className="border-border bg-card flex flex-col border">
      <Skeleton className="aspect-[4/5] w-full rounded-none" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-2.5 w-24" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}
