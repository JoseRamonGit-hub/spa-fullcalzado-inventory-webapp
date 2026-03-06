import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Search } from "lucide-react";

export function Topbar() {
  return (
    <div className="flex topbar-height items-center px-3 md:px-4 justify-between bg-background border-b gap-2">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          <h2 className="font-semibold text-sm text-foreground whitespace-nowrap">Movimientos</h2>
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
