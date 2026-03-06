import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Search } from "lucide-react";

export function Topbar() {
  return (
    <div className="flex topbar-height items-center px-4 justify-between bg-background border-b gap-2">
      <div className="basis-full items-center gap-2 flex">
        <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Inventario</h2>
        <InputGroup className="h-7">
          <InputGroupInput placeholder="Buscar..." />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroup>
      </div>
      <div>
        <NativeSelect className="h-7 min-w-32">
          <NativeSelectOption value="all">Stock: Todos</NativeSelectOption>
          <NativeSelectOption value="">Con stock</NativeSelectOption>
          <NativeSelectOption value="done">Sin stock</NativeSelectOption>
        </NativeSelect>
      </div>
    </div>
  );
}
