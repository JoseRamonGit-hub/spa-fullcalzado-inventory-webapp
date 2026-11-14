import { Switch } from "@/components/ui/switch";
import { CasheaOrderSection } from "@/features/cashea/components/cashea-order-section";
import type { CasheaOrderFormApi } from "@/features/cashea/hooks/use-cashea-order-form";

type CasheaPaymentSectionProps = {
  isCasheaPayment: boolean;
  onCasheaPaymentChange: (isCasheaPayment: boolean) => void;
  orderForm: CasheaOrderFormApi;
  disabled?: boolean;
};

const SWITCH_ID = "out-modal-cashea-payment";

export function CasheaPaymentSection({
  isCasheaPayment,
  onCasheaPaymentChange,
  orderForm,
  disabled = false,
}: CasheaPaymentSectionProps) {
  return (
    <CasheaOrderSection
      title="Pago con Cashea"
      description={
        isCasheaPayment
          ? "Pega el resumen «Debe pagar» de la orden o escribe los datos."
          : "Actívalo si el cliente financia parte de la compra con Cashea."
      }
      orderForm={orderForm}
      titleFor={SWITCH_ID}
      showFields={isCasheaPayment}
      disabled={disabled}
      action={
        <Switch id={SWITCH_ID} checked={isCasheaPayment} onCheckedChange={onCasheaPaymentChange} disabled={disabled} />
      }
    />
  );
}
