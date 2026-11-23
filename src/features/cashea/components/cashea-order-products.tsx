import { Button } from "@/components/ui/button";
import { useSaleLines } from "@/features/transactions/hooks/useTransactionQueries";
import { formatInteger } from "@/utils/formatters";

export function CasheaOrderProducts({ saleId, isOpen }: { saleId: string; isOpen: boolean }) {
  const { data: lines, isPending, isError, isFetching, refetch } = useSaleLines(saleId, { enabled: isOpen });

  return (
    <section>
      <h3
        className={
          "operational-label text-muted-foreground bg-muted/50 flex min-h-8 items-center justify-between gap-3 border-y px-4 @sm:px-6"
        }
      >
        Productos de la venta
        {Boolean(lines?.length) && <span aria-hidden="true">Cantidad</span>}
      </h3>
      {lines?.length ? (
        <ul className="bg-card text-xs">
          {lines.map(({ id, products, quantity }) => (
            <li
              key={id}
              className="border-border/40 flex min-h-8 items-center justify-between gap-3 border-b px-4 @sm:px-6"
            >
              <p className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5 [overflow-wrap:anywhere]">
                {products?.code && <span className="product-code min-w-0 uppercase">{products.code}</span>}
                <span className="min-w-0">{products?.description || "Producto sin descripción"}</span>
              </p>
              <span className="data-value shrink-0 text-right">
                <span className="sr-only">Cantidad: </span>
                {formatInteger(quantity)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 text-xs @sm:px-6">
          <p role="status">
            {isPending
              ? "Cargando productos…"
              : isError
                ? "No pudimos cargar los productos de la venta."
                : "Esta venta no tiene productos registrados."}
          </p>
          {isError && (
            <Button variant="outline" size="xs" disabled={isFetching} onClick={() => void refetch()}>
              Reintentar
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
