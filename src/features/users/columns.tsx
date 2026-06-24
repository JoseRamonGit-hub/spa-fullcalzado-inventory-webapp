import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { Pencil } from "lucide-react";
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
  const [firstBusiness, secondBusiness, ...rest] = summary;
  const isUnassigned = user.role !== "admin" && user.business_ids.length === 0;

  return (
    <div className="flex max-w-[22rem] flex-wrap items-center gap-1.5">
      {[firstBusiness, secondBusiness].filter(Boolean).map((businessName) => (
        <Badge key={businessName} variant={isUnassigned ? "destructive" : "outline"} className="max-w-36 truncate">
          {businessName}
        </Badge>
      ))}
      {rest.length > 0 ? <Badge variant="secondary">+{rest.length}</Badge> : null}
    </div>
  );
}

export const columns = [
  columnHelper.accessor("fullname", {
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Usuario" />,
    cell: ({ row }) => (
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-semibold">{row.original.fullname}</span>
        <span className="text-muted-foreground truncate text-[11px]">{row.original.email}</span>
      </div>
    ),
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

      return <Badge variant={isActive ? "success" : "destructive"}>{isActive ? "Activo" : "Inactivo"}</Badge>;
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
    header: ({ column }) => <DataTableColumnHeader column={column} title="Predeterminado" />,
    meta: { hideOnMobile: true },
    cell: ({ row, table }) => {
      const meta = table.options.meta as UsersTableMeta;
      return (
        <span className="text-muted-foreground">
          {getBusinessName(meta.businesses, row.original.default_business_id)}
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
