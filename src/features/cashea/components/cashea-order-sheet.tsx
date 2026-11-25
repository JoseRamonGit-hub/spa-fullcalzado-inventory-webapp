import { CasheaOrderNumber } from "@/features/cashea/components/cashea-order-number";
import { getCasheaOrderAmountRows } from "./cashea-order-amount-rows";
import { useRef } from "react";
import { Ban, Check, Pencil, Undo2, X } from "lucide-react";
import { ActivityTimeline } from "@/components/ui/activity-timeline";
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
import { CasheaOrderProducts } from "./cashea-order-products";
import { formatCalendarDateString, formatCurrencyUSD, formatDateTime } from "@/utils/formatters";
import {
  casheaVoidReasonLabels,
  formatCasheaAgeDays,
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
  onOpenChange: (isOpen: boolean) => void | Promise<void>;
  /** Sin acciones, el detalle es solo de consulta. */
  actions?: CasheaOrderActions;
  unavailable?: { message: string; onRetry?: () => void; isRetrying: boolean };
};

const DESTRUCTIVE_GHOST_CLASS_NAME = "text-destructive hover:bg-destructive/10 hover:text-destructive";
const SECTION_HEADING_CLASS_NAME =
  "bg-muted operational-label text-muted-foreground flex min-h-8 items-center border-y px-4 @sm:px-6";

export function CasheaOrderSheet({ order, isOpen, onOpenChange, actions, unavailable }: CasheaOrderSheetProps) {
  const returnFocus = useRef<HTMLElement | null>(null);

  // Cierra el detalle antes de abrir el diálogo de la acción: nunca dos capas modales a la vez.
  const closeThen = (action: (order: CasheaOrder) => void) => async (target: CasheaOrder) => {
    returnFocus.current = null;
    await onOpenChange(false);
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
        <SheetHeader className="flex-row items-start gap-3 border-b px-4 py-4 @sm:px-6">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <SheetTitle className="font-heading flex min-w-0 items-center gap-2 text-base leading-tight font-bold tracking-tight @sm:text-lg">
                <CasheaLogoIcon className="size-5" />
                <span className="min-w-0 [overflow-wrap:anywhere]">
                  {order ? (
                    <>
                      Orden <span className="sr-only">Cashea </span>
                      <CasheaOrderNumber value={order.order_number} />
                    </>
                  ) : (
                    "Orden Cashea"
                  )}
                </span>
              </SheetTitle>
              {order && <CasheaOrderStatusBadge status={order.status} />}
            </div>
            <SheetDescription className="mt-1 text-xs [overflow-wrap:anywhere]">
              {order ? (
                <>
                  Factura {order.invoice_number}
                  <time dateTime={order.sale_date} className="block @sm:inline">
                    <span aria-hidden="true" className="hidden @sm:inline">
                      {" · "}
                    </span>
                    {formatCalendarDateString(order.sale_date)}
                  </time>
                </>
              ) : (
                <span role="status">{unavailable?.message}</span>
              )}
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
        {order && <CasheaOrderDetail order={order} isOpen={isOpen} actions={sheetActions} />}
        {!order && unavailable?.onRetry && (
          <Button
            variant="outline"
            className="mx-4 mt-4 self-start @sm:mx-6"
            onClick={unavailable.onRetry}
            disabled={unavailable.isRetrying}
          >
            Reintentar
          </Button>
        )}
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
      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <CasheaOrderAmounts order={order} />
        <div className="mt-4">
          <CasheaOrderProducts saleId={order.sale_id} isOpen={isOpen} />
        </div>
        <div className="px-4 @sm:px-6">
          <CasheaOrderHistory order={order} />
        </div>
      </div>

      {actions && <CasheaOrderSheetFooter order={order} actions={actions} />}
    </>
  );
}

function CasheaOrderAmounts({ order }: { order: CasheaOrder }) {
  const detail = getCasheaOrderAmountRows(order);

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

type HistoryEvent = {
  label: string;
  date?: string;
  note?: string | null;
  age?: string;
  isLate?: boolean;
};

function getHistoryEvents(order: CasheaOrder): HistoryEvent[] {
  const events: HistoryEvent[] = [{ label: "Orden registrada", date: order.created_at }];

  if (order.status === "collected" && order.collected_at) {
    events.push({ label: "Cobrada en un Depósito Cashea", date: order.collected_at });
  }

  if (order.status === "voided" && order.voided_at) {
    const reason = order.void_reason && casheaVoidReasonLabels[order.void_reason];
    events.push({
      label: reason ? `Anulada · ${reason}` : "Anulada",
      date: order.voided_at,
      note: order.void_note,
    });
  }

  if (order.status === "pending") {
    const ageDays = getCasheaOrderAgeDays(order.sale_date);
    events.push({
      label: "Esperando Depósito Cashea",
      age: formatCasheaAgeDays(ageDays),
      isLate: isCasheaOrderLate(order, ageDays),
    });
  }

  return events.reverse();
}

function CasheaOrderHistory({ order }: { order: CasheaOrder }) {
  return (
    <ActivityTimeline
      title="Actividad de la orden"
      events={getHistoryEvents(order).map((event) => ({
        id: event.label,
        label: event.label,
        metadata: event.date ? (
          <time dateTime={event.date}>{formatDateTime(event.date)}</time>
        ) : event.isLate ? (
          <Badge variant="warning">{event.age}</Badge>
        ) : (
          event.age
        ),
        note: event.note,
      }))}
    />
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
