import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type DashboardMetricCardProps = {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  emphasis?: "primary" | "warning";
};

export function DashboardMetricCard({ title, value, description, icon: Icon, emphasis }: DashboardMetricCardProps) {
  return (
    <Card className={cn("gap-3 py-3", emphasis === "warning" && "bg-warning/5")}>
      <CardHeader className="grid grid-cols-[1fr_auto] gap-3 px-4">
        <CardTitle className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
          {title}
        </CardTitle>
        <div
          className={cn(
            "bg-muted text-muted-foreground flex size-8 items-center justify-center rounded-lg",
            emphasis === "primary" && "bg-primary/10 text-primary",
            emphasis === "warning" && "bg-warning/10 text-warning",
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </div>
      </CardHeader>
      <CardContent className="px-4">
        <p className="font-heading text-2xl leading-none font-bold tracking-tight tabular-nums">{value}</p>
      </CardContent>
      <CardFooter className="px-4">
        <CardDescription className="text-xs leading-relaxed">{description}</CardDescription>
      </CardFooter>
    </Card>
  );
}

export function DashboardMetricCardSkeleton() {
  return (
    <Card className="gap-3 py-3">
      <CardHeader className="grid grid-cols-[1fr_auto] gap-3 px-4">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="size-8 rounded-lg" />
      </CardHeader>
      <CardContent className="px-4">
        <Skeleton className="h-7 w-32" />
      </CardContent>
      <CardFooter className="px-4">
        <Skeleton className="h-3 w-40 max-w-full" />
      </CardFooter>
    </Card>
  );
}
