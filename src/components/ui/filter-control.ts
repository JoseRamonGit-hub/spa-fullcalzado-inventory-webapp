import { cn } from "@/lib/utils";

const filterControlTextClassName = "text-xs font-normal transition-colors";

const filterTriggerClassName = cn(
  "bg-card border-border hover:bg-card/80 h-8 min-w-0 gap-1.5 px-2.5 [&_svg:not([class*='size-'])]:size-3.5",
  filterControlTextClassName,
);

const filterToggleItemClassName = cn(
  filterControlTextClassName,
  "text-muted-foreground data-[state=on]:text-foreground",
);

function filterStateClassName(active: boolean) {
  return active ? "border-primary/40 text-foreground" : "text-muted-foreground";
}

function filterIconClassName(active: boolean) {
  return cn("shrink-0", active ? "text-primary" : "text-muted-foreground");
}

export {
  filterControlTextClassName,
  filterIconClassName,
  filterStateClassName,
  filterToggleItemClassName,
  filterTriggerClassName,
};
