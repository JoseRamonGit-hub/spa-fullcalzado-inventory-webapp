import { toast } from "sonner";
import { PasteSummary } from "@/components/icons/paste-summary";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { CasheaOrderFormApi } from "../hooks/use-cashea-order-form";

type PasteCasheaSummaryButtonProps = {
  orderForm: CasheaOrderFormApi;
  disabled?: boolean;
};

const LABEL = "Pegar resumen";
const CLIPBOARD_ERROR_MESSAGE = "No se pudo leer el portapapeles. Permite el acceso o escribe los datos a mano.";

/**
 * Lee el resumen copiado del panel de Cashea y rellena los campos de la Orden Cashea que reconoce. Acción secundaria
 * de solo icono: el nombre queda en la descripción emergente y en el nombre accesible.
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
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label={LABEL}
          disabled={disabled}
          onClick={pasteSummary}
        >
          <PasteSummary aria-hidden="true" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{LABEL}</TooltipContent>
    </Tooltip>
  );
}
