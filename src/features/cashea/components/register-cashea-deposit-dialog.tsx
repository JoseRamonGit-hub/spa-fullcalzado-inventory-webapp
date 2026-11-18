import { useStore } from "@tanstack/react-form";
import { Check } from "lucide-react";
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
      title={singleOrder ? `Cobrar orden Cashea #${singleOrder.order_number}` : "Registrar depósito Cashea"}
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
      <CasheaDialogSummary
        label="Órdenes del depósito"
        rows={[
          singleOrder
            ? { label: "Factura", value: <CasheaOrderInvoice order={singleOrder} /> }
            : { label: "Órdenes", value: formatInteger(orders.length) },
          { label: "Neto esperado", value: formatCurrencyUSD(preview.expectedNetUsd), isKey: true },
        ]}
      />

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

      {preview.receivedVes !== null && (
        <CasheaDialogSummary label="Vista previa del depósito" rows={previewRows} className="border-b-0 pb-0" />
      )}
    </ModalConfirmDialog>
  );
}
