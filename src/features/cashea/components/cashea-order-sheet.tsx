import { useRef } from "react";
import { Ban, Check, Clock, FileText, Pencil, Undo2, X, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { CasheaOrder } from "@/types";
import { useSaleLines } from "@/features/transactions/hooks/useTransactionQueries";
import { formatCalendarDateString, formatCurrencyUSD, formatDateTime, formatInteger } from "@/utils/formatters";
import {
  casheaVoidReasonLabels,
  formatCasheaAgeDays,
  getCasheaCommissionUsd,
  getCasheaOrderAgeDays,
  isCasheaOrderLate,
} from "../cashea-receivables";
import { CasheaLogoIcon } from "./cashea-logo-icon";
import { CasheaOrderStatusBadge } from "./cashea-order-status-badge";

export type CasheaOrderActions = {
  onCollectOrder: (order: CasheaOrder) => void;
  onAdjustOrder: (order: CasheaOrder) => void;
  onVoidOrder: (order: CasheaOrder) => void;
  onRevertDeposit: (order: CasheaOrder) => void;
};

type CasheaOrderSheetProps = {
  order: CasheaOrder | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  /** Sin acciones, el detalle es solo de consulta. */
  actions?: CasheaOrderActions;
};

const DESTRUCTIVE_GHOST_CLASS_NAME = "text-destructive hover:bg-destructive/10 hover:text-destructive";
const SECTION_HEADING_CLASS_NAME =
  "bg-muted operational-label text-muted-foreground flex min-h-8 items-center border-y px-4 @sm:px-6";

export function CasheaOrderSheet({ order, isOpen, onOpenChange, actions }: CasheaOrderSheetProps) {
  const returnFocus = useRef<HTMLElement | null>(null);

  // Cierra el detalle antes de abrir el diálogo de la acción: nunca dos capas modales a la vez.
  const closeThen = (action: (order: CasheaOrder) => void) => (target: CasheaOrder) => {
    returnFocus.current = null;
    onOpenChange(false);
    action(target);
  };
  const sheetActions: CasheaOrderActions | undefined = actions && {
    onCollectOrder: closeThen(actions.onCollectOrder),
    onAdjustOrder: closeThen(actions.onAdjustOrder),
    onVoidOrder: closeThen(actions.onVoidOrder),
    onRevertDeposit: closeThen(actions.onRevertDeposit),
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        showCloseButton={false}
        className="@container w-full gap-0 motion-reduce:animate-none max-sm:border-l-0 sm:max-w-[32rem]"
        onOpenAutoFocus={() => {
          returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          returnFocus.current?.focus({ preventScroll: true });
          returnFocus.current = null;
        }}
      >
        {order && <CasheaOrderDetail order={order} isOpen={isOpen} actions={sheetActions} />}
      </SheetContent>
    </Sheet>
  );
}

function CasheaOrderDetail({
  order,
  isOpen,
  actions,
}: {
  order: CasheaOrder;
  isOpen: boolean;
  actions?: CasheaOrderActions;
}) {
  return (
    <>
      <SheetHeader className="flex-row items-start gap-3 border-b px-4 py-4 @sm:px-6">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <SheetTitle className="font-heading flex min-w-0 items-center gap-2 text-base leading-tight font-bold tracking-tight @sm:text-lg">
              <CasheaLogoIcon className="size-5" />
              <span className="min-w-0 [overflow-wrap:anywhere]">
                Orden <span className="sr-only">Cashea </span>#{order.order_number.replace(/^#+/, "")}
              </span>
            </SheetTitle>
            <CasheaOrderStatusBadge status={order.status} />
          </div>
          <SheetDescription className="mt-1 text-xs [overflow-wrap:anywhere]">
            Factura {order.invoice_number}
            <time dateTime={order.sale_date} className="block @sm:inline">
              <span aria-hidden="true" className="hidden @sm:inline">
                {" · "}
              </span>
              {formatCalendarDateString(order.sale_date)}
            </time>
          </SheetDescription>
        </div>
        <SheetClose asChild>
          <Button
            variant="ghost"
            size="icon-lg"
            className="text-muted-foreground -my-1 -me-2 size-11"
            aria-label="Cerrar"
          >
            <X aria-hidden="true" />
          </Button>
        </SheetClose>
      </SheetHeader>

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <CasheaOrderAmounts order={order} />
        <CasheaOrderProducts saleId={order.sale_id} isOpen={isOpen} />
        <div className="px-4 @sm:px-6">
          <CasheaOrderHistory order={order} />
        </div>
      </div>

      {actions && <CasheaOrderSheetFooter order={order} actions={actions} />}
    </>
  );
}

function CasheaOrderAmounts({ order }: { order: CasheaOrder }) {
  const commission = getCasheaCommissionUsd(order);
  const detail = [
    { label: "Total de la orden", value: formatCurrencyUSD(order.total_usd) },
    { label: "Inicial", value: formatCurrencyUSD(order.paid_today_usd) },
    { label: "Monto financiado", value: formatCurrencyUSD(order.financed_usd) },
    { label: "Comisión Cashea", value: formatCurrencyUSD(commission === 0 ? 0 : -commission) },
  ];

  return (
    <section>
      <h3 className={cn(SECTION_HEADING_CLASS_NAME, "justify-between border-t-0")}>
        Importes <span>USD</span>
      </h3>
      <dl className="bg-card">
        {detail.map(({ label, value }) => (
          <div
            key={label}
            className="border-border/40 flex min-h-8 items-center justify-between gap-3 border-b px-4 text-xs @sm:px-6"
          >
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="data-value text-end">{value}</dd>
          </div>
        ))}
        <div className="border-t-foreground/40 -mt-px flex min-h-10 items-center justify-between gap-3 border-y px-4 @sm:px-6">
          <dt className="text-xs font-semibold">Neto esperado</dt>
          <dd className="data-value text-end text-base font-semibold">{formatCurrencyUSD(order.expected_net_usd)}</dd>
        </div>
      </dl>
    </section>
  );
}

function CasheaOrderProducts({ saleId, isOpen }: { saleId: string; isOpen: boolean }) {
  const { data: lines, isPending, isError, isFetching, refetch } = useSaleLines(saleId, { enabled: isOpen });

  return (
    <section className="mt-4">
      <h3 className={cn(SECTION_HEADING_CLASS_NAME, "justify-between gap-3")}>
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

type HistoryEvent = {
  label: string;
  icon: LucideIcon;
  date?: string;
  note?: string | null;
  age?: string;
  isLate?: boolean;
};

function getHistoryEvents(order: CasheaOrder): HistoryEvent[] {
  const events: HistoryEvent[] = [{ label: "Orden registrada", icon: FileText, date: order.created_at }];

  if (order.status === "collected" && order.collected_at) {
    events.push({ label: "Cobrada en un Depósito Cashea", icon: Check, date: order.collected_at });
  }

  if (order.status === "voided" && order.voided_at) {
    const reason = order.void_reason && casheaVoidReasonLabels[order.void_reason];
    events.push({
      label: reason ? `Anulada · ${reason}` : "Anulada",
      icon: Ban,
      date: order.voided_at,
      note: order.void_note,
    });
  }

  if (order.status === "pending") {
    const ageDays = getCasheaOrderAgeDays(order.sale_date);
    events.push({
      label: "Esperando Depósito Cashea",
      icon: Clock,
      age: formatCasheaAgeDays(ageDays),
      isLate: isCasheaOrderLate(order, ageDays),
    });
  }

  return events.reverse();
}

function CasheaOrderHistory({ order }: { order: CasheaOrder }) {
  return (
    <section className="mt-6">
      <h3 className="font-heading mb-2 text-sm font-semibold">Actividad de la orden</h3>
      <ol className="divide-border/50 divide-y">
        {getHistoryEvents(order).map(({ icon: Icon, ...event }) => (
          <li
            key={event.label}
            className="grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-2 gap-y-0.5 py-2 text-xs @sm:grid-cols-[auto_minmax(0,1fr)_auto]"
          >
            <Icon aria-hidden="true" className="text-muted-foreground mt-0.5 size-3.5 self-start" />
            <span className="font-medium">{event.label}</span>
            <div className="tabular-value text-muted-foreground col-start-2 @sm:col-start-auto @sm:text-end">
              {event.date && <time dateTime={event.date}>{formatDateTime(event.date)}</time>}
              {event.age && (event.isLate ? <Badge variant="warning">{event.age}</Badge> : event.age)}
            </div>
            {event.note && (
              <p className="text-muted-foreground col-start-2 col-end-[-1] [overflow-wrap:anywhere] whitespace-pre-wrap">
                {event.note}
              </p>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

function CasheaOrderSheetFooter({ order, actions }: { order: CasheaOrder; actions: CasheaOrderActions }) {
  if (order.status === "voided") return null;

  return (
    <SheetFooter className="grid shrink-0 grid-cols-2 gap-2 border-t px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] @sm:grid-cols-[1fr_auto_auto] @sm:px-6">
      {order.status === "collected" ? (
        <Button
          variant="ghost"
          className={cn("col-span-full justify-self-end", DESTRUCTIVE_GHOST_CLASS_NAME)}
          onClick={() => actions.onRevertDeposit(order)}
        >
          <Undo2 data-icon="inline-start" aria-hidden="true" />
          Revertir depósito
        </Button>
      ) : (
        <>
          <Button
            variant="ghost"
            className={cn("@sm:justify-self-start", DESTRUCTIVE_GHOST_CLASS_NAME)}
            onClick={() => actions.onVoidOrder(order)}
          >
            <Ban data-icon="inline-start" aria-hidden="true" />
            Anular
          </Button>
          <Button variant="outline" onClick={() => actions.onAdjustOrder(order)}>
            <Pencil data-icon="inline-start" aria-hidden="true" />
            Ajustar
          </Button>
          <Button className="col-span-full @sm:col-span-1" onClick={() => actions.onCollectOrder(order)}>
            <Check data-icon="inline-start" aria-hidden="true" />
            Cobrar orden
          </Button>
        </>
      )}
    </SheetFooter>
  );
}
