import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CasheaOrderFields } from "@/features/cashea/components/cashea-order-fields";
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
    <section className="bg-card flex flex-col gap-3 rounded-md border p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <Label htmlFor="out-modal-cashea-payment" className="text-sm font-semibold">
            Pago con Cashea
          </Label>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {isCasheaPayment
              ? "Pega el resumen «Debe pagar» de la orden y revisa los datos, o escríbelos a mano."
              : "Actívalo si el cliente financia parte de la compra con Cashea."}
          </p>
        </div>
        <Switch
          id="out-modal-cashea-payment"
          checked={isCasheaPayment}
          onCheckedChange={onCasheaPaymentChange}
          disabled={disabled}
        />
      </div>

      {isCasheaPayment && <CasheaOrderFields orderForm={orderForm} disabled={disabled} />}
    </section>
  );
}
