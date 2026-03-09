import type { InventoryMovementWithRelations } from "@/types";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatTime12h } from "@/utils/formatters";
import { createColumnHelper } from "@tanstack/react-table";

const columHelper = createColumnHelper<InventoryMovementWithRelations>();

export const columns = [
  columHelper.accessor("type", {
    header: () => <div className="text-center">Tipo</div>,
    cell: ({ getValue }) => {
      const type = getValue();
      return (
        <div className="text-center">
          <Badge variant={type === "entry" ? "success" : "destructive"}>
            {type === "entry" ? "Entrada" : "Salida"}
          </Badge>
        </div>
      );
    },
  }),
  columHelper.accessor("date", {
    header: "Fecha",
    cell: ({ getValue }) => <span className="text-muted-foreground tabular-nums">{formatDate(getValue())}</span>,
  }),
  columHelper.accessor("time", {
    header: "Hora",
    cell: ({ getValue }) => <span className="text-muted-foreground tabular-nums">{formatTime12h(getValue())}</span>,
  }),
  columHelper.accessor("products.code", {
    header: "Código",
    cell: ({ getValue }) => <span className="product-code font-bold">{getValue()}</span>,
  }),
  columHelper.accessor("products.description", {
    header: "Descripción",
    cell: ({ getValue }) => <span className="max-w-table-row block truncate">{getValue()}</span>,
  }),
  columHelper.accessor("quantity", {
    header: () => <div className="text-right">Cant.</div>,
    cell: ({ getValue }) => <div className="text-right font-medium tabular-nums">{getValue()}</div>,
  }),
  columHelper.accessor("users.fullname", {
    header: "Usuario",
    cell: ({ getValue }) => <span className="text-muted-foreground">{getValue()}</span>,
  }),
];
