export function Topbar() {
  return (
    <div className="topbar-height bg-background flex items-center justify-between gap-2 border-b px-3 md:px-4">
      <div className="flex shrink-0 items-center gap-1.5">
        <span className="bg-primary h-1.5 w-1.5 rounded-full" />
        <h2 className="text-foreground text-sm font-semibold whitespace-nowrap">Ventas</h2>
      </div>
    </div>
  );
}
