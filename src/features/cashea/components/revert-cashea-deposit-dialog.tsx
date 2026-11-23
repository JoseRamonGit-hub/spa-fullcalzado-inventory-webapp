import { CasheaOrderNumber } from "@/features/cashea/components/cashea-order-number";
import { Undo2 } from "lucide-react";
import { toast } from "sonner";
import { ModalConfirmDialog } from "@/components/modals/shared/modal-ui";
import { getBusinessRuleErrorMessage } from "@/lib/errors";
import { formatCalendarDateString, formatCurrencyUSD, formatCurrencyVES } from "@/utils/formatters";
import { useCasheaNoteField } from "../hooks/use-cashea-note-field";
import { useRevertCasheaDeposit } from "../hooks/useCasheaMutations";
import { useCasheaDeposit } from "../hooks/useCasheaQueries";
import { CasheaDialogSummary } from "./cashea-dialog-summary";
import { CasheaBadgedLogo } from "./cashea-logo-icon";

const REVERT_ERROR_MESSAGE = "No se pudo revertir el Depósito Cashea. Revisa la conexión e intenta de nuevo.";

type RevertCasheaDepositDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  depositId: string;
};

export function RevertCasheaDepositDialog({ isOpen, onOpenChange, depositId }: RevertCasheaDepositDialogProps) {
  const { data: deposit } = useCasheaDeposit(depositId);
  const revertMutation = useRevertCasheaDeposit();
  const { note, noteField } = useCasheaNoteField({
    requiredMessage: "Escribe una nota para la reversión",
    placeholder: "Explica qué se registró mal",
    disabled: revertMutation.isPending,
  });
  const reversal = deposit && note ? { depositId, note } : null;

  async function revertDeposit() {
    if (!reversal) return;
    await revertMutation.mutateAsync(reversal);
    toast.success("Depósito Cashea revertido");
    onOpenChange(false);
  }

  const orderNumbers = deposit?.cashea_orders.map((order, index) => (
    <span key={order.order_number}>
      {index > 0 && ", "}
      <CasheaOrderNumber value={order.order_number} />
    </span>
  ));

  return (
    <ModalConfirmDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Revertir depósito Cashea"
      media={
        <CasheaBadgedLogo
          badgeIcon={<Undo2 strokeWidth={3} aria-hidden="true" />}
          badgeClassName="bg-destructive text-white"
        />
      }
      confirmLabel="Revertir depósito"
      pendingLabel="Revirtiendo..."
      submissionErrorMessage={(error) => getBusinessRuleErrorMessage(error, REVERT_ERROR_MESSAGE)}
      isSubmissionPending={revertMutation.isPending}
      onConfirmSubmit={revertDeposit}
      confirmDisabled={!reversal}
      variant="danger"
    >
      <CasheaDialogSummary
        label="Datos del depósito"
        rows={[
          {
            label: "Fecha",
            value: deposit ? (
              <>
                {formatCalendarDateString(deposit.deposit_date)}
                {deposit.reference && <span className="text-muted-foreground"> · {deposit.reference}</span>}
              </>
            ) : (
              "—"
            ),
          },
          { label: "Órdenes", value: orderNumbers?.length ? orderNumbers : "—" },
          { label: "Neto esperado", value: deposit ? formatCurrencyUSD(deposit.expected_net_usd) : "—" },
          { label: "Bolívares recibidos", value: deposit ? formatCurrencyVES(deposit.received_ves) : "—", isKey: true },
        ]}
      />

      {noteField}
    </ModalConfirmDialog>
  );
}
