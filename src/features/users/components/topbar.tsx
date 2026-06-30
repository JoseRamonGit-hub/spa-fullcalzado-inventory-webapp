import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { BusinessModuleTitle } from "@/features/business/components/business-module-title";

type TopbarProps = {
  search: string;
  totalUsers: number;
  onSearchChange: (value: string) => void;
  onCreateUser: () => void;
};

export function Topbar({ search, totalUsers, onSearchChange, onCreateUser }: TopbarProps) {
  return (
    <header className="bg-background flex shrink-0 flex-col gap-2 border-b px-3 py-2 md:h-(--topbar-height) md:flex-row md:items-center md:justify-between md:gap-3 md:px-4 md:py-0">
      <div className="flex min-w-0 items-center justify-between gap-3 md:contents">
        <BusinessModuleTitle title="Usuarios">
          <span className="text-muted-foreground hidden text-xs font-normal lg:inline">
            {totalUsers} {totalUsers === 1 ? "usuario" : "usuarios"}
          </span>
        </BusinessModuleTitle>

        <Button size="sm" onClick={onCreateUser} className="md:order-3">
          <Plus data-icon="inline-start" />
          <span className="hidden sm:inline">Nuevo usuario</span>
          <span className="sm:hidden">Nuevo</span>
        </Button>
      </div>

      <div className="min-w-0 flex-1 md:ml-2 md:max-w-sm">
        <div className="bg-card rounded-md">
          <InputGroup className="h-8">
            <InputGroupInput
              placeholder="Buscar por nombre, correo o negocio..."
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
    </header>
  );
}
