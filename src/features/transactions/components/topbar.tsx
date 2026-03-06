export function Topbar() {
  return (
    <div className="flex topbar-height items-center px-3 md:px-4 justify-between bg-background border-b gap-2">
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
        <h2 className="font-semibold text-sm text-foreground whitespace-nowrap">Ventas</h2>
      </div>
    </div>
  );
}
