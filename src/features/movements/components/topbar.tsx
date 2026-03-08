import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Search } from "lucide-react";

export function Topbar() {
  return (
    <div className="topbar-height bg-background flex items-center justify-between gap-2 border-b px-3 md:px-4">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="bg-primary h-1.5 w-1.5 rounded-full" />
          <h2 className="text-foreground text-sm font-semibold whitespace-nowrap">Movimientos</h2>
        </div>
        <div className="bg-card rounded-md">
          <InputGroup className="h-8 max-w-xs">
            <InputGroupInput placeholder="Buscar movimientos..." className="text-xs" />
            <InputGroupAddon>
              <Search className="h-3.5 w-3.5" />
            </InputGroupAddon>
          </InputGroup>
        </div>
      </div>
    </div>
  );
}
