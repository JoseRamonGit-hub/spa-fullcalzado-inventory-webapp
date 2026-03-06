import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Search } from "lucide-react";

export function Topbar() {
  return (
    <div className="flex topbar-height items-center px-4 justify-between bg-background border-b gap-2">
      <div className="basis-full items-center gap-2 flex">
        <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground whitespace-nowrap">
          Movimientos
        </h2>
        <InputGroup className="h-7 w-full max-w-sm">
          <InputGroupInput placeholder="Buscar movimientos..." />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroup>
      </div>
    </div>
  );
}
