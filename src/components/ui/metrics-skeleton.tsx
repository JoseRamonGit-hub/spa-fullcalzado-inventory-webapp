import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface MetricsSkeletonProps {
  count: number;
}

export function MetricsSkeleton({ count }: MetricsSkeletonProps) {
  return (
    <div className="px-3 md:px-4 py-3 border-b">
      <div
        className={cn(
          "grid divide-x divide-border/50",
          count <= 3 ? "grid-cols-3" : "grid-cols-2 md:grid-cols-4 gap-y-4",
        )}
      >
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "flex flex-col gap-2 px-2 sm:px-4 min-w-0",
              i === 0 ? "pl-0" : "",
              i === count - 1 ? "pr-0" : "",
            )}
          >
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-5 w-16 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
