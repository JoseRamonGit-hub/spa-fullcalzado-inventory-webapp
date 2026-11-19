import type { ReactNode } from "react";
import { Ban, Check, Pencil, Undo2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { CasheaOrder } from "@/types";
import { formatCurrencyUSD, formatDateTime } from "@/utils/formatters";
import {
  casheaVoidReasonLabels,
  formatCasheaAgeDays,
  getCasheaCommissionUsd,
  getCasheaOrderAgeDays,
  isCasheaOrderLate,
} from "../cashea-receivables";
import { CasheaDialogSummary, CasheaOrderInvoice } from "./cashea-dialog-summary";
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

const SECTION_TITLE_CLASS_NAME = "text-muted-foreground mb-2 text-[10px] font-semibold tracking-wide uppercase";
const DESTRUCTIVE_GHOST_CLASS_NAME = "text-destructive hover:bg-destructive/10 hover:text-destructive";

export function CasheaOrderSheet({ order, isOpen, onOpenChange, actions }: CasheaOrderSheetProps) {
  // Cierra el detalle antes de abrir el diálogo de la acción: nunca dos capas modales a la vez.
  const closeThen = (action: (order: CasheaOrder) => void) => (target: CasheaOrder) => {
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
      <SheetContent className="w-full gap-0 sm:max-w-sm">
        {order && <CasheaOrderDetail order={order} actions={sheetActions} />}
      </SheetContent>
    </Sheet>
  );
}

function CasheaOrderDetail({ order, actions }: { order: CasheaOrder; actions?: CasheaOrderActions }) {
  const footer = actions && <CasheaOrderSheetFooter order={order} actions={actions} />;

  return (
    <>
      <SheetHeader className="flex-row items-center gap-3 border-b p-4 pe-12">
        {/* Solo sombra: un aro sobre el amarillo lo ensucia, igual que en los diálogos Cashea. */}
        <CasheaLogoIcon className="size-10 rounded-lg shadow-sm" />
        <div className="flex min-w-0 flex-col gap-0.5">
          <SheetTitle className="flex items-center gap-2 text-sm">
            Orden <span className="product-code">{order.order_number}</span>
            <CasheaOrderStatusBadge status={order.status} />
          </SheetTitle>
          <SheetDescription className="truncate text-xs">
            Factura <CasheaOrderInvoice order={order} />
          </SheetDescription>
        </div>
      </SheetHeader>

      <div className="custom-scrollbar flex flex-1 flex-col gap-5 overflow-y-auto p-4">
        <section>
          <h3 className={SECTION_TITLE_CLASS_NAME}>Importes</h3>
          <CasheaDialogSummary
            label="Importes de la orden"
            className="border-b-0 pb-0"
            rows={[
              { label: "Total de la orden", value: formatCurrencyUSD(order.total_usd) },
              { label: "Cobrado hoy", value: formatCurrencyUSD(order.paid_today_usd) },
              { label: "Monto financiado", value: formatCurrencyUSD(order.financed_usd) },
              { label: "Comisión Cashea", value: `−${formatCurrencyUSD(getCasheaCommissionUsd(order))}` },
              { label: "Neto esperado", value: formatCurrencyUSD(order.expected_net_usd), isKey: true },
            ]}
          />
        </section>

        <section>
          <h3 className={SECTION_TITLE_CLASS_NAME}>Historial</h3>
          <CasheaOrderHistory order={order} />
        </section>
      </div>

      {footer}
    </>
  );
}

type HistoryEvent = { label: ReactNode; date?: string; note?: string | null; isNext?: boolean };

function getHistoryEvents(order: CasheaOrder): HistoryEvent[] {
  const events: HistoryEvent[] = [{ label: "Orden registrada", date: order.created_at }];

  if (order.status === "collected" && order.collected_at) {
    events.push({ label: "Cobrada en un Depósito Cashea", date: order.collected_at });
  }

  if (order.status === "voided" && order.voided_at) {
    const reason = order.void_reason ? ` · ${casheaVoidReasonLabels[order.void_reason]}` : "";
    events.push({ label: `Anulada${reason}`, date: order.voided_at, note: order.void_note });
  }

  if (order.status === "pending") {
    const ageDays = getCasheaOrderAgeDays(order.sale_date);
    const age = formatCasheaAgeDays(ageDays);
    events.push({
      label: (
        <>
          Esperando Depósito Cashea{" "}
          {isCasheaOrderLate(order, ageDays) ? (
            <Badge variant="warning">{age}</Badge>
          ) : (
            <span className="tabular-value">· {age}</span>
          )}
        </>
      ),
      isNext: true,
    });
  }

  return events;
}

function CasheaOrderHistory({ order }: { order: CasheaOrder }) {
  return (
    <ol className="flex flex-col gap-2.5 text-sm">
      {getHistoryEvents(order).map((event, index) => (
        <li key={index} className="grid grid-cols-[0.5rem_1fr_auto] items-baseline gap-x-2.5">
          <span
            aria-hidden="true"
            className={cn(
              "size-2 translate-y-px self-center rounded-full",
              event.isNext ? "border-muted-foreground/50 border border-dashed" : "bg-primary",
            )}
          />
          <span className={cn("min-w-0", event.isNext && "text-muted-foreground")}>{event.label}</span>
          {event.date ? (
            <time dateTime={event.date} className="text-muted-foreground tabular-value text-xs">
              {formatDateTime(event.date)}
            </time>
          ) : (
            <span />
          )}
          {event.note ? (
            <p className="text-muted-foreground col-start-2 col-end-4 mt-0.5 text-xs">{event.note}</p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

function CasheaOrderSheetFooter({ order, actions }: { order: CasheaOrder; actions: CasheaOrderActions }) {
  if (order.status === "voided") return null;

  return (
    <SheetFooter className="bg-muted/60 flex-row items-center gap-2 border-t px-4 py-3">
      {order.status === "collected" ? (
        <Button
          variant="ghost"
          className={cn("ms-auto", DESTRUCTIVE_GHOST_CLASS_NAME)}
          onClick={() => actions.onRevertDeposit(order)}
        >
          <Undo2 data-icon="inline-start" aria-hidden="true" />
          Revertir depósito
        </Button>
      ) : (
        <>
          <Button variant="ghost" className={DESTRUCTIVE_GHOST_CLASS_NAME} onClick={() => actions.onVoidOrder(order)}>
            <Ban data-icon="inline-start" aria-hidden="true" />
            Anular
          </Button>
          <Button variant="outline" className="ms-auto" onClick={() => actions.onAdjustOrder(order)}>
            <Pencil data-icon="inline-start" aria-hidden="true" />
            Ajustar
          </Button>
          <Button onClick={() => actions.onCollectOrder(order)}>
            <Check data-icon="inline-start" aria-hidden="true" />
            Cobrar orden
          </Button>
        </>
      )}
    </SheetFooter>
  );
}
