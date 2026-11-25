import { useId } from "react";
import { Switch } from "@/components/ui/switch";
import { CasheaOrderSection } from "@/features/cashea/components/cashea-order-section";
import type { CasheaOrderFormApi } from "@/features/cashea/hooks/use-cashea-order-form";

type CasheaPaymentSectionProps = {
  isCasheaPayment: boolean;
  onCasheaPaymentChange: (isCasheaPayment: boolean) => void;
  orderForm: CasheaOrderFormApi;
  disabled?: boolean;
};

export function CasheaPaymentSection({
  isCasheaPayment,
  onCasheaPaymentChange,
  orderForm,
  disabled = false,
}: CasheaPaymentSectionProps) {
  const titleId = useId();

  return (
    <CasheaOrderSection
      title="Pago con Cashea"
      orderForm={orderForm}
      titleId={titleId}
      showFields={isCasheaPayment}
      disabled={disabled}
      action={
        <Switch
          aria-labelledby={titleId}
          checked={isCasheaPayment}
          onCheckedChange={onCasheaPaymentChange}
          disabled={disabled}
          className="enabled:cursor-pointer enabled:data-[state=unchecked]:after:absolute enabled:data-[state=unchecked]:after:inset-0"
        />
      }
    />
  );
}
