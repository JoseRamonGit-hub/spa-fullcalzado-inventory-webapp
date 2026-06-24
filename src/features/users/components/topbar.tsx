import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { BusinessModuleTitle } from "@/features/business/components/business-module-title";

type TopbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  onCreateUser: () => void;
};

export function Topbar({ search, onSearchChange, onCreateUser }: TopbarProps) {
  return (
    <header className="topbar-height bg-background flex items-center justify-between gap-2 border-b px-3 md:px-4">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <BusinessModuleTitle title="Usuarios" />
        <div className="bg-card flex-1 rounded-md md:max-w-xs">
          <InputGroup className="h-8">
            <InputGroupInput
              placeholder="Buscar usuario o correo..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="border-0 text-sm md:text-xs"
            />
            <InputGroupAddon align="inline-end">
              <Search className="h-4 w-4 md:h-3.5 md:w-3.5" aria-hidden="true" />
            </InputGroupAddon>
          </InputGroup>
        </div>
      </div>

      <Button size="sm" onClick={onCreateUser}>
        <Plus data-icon="inline-start" />
        <span className="hidden sm:inline">Nuevo usuario</span>
        <span className="sm:hidden">Nuevo</span>
      </Button>
    </header>
  );
}
