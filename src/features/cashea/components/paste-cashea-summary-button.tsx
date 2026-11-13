import { ClipboardPaste } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { CasheaOrderFormApi } from "../hooks/use-cashea-order-form";

type PasteCasheaSummaryButtonProps = {
  orderForm: CasheaOrderFormApi;
  disabled?: boolean;
};

const CLIPBOARD_ERROR_MESSAGE = "No se pudo leer el portapapeles. Permite el acceso o escribe los datos a mano.";

/**
 * Lee el resumen copiado del panel de Cashea y rellena los campos de la Orden Cashea que reconoce. Acción secundaria:
 * va en el encabezado de quien muestra `CasheaOrderFields`.
 */
export function PasteCasheaSummaryButton({ orderForm, disabled = false }: PasteCasheaSummaryButtonProps) {
  // El texto del portapapeles solo se analiza: no se guarda en ningún estado.
  async function pasteSummary() {
    try {
      orderForm.fillFromSummary(await navigator.clipboard.readText());
    } catch {
      toast.error(CLIPBOARD_ERROR_MESSAGE);
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={pasteSummary}>
      <ClipboardPaste />
      Pegar resumen
    </Button>
  );
}
