import { CasheaOrderNumber } from "@/features/cashea/components/cashea-order-number";
import { useStore } from "@tanstack/react-form";
import { Check, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { ModalConfirmDialog } from "@/components/modals/shared/modal-ui";
import { useAppForm } from "@/hooks/form";
import { getBusinessRuleErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";
import type { CasheaOrder } from "@/types";
import { formatCurrencyUSD, formatCurrencyVES, formatDateForBackend, formatInteger } from "@/utils/formatters";
import { draftFieldOptions } from "@/utils/form-validators";
import { createCasheaDepositDraft, evaluateCasheaDepositDraft, type CasheaDepositDraft } from "../cashea-deposit-draft";
import { useRegisterCasheaDeposit } from "../hooks/useCasheaMutations";
import { CasheaDialogSummary, CasheaOrderInvoice, type CasheaDialogSummaryRow } from "./cashea-dialog-summary";
import { getCasheaOrderAmountRows } from "./cashea-order-amount-rows";
import { CasheaBadgedLogo } from "./cashea-logo-icon";

const REGISTER_ERROR_MESSAGE = "No se pudo registrar el Depósito Cashea. Revisa la conexión e intenta de nuevo.";

const BS_INPUT_PROPS = {
  compact: true,
  leftAddon: "Bs.",
  inputMode: "decimal",
  autoComplete: "off",
  className: "text-sm tabular-nums",
} as const;

type RegisterCasheaDepositDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  orders: CasheaOrder[];
  onRegistered?: () => void;
};

export function RegisterCasheaDepositDialog({
  isOpen,
  onOpenChange,
  orders,
  onRegistered,
}: RegisterCasheaDepositDialogProps) {
  const today = formatDateForBackend(new Date());
  const form = useAppForm({ defaultValues: createCasheaDepositDraft(today) });
  const draft = useStore(form.store, (state) => state.values);
  const { preview, deposit } = evaluateCasheaDepositDraft(draft, orders, today);
  const registerMutation = useRegisterCasheaDeposit();
  const [singleOrder] = orders.length === 1 ? orders : [];

  const fieldOptions = <TName extends keyof CasheaDepositDraft>(name: TName) =>
    draftFieldOptions(
      name,
      () => form.state.values,
      (values) => evaluateCasheaDepositDraft(values, orders, today).fieldErrors,
    );

  async function registerDeposit() {
    if (!deposit) return;
    await registerMutation.mutateAsync(deposit);
    toast.success(singleOrder ? "Orden Cashea cobrada" : `${formatInteger(orders.length)} órdenes Cashea cobradas`);
    onRegistered?.();
    onOpenChange(false);
  }

  const previewRows: CasheaDialogSummaryRow[] = [
    { label: "Tasa implícita", value: preview.impliedRate === null ? "—" : formatCurrencyVES(preview.impliedRate) },
  ];
  if (preview.receivedUsd !== null && preview.differenceUsd !== null) {
    previewRows.push(
      { label: "Equivalente recibido", value: formatCurrencyUSD(preview.receivedUsd) },
      {
        label: "Comisiones y ajustes",
        value: (
          <span className={cn(preview.hasDiscrepancy && "bg-warning/20 text-warning-foreground rounded-sm px-1")}>
            {formatCurrencyUSD(preview.differenceUsd)}
          </span>
        ),
        isKey: true,
      },
    );
  }

  return (
    <ModalConfirmDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={
        singleOrder ? (
          <>
            Cobrar orden Cashea <CasheaOrderNumber value={singleOrder.order_number} />
          </>
        ) : (
          "Registrar depósito Cashea"
        )
      }
      media={
        <CasheaBadgedLogo
          badgeIcon={<Check strokeWidth={3} aria-hidden="true" />}
          badgeClassName="bg-success text-success-foreground"
        />
      }
      confirmLabel="Registrar depósito"
      pendingLabel="Registrando..."
      submissionErrorMessage={(error) => getBusinessRuleErrorMessage(error, REGISTER_ERROR_MESSAGE)}
      isSubmissionPending={registerMutation.isPending}
      onConfirmSubmit={registerDeposit}
      confirmDisabled={!deposit}
    >
      {singleOrder ? (
        <CasheaDialogSummary
          label="Orden del depósito"
          rows={[
            { label: "Factura", value: <CasheaOrderInvoice order={singleOrder} /> },
            { label: "Neto esperado", value: formatCurrencyUSD(preview.expectedNetUsd), isKey: true },
          ]}
        />
      ) : (
        <section aria-label="Órdenes del depósito" className="bg-card overflow-hidden rounded-md border text-sm">
          <div className="bg-muted/60 text-muted-foreground flex justify-between gap-3 border-b px-3 py-2 text-xs">
            <h3>Órdenes ({formatInteger(orders.length)})</h3>
            <span>Neto esperado</span>
          </div>
          <div className="custom-scrollbar max-h-[min(34dvh,16rem)] divide-y overflow-y-auto">
            {orders.map((order) => (
              <details key={order.id} name="cashea-deposit-breakdown" className="group open:bg-muted/35">
                <summary className="hover:bg-muted/40 focus-visible:outline-ring flex min-h-9 cursor-pointer list-none items-center gap-2 px-3 py-1.5 focus-visible:outline-2 focus-visible:-outline-offset-2 [&::-webkit-details-marker]:hidden">
                  <ChevronRight
                    aria-hidden="true"
                    className="text-muted-foreground size-4 shrink-0 group-open:rotate-90"
                  />
                  <span className="min-w-0 flex-1 break-all">
                    <CasheaOrderNumber value={order.order_number} />
                  </span>
                  <span className="data-value">{formatCurrencyUSD(order.expected_net_usd)}</span>
                </summary>
                <div className="pb-2 pr-3 pl-9 text-xs">
                  <p className="text-muted-foreground mb-1 break-words">
                    Factura <CasheaOrderInvoice order={order} />
                  </p>
                  <dl>
                    {getCasheaOrderAmountRows(order).map(({ label, value }) => (
                      <div key={label} className="flex items-baseline justify-between gap-3 py-1">
                        <dt className="text-muted-foreground">{label}</dt>
                        <dd className="data-value">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </details>
            ))}
          </div>
          <div className="bg-muted/45 border-foreground/25 flex justify-between gap-3 border-t px-3 py-2 font-semibold">
            <span>Neto total del depósito</span>
            <span className="data-value">{formatCurrencyUSD(preview.expectedNetUsd)}</span>
          </div>
        </section>
      )}

      <fieldset disabled={registerMutation.isPending} className="grid min-w-0 grid-cols-2 items-start gap-3">
        <form.AppField {...fieldOptions("receivedVes")}>
          {(field) => <field.TextFieldGroup label="Bolívares recibidos" placeholder="0,00" {...BS_INPUT_PROPS} />}
        </form.AppField>

        <form.AppField {...fieldOptions("depositDate")}>
          {(field) => (
            <field.TextField label="Fecha del depósito" type="date" max={today} compact className="text-sm" />
          )}
        </form.AppField>

        <form.AppField {...fieldOptions("appliedRate")}>
          {(field) => <field.TextFieldGroup label="Tasa aplicada" placeholder="Opcional" {...BS_INPUT_PROPS} />}
        </form.AppField>

        <form.AppField {...fieldOptions("reference")}>
          {(field) => (
            <field.TextField label="Referencia" placeholder="Opcional" autoComplete="off" compact className="text-sm" />
          )}
        </form.AppField>
      </fieldset>

      {preview.receivedVes !== null && <CasheaDialogSummary label="Vista previa del depósito" rows={previewRows} />}
    </ModalConfirmDialog>
  );
}
