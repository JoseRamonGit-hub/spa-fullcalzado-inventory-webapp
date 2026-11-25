import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type DashboardMetricCardProps = {
  title: ReactNode;
  value: string;
  description?: ReactNode;
  icon?: LucideIcon;
  emphasis?: "primary" | "warning";
  actionLabel?: string;
  onAction?: () => void;
  inline?: boolean;
  mobileValueIcon?: ReactNode;
  mobileValueLabel?: string;
  className?: string;
};

const CARD_CLASS_NAME = "h-full min-w-0 gap-3 py-3";
const INLINE_ROW_CLASS_NAME = "flex min-w-0 flex-col gap-3 px-4 @2xl:flex-row @2xl:items-center @2xl:gap-4";

function MetricTitle({ children }: { children: ReactNode }) {
  return (
    <CardTitle
      role="heading"
      aria-level={3}
      className="text-muted-foreground min-w-0 text-[10px] font-semibold tracking-wider uppercase"
    >
      {children}
    </CardTitle>
  );
}

function MetricIcon({ icon: Icon, emphasis }: { icon: LucideIcon; emphasis?: DashboardMetricCardProps["emphasis"] }) {
  return (
    <div
      className={cn(
        "bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-lg",
        emphasis === "primary" && "bg-primary/10 text-primary",
        emphasis === "warning" && "bg-warning/10 text-warning",
      )}
    >
      <Icon className="size-4" aria-hidden="true" />
    </div>
  );
}

function MetricValue({ children, className }: { children: string; className?: string }) {
  return (
    <p
      className={cn(
        "font-heading min-w-0 text-xl leading-tight font-bold tracking-tight tabular-nums sm:text-2xl sm:leading-none",
        className,
      )}
    >
      {children}
    </p>
  );
}

function MetricAction({ label, onAction, className }: { label: string; onAction: () => void; className?: string }) {
  return (
    <Button variant="link" size="xs" className={cn("-ml-2", className)} onClick={onAction}>
      {label}
      <ArrowRight aria-hidden="true" />
    </Button>
  );
}

export function DashboardMetricCard({
  title,
  value,
  description,
  icon,
  emphasis,
  actionLabel,
  onAction,
  inline,
  mobileValueIcon,
  mobileValueLabel,
  className,
}: DashboardMetricCardProps) {
  const action = actionLabel && onAction ? { label: actionLabel, onAction } : null;
  const cardClassName = cn(CARD_CLASS_NAME, emphasis === "warning" && "bg-warning/5", className);

  if (inline) {
    return (
      <Card className={cn("@container", cardClassName)}>
        <div className={INLINE_ROW_CLASS_NAME}>
          <div className={cn("flex min-w-0 items-center gap-3", mobileValueIcon && "max-md:sr-only")}>
            {icon ? <MetricIcon icon={icon} emphasis={emphasis} /> : null}
            <MetricTitle>{title}</MetricTitle>
          </div>
          <div className="flex min-w-0 items-center gap-2 md:contents">
            {mobileValueIcon ? <span className="shrink-0 md:hidden">{mobileValueIcon}</span> : null}
            <MetricValue className="shrink-0 [text-box:trim-both_cap_alphabetic]">{value}</MetricValue>
            {mobileValueLabel ? (
              <span
                aria-hidden="true"
                className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase md:hidden"
              >
                {mobileValueLabel}
              </span>
            ) : null}
          </div>
          {description ? (
            <CardDescription className="min-w-0 text-xs leading-relaxed [text-box:trim-both_cap_alphabetic] @2xl:flex-1 @2xl:border-l @2xl:py-1 @2xl:pl-4">
              {description}
            </CardDescription>
          ) : null}
          {action ? <MetricAction {...action} className="self-start @2xl:ml-auto @2xl:self-auto" /> : null}
        </div>
      </Card>
    );
  }

  return (
    <Card className={cardClassName}>
      <CardHeader className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-3 px-4">
        <MetricTitle>{title}</MetricTitle>
        {icon ? <MetricIcon icon={icon} emphasis={emphasis} /> : null}
      </CardHeader>
      <CardContent className="min-w-0 px-4">
        <MetricValue>{value}</MetricValue>
      </CardContent>
      {description || action ? (
        <CardFooter className="mt-auto min-w-0 flex-col items-start gap-1 px-4">
          {description ? (
            <CardDescription className="min-w-0 text-xs leading-relaxed break-words">{description}</CardDescription>
          ) : null}
          {action ? <MetricAction {...action} /> : null}
        </CardFooter>
      ) : null}
    </Card>
  );
}

export function DashboardMetricCardSkeleton({ inline, className }: { inline?: boolean; className?: string }) {
  if (inline) {
    return (
      <Card className={cn("@container", CARD_CLASS_NAME, className)}>
        <div className={INLINE_ROW_CLASS_NAME}>
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-24 rounded-md" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-3 w-56 max-w-full" />
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn(CARD_CLASS_NAME, className)}>
      <CardHeader className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-3 px-4">
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
