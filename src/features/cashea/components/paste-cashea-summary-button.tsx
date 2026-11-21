import { toast } from "sonner";
import { PasteSummary } from "@/components/icons/paste-summary";
import { Button } from "@/components/ui/button";
import type { CasheaOrderFormApi } from "../hooks/use-cashea-order-form";

type PasteCasheaSummaryButtonProps = {
  orderForm: CasheaOrderFormApi;
  disabled?: boolean;
};

const LABEL = "Pegar resumen";
const CLIPBOARD_ERROR_MESSAGE = "No se pudo leer el portapapeles. Permite el acceso o escribe los datos a mano.";

export function PasteCasheaSummaryButton({ orderForm, disabled = false }: PasteCasheaSummaryButtonProps) {
  // El texto del portapapeles solo se analiza: no se guarda en ningún estado.
  async function pasteSummary() {
    try {
      const filled = orderForm.fillFromSummary(await navigator.clipboard.readText());
      if (filled === 0) {
        toast.error("No se reconocieron datos. Copia el resumen de la orden en Cashea y vuelve a pegarlo.");
      } else {
        toast.success(`Datos pegados: ${filled} de 5 campos. Revisa la orden.`);
      }
    } catch {
      toast.error(CLIPBOARD_ERROR_MESSAGE);
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={pasteSummary}>
      <PasteSummary aria-hidden="true" />
      {LABEL}
    </Button>
  );
}
