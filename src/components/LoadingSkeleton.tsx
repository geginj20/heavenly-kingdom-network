import { Skeleton } from "./ui/skeleton";

export function CardSkeleton() {
  return (
    <div className="bg-[#0f2240] rounded-xl overflow-hidden border border-white/5">
      <Skeleton className="h-32 w-full rounded-none bg-white/5" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4 bg-white/5" />
        <Skeleton className="h-3 w-1/2 bg-white/5" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-8 w-8 rounded-lg bg-white/5" />
          <Skeleton className="h-8 w-8 rounded-lg bg-white/5" />
        </div>
      </div>
    </div>
  );
}

export function PrayerCardSkeleton() {
  return (
    <div className="bg-[#0f2240] rounded-xl p-5 border border-white/5">
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="w-10 h-10 rounded-full bg-white/5" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3 w-24 bg-white/5" />
          <Skeleton className="h-3 w-16 bg-white/5" />
        </div>
      </div>
      <Skeleton className="h-4 w-full bg-white/5 mb-2" />
      <Skeleton className="h-4 w-5/6 bg-white/5 mb-3" />
      <div className="flex gap-3">
        <Skeleton className="h-8 w-16 rounded-lg bg-white/5" />
        <Skeleton className="h-8 w-16 rounded-lg bg-white/5" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-[#0f2240] rounded-xl border border-white/5 overflow-hidden">
      <div className="p-4 border-b border-white/5">
        <Skeleton className="h-5 w-40 bg-white/5" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border-b border-white/5">
          <Skeleton className="h-4 flex-1 bg-white/5" />
          <Skeleton className="h-4 w-24 bg-white/5" />
          <Skeleton className="h-4 w-20 bg-white/5" />
        </div>
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-[#0f2240] rounded-xl p-5 border border-white/5">
      <Skeleton className="h-10 w-10 rounded-lg bg-white/5 mb-3" />
      <Skeleton className="h-8 w-20 bg-white/5 mb-2" />
      <Skeleton className="h-4 w-16 bg-white/5" />
    </div>
  );
}

export function BibleVerseSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className={`h-4 bg-white/5 ${i % 3 === 0 ? "w-full" : i % 3 === 1 ? "w-5/6" : "w-4/6"}`} />
      ))}
    </div>
  );
}

export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
