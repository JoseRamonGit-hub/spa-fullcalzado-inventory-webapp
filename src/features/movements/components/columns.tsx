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
          <Badge variant={type === "entry" ? "default" : "destructive"}>
            {type === "entry" ? "Entrada" : "Salida"}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "date",
    header: "Fecha",
  },
  {
    accessorKey: "time",
    header: "Hora",
  },
  {
    id: "products_code",
    accessorFn: (row) => row.products?.code,
    header: "Código",
  },
  {
    id: "products_description",
    accessorFn: (row) => row.products?.description,
    header: "Producto",
  },
  {
    accessorKey: "quantity",
    header: () => <div className="text-right">Cant.</div>,
    cell: ({ row }) => {
      return <div className="text-right">{row.getValue("quantity")}</div>;
    },
  },
  {
    id: "users_fullname",
    accessorFn: (row) => row.users?.fullname,
    header: "Usuario",
  },
];
