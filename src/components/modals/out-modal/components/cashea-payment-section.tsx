import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CasheaOrderFields } from "@/features/cashea/components/cashea-order-fields";
import type { CasheaOrderEvaluation } from "@/features/cashea/cashea-order-draft";
import type { CasheaOrderForm } from "@/features/cashea/hooks/use-cashea-order-form";

type CasheaPaymentSectionProps = {
  isCasheaPayment: boolean;
  onCasheaPaymentChange: (isCasheaPayment: boolean) => void;
  form: CasheaOrderForm;
  evaluation: CasheaOrderEvaluation;
  disabled?: boolean;
};

export function CasheaPaymentSection({
  isCasheaPayment,
  onCasheaPaymentChange,
  form,
  evaluation,
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
              ? "Copia los datos del resumen «Debe pagar» de la orden en Cashea."
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

      {isCasheaPayment && <CasheaOrderFields form={form} evaluation={evaluation} disabled={disabled} />}
    </section>
  );
}
