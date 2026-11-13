import casheaLogo from "@/assets/cashea_logos/cashea_logo_512x512.webp";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CasheaOrderFields } from "@/features/cashea/components/cashea-order-fields";
import { PasteCasheaSummaryButton } from "@/features/cashea/components/paste-cashea-summary-button";
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
  return (
    <section className="bg-card rounded-md border">
      <div className="flex items-center gap-3 p-3">
        <img src={casheaLogo} alt="" aria-hidden="true" className="size-9 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1">
          <Label htmlFor="out-modal-cashea-payment" className="text-sm font-semibold">
            Pago con Cashea
          </Label>
          <p className="text-muted-foreground text-xs">
            {isCasheaPayment
              ? "Pega el resumen «Debe pagar» de la orden o escribe los datos."
              : "Actívalo si el cliente financia parte de la compra con Cashea."}
          </p>
        </div>
        {isCasheaPayment && <PasteCasheaSummaryButton orderForm={orderForm} disabled={disabled} />}
        <Switch
          id="out-modal-cashea-payment"
          checked={isCasheaPayment}
          onCheckedChange={onCasheaPaymentChange}
          disabled={disabled}
        />
      </div>

      {isCasheaPayment && (
        <div className="border-t p-3">
          <CasheaOrderFields orderForm={orderForm} disabled={disabled} />
        </div>
      )}
    </section>
  );
}
