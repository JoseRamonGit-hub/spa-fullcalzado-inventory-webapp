import type { ColumnDef } from "@tanstack/react-table";
import type { InventoryMovementWithRelations } from "@/types";
import { Badge } from "@/components/ui/badge";

export const columns: ColumnDef<InventoryMovementWithRelations>[] = [
  {
    accessorKey: "type",
    header: () => <div className="text-center">Tipo</div>,
    cell: ({ row }) => {
      const type = row.getValue("type");
      return (
        <div className="text-center">
          <Badge
            variant="secondary"
            className={
              type === "entry"
                ? "bg-success/15 text-success hover:bg-success/20 border-0 text-[11px] px-1.5 py-0"
                : "bg-destructive/15 text-destructive hover:bg-destructive/20 border-0 text-[11px] px-1.5 py-0"
            }
          >
            {type === "entry" ? "Entrada" : "Salida"}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "date",
    header: "Fecha",
    cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{row.getValue("date")}</span>,
  },
  {
    accessorKey: "time",
    header: "Hora",
    cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{row.getValue("time")}</span>,
  },
  {
    id: "products_code",
    accessorFn: (row) => row.products?.code,
    header: "Código",
    cell: ({ row }) => <span className="product-code font-medium">{row.getValue("products_code")}</span>,
  },
  {
    id: "products_description",
    accessorFn: (row) => row.products?.description,
    header: "Producto",
    cell: ({ row }) => (
      <span className="truncate max-w-[200px] inline-block">{row.getValue("products_description")}</span>
    ),
  },
  {
    accessorKey: "quantity",
    header: () => <div className="text-right">Cant.</div>,
    cell: ({ row }) => {
      return <div className="text-right tabular-nums font-medium">{row.getValue("quantity")}</div>;
    },
  },
  {
    id: "users_fullname",
    accessorFn: (row) => row.users?.fullname,
    header: "Usuario",
    cell: ({ row }) => <span className="text-muted-foreground">{row.getValue("users_fullname")}</span>,
  },
];
