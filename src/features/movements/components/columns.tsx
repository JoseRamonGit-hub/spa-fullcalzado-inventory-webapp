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
          <Badge variant={type === "entry" ? "success" : "destructive"}>
            {type === "entry" ? "Entrada" : "Salida"}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "date",
    header: "Fecha",
    cell: ({ row }) => <span className="text-muted-foreground tabular-nums">{row.getValue("date")}</span>,
  },
  {
    accessorKey: "time",
    header: "Hora",
    cell: ({ row }) => <span className="text-muted-foreground tabular-nums">{row.getValue("time")}</span>,
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
      <span className="block max-w-[160px] truncate md:max-w-[240px]">{row.getValue("products_description")}</span>
    ),
  },
  {
    accessorKey: "quantity",
    header: () => <div className="text-right">Cant.</div>,
    cell: ({ row }) => {
      return <div className="text-right font-medium tabular-nums">{row.getValue("quantity")}</div>;
    },
  },
  {
    id: "users_fullname",
    accessorFn: (row) => row.users?.fullname,
    header: "Usuario",
    cell: ({ row }) => <span className="text-muted-foreground">{row.getValue("users_fullname")}</span>,
  },
];
