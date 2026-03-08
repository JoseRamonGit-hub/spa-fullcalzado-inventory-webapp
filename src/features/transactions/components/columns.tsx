import type { ColumnDef } from "@tanstack/react-table";
import type { TransactionWithRelations } from "@/types";

function formatTime12h(time: string): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${String(hour12).padStart(2, "0")}:${m} ${ampm}`;
}

export const columns: ColumnDef<TransactionWithRelations>[] = [
  {
    accessorKey: "date",
    header: "Fecha",
    cell: ({ row }) => <span className="font-medium tabular-nums">{row.getValue("date")}</span>,
  },
  {
    accessorKey: "time",
    header: "Hora",
    cell: ({ row }) => {
      const time = row.getValue("time") as string;
      return <span className="text-muted-foreground tabular-nums">{formatTime12h(time)}</span>;
    },
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
    cell: ({ row }) => <div className="text-right font-medium tabular-nums">{row.getValue("quantity")}</div>,
  },
  {
    accessorKey: "price_usd",
    header: () => <div className="text-right">USD</div>,
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("price_usd"));
      const qty = row.original.quantity;
      const total = price * qty;
      const formatted = new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(total);
      return <div className="text-right font-medium tabular-nums">${formatted}</div>;
    },
  },
  {
    accessorKey: "price_ves",
    header: () => <div className="text-right">VES</div>,
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("price_ves"));
      const qty = row.original.quantity;
      const total = price * qty;
      const formatted = new Intl.NumberFormat("es-VE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(total);
      return <div className="text-muted-foreground text-right tabular-nums">Bs {formatted}</div>;
    },
  },
  {
    id: "users_fullname",
    accessorFn: (row) => row.users?.fullname,
    header: "Vendedor",
    cell: ({ row }) => <span className="text-muted-foreground">{row.getValue("users_fullname")}</span>,
  },
];
