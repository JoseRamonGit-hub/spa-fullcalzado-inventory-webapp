import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { Pencil, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { OverflowTooltip } from "@/components/ui/overflow-tooltip";
import type { Business, ManagedUser } from "@/types";
import { getUserRoleLabel } from "./utils/user-labels";
import { cn } from "@/lib/utils";

const columnHelper = createColumnHelper<ManagedUser>();

export type UsersTableMeta = {
  businesses: Business[];
  onEdit: (user: ManagedUser) => void;
};

function getBusinessName(businesses: Business[], businessId: string | null) {
  if (!businessId) return "—";
  return businesses.find((business) => business.id === businessId)?.name ?? "—";
}

function getBusinessSummary(user: ManagedUser, businesses: Business[]) {
  if (user.role === "admin" && user.business_ids.length === 0) {
    return ["Todos los negocios"];
  }

  if (user.business_ids.length === 0) {
    return ["Sin asignar"];
  }

  return user.business_ids.map((id) => getBusinessName(businesses, id));
}

function BusinessSummaryCell({ user, businesses }: { user: ManagedUser; businesses: Business[] }) {
  const summary = getBusinessSummary(user, businesses);
  const isUnassigned = user.role !== "admin" && user.business_ids.length === 0;
  const shouldCollapse = summary.length > 2;
  const visibleBusinesses = shouldCollapse ? summary.slice(0, 1) : summary;
  const hiddenBusinessCount = summary.length - visibleBusinesses.length;

  return (
    <div className="flex max-w-80 items-center gap-1.5">
      <OverflowTooltip focusable={false} className={isUnassigned ? "text-destructive" : undefined}>
        {visibleBusinesses.join(", ")}
      </OverflowTooltip>
      {hiddenBusinessCount > 0 ? (
        <Badge variant="outline" className="tabular-value h-5 shrink-0 px-1.5 text-[11px] font-medium">
          +{hiddenBusinessCount}
        </Badge>
      ) : null}
    </div>
  );
}

export const columns = [
  columnHelper.accessor("fullname", {
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Usuario" />,
    cell: ({ row }) => {
      return (
        <div className="flex min-w-0 flex-col">
          <OverflowTooltip focusable={false} className="text-sm font-semibold">
            {row.original.fullname}
          </OverflowTooltip>
          <OverflowTooltip focusable={false} className="text-muted-foreground text-[11px]">
            {row.original.email}
          </OverflowTooltip>
        </div>
      );
    },
  }),
  columnHelper.accessor("role", {
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Rol" />,
    cell: ({ getValue }) => (
      <Badge variant={getValue() === "admin" ? "default" : "secondary"}>{getUserRoleLabel(getValue())}</Badge>
    ),
  }),
  columnHelper.accessor("is_active", {
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
    cell: ({ getValue }) => {
      const isActive = getValue() !== false;

      return (
        <span className="inline-flex items-center gap-1.5">
          <span className={cn("size-1.5 rounded-full", isActive ? "bg-success" : "bg-destructive")} />
          {isActive ? "Activo" : "Inactivo"}
        </span>
      );
    },
  }),
  columnHelper.display({
    id: "businesses",
    header: "Negocios",
    cell: ({ row, table }) => {
      const meta = table.options.meta as UsersTableMeta;
      return <BusinessSummaryCell user={row.original} businesses={meta.businesses} />;
    },
  }),
  columnHelper.accessor("default_business_id", {
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Negocio predeterminado" />,
    cell: ({ row, table }) => {
      const meta = table.options.meta as UsersTableMeta;
      return (
        <span className="text-muted-foreground inline-flex max-w-64 items-center gap-1.5">
          <Store className="size-3.5 shrink-0" aria-hidden="true" />
          <OverflowTooltip focusable={false}>
            {getBusinessName(meta.businesses, row.original.default_business_id)}
          </OverflowTooltip>
        </span>
      );
    },
  }),
  columnHelper.display({
    id: "actions",
    header: () => <div className="text-center">Acciones</div>,
    cell: ({ row, table }) => {
      const meta = table.options.meta as UsersTableMeta;

      return (
        <div className="flex items-center justify-center">
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground hover:text-primary"
            aria-label={`Editar a ${row.original.fullname}`}
            title={`Editar a ${row.original.fullname}`}
            onClick={(event) => {
              event.stopPropagation();
              meta.onEdit(row.original);
            }}
          >
            <Pencil data-icon="inline-start" aria-hidden="true" />
          </Button>
        </div>
      );
    },
  }),
] as ColumnDef<ManagedUser>[];
