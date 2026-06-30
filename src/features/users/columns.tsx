import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { ChevronRight, Pencil, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import type { Business, ManagedUser } from "@/types";
import { getUserRoleLabel } from "./utils/user-labels";

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
    <div className="flex max-w-64 items-center gap-1.5">
      <span className={isUnassigned ? "text-destructive" : "truncate"}>{visibleBusinesses.join(", ")}</span>
      {hiddenBusinessCount > 0 ? (
        <Badge variant="outline" className="h-5 shrink-0 px-1.5 text-[10px] font-medium tabular-nums">
          +{hiddenBusinessCount}
        </Badge>
      ) : null}
    </div>
  );
}

function MobileUserDetails({ user, businesses }: { user: ManagedUser; businesses: Business[] }) {
  const businessSummary = getBusinessSummary(user, businesses);
  const defaultBusiness = getBusinessName(businesses, user.default_business_id);
  const isActive = user.is_active !== false;

  return (
    <div className="mt-2 flex flex-col gap-1.5 md:hidden">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Badge variant={user.role === "admin" ? "default" : "secondary"}>{getUserRoleLabel(user.role)}</Badge>
        <span className="inline-flex items-center gap-1.5 text-xs">
          <span className={isActive ? "bg-success size-1.5 rounded-full" : "bg-destructive size-1.5 rounded-full"} />
          {isActive ? "Activo" : "Inactivo"}
        </span>
      </div>
      <div className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-xs">
        <Store className="size-3.5 shrink-0" />
        <span className="truncate">{businessSummary.join(", ")}</span>
      </div>
      <span className="text-muted-foreground truncate text-[11px]">Inicio: {defaultBusiness}</span>
    </div>
  );
}

export const columns = [
  columnHelper.accessor("fullname", {
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Usuario" />,
    cell: ({ row, table }) => {
      const meta = table.options.meta as UsersTableMeta;

      return (
        <div className="flex min-w-0 items-start justify-between gap-3 py-1.5 md:py-0">
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold">{row.original.fullname}</span>
              <span className="text-muted-foreground truncate text-[11px]">{row.original.email}</span>
            </div>
            <MobileUserDetails user={row.original} businesses={meta.businesses} />
          </div>
          <ChevronRight className="text-muted-foreground mt-1 size-4 shrink-0 md:hidden" />
        </div>
      );
    },
  }),
  columnHelper.accessor("role", {
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Rol" />,
    meta: { hideOnMobile: true },
    cell: ({ getValue }) => (
      <Badge variant={getValue() === "admin" ? "default" : "secondary"}>{getUserRoleLabel(getValue())}</Badge>
    ),
  }),
  columnHelper.accessor("is_active", {
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
    meta: { hideOnMobile: true },
    cell: ({ getValue }) => {
      const isActive = getValue() !== false;

      return (
        <span className="inline-flex items-center gap-1.5">
          <span className={isActive ? "bg-success size-1.5 rounded-full" : "bg-destructive size-1.5 rounded-full"} />
          {isActive ? "Activo" : "Inactivo"}
        </span>
      );
    },
  }),
  columnHelper.display({
    id: "businesses",
    header: "Negocios",
    meta: { hideOnMobile: true },
    cell: ({ row, table }) => {
      const meta = table.options.meta as UsersTableMeta;
      return <BusinessSummaryCell user={row.original} businesses={meta.businesses} />;
    },
  }),
  columnHelper.accessor("default_business_id", {
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Predeterminado" />,
    meta: { hideOnMobile: true },
    cell: ({ row, table }) => {
      const meta = table.options.meta as UsersTableMeta;
      return (
        <span className="text-muted-foreground inline-flex max-w-52 items-center gap-1.5">
          <Store className="size-3.5 shrink-0" />
          <span className="truncate">{getBusinessName(meta.businesses, row.original.default_business_id)}</span>
        </span>
      );
    },
  }),
  columnHelper.display({
    id: "actions",
    header: () => <div className="text-center">Acciones</div>,
    meta: { hideOnMobile: true },
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
            <Pencil />
          </Button>
        </div>
      );
    },
  }),
] as ColumnDef<ManagedUser>[];
