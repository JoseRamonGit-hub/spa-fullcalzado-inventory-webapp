import { Plus } from "lucide-react";
import { toast } from "sonner";
import { COMPACT_FIELD_LABEL_CLASS_NAME } from "@/components/forms/field-wrapper";
import { ModalConfirmDialog } from "@/components/modals/shared/modal-ui";
import { getSalesSummary } from "@/features/transactions/sales-display";
import { getBusinessRuleErrorMessage } from "@/lib/errors";
import type { TransactionWithRelations } from "@/types";
import { formatCalendarDateString, formatCurrencyUSD } from "@/utils/formatters";
import { useConfirmableCasheaOrderForm } from "../hooks/use-cashea-order-form";
import { useAttachCasheaOrder } from "../hooks/useCasheaMutations";
import { CasheaBadgedLogo } from "./cashea-logo-icon";
import { CasheaOrderFormCard } from "./cashea-order-form-card";

const ATTACH_ERROR_MESSAGE = "No se pudo asociar la Orden Cashea. Revisa la conexión e intenta de nuevo.";

type AttachCasheaOrderDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  saleId: string;
  saleLines: TransactionWithRelations[];
};

export function AttachCasheaOrderDialog({ isOpen, onOpenChange, saleId, saleLines }: AttachCasheaOrderDialogProps) {
  const { grossUsd: saleTotalUsd } = getSalesSummary(saleLines, []);
  const saleDate = saleLines[0]?.date;

  const orderForm = useConfirmableCasheaOrderForm(saleTotalUsd);
  const order = orderForm.confirmedOrder;
  const attachMutation = useAttachCasheaOrder();

  async function attachOrder() {
    if (!order) return;
    await attachMutation.mutateAsync({ saleId, order });
    toast.success("Orden Cashea asociada a la venta");
    onOpenChange(false);
  }

  return (
    <ModalConfirmDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Asociar venta a orden Cashea"
      media={
        <CasheaBadgedLogo
          badgeIcon={<Plus strokeWidth={3} aria-hidden="true" />}
          badgeClassName="bg-success text-success-foreground"
        />
      }
      confirmLabel="Asociar orden"
      pendingLabel="Asociando..."
      submissionErrorMessage={(error) => getBusinessRuleErrorMessage(error, ATTACH_ERROR_MESSAGE)}
      isSubmissionPending={attachMutation.isPending}
      onConfirmSubmit={attachOrder}
      confirmDisabled={!order}
    >
      {/* Todos los renglones a la vista, sin desplazamiento: el código y el nombre identifican la venta. Sin raya debajo:
          el total en negrita ya cierra el bloque, y una segunda raya lo encerraba en una franja. */}
      <section aria-label="Datos de la venta" className="flex flex-col gap-1 pb-1 text-sm">
        {/* El conteo acompaña a la fecha: solo sobre los montos se leía como encabezado de columna. */}
        <div className="mb-1 flex items-baseline justify-between gap-4">
          <p className={COMPACT_FIELD_LABEL_CLASS_NAME}>
            {saleLines.length} {saleLines.length === 1 ? "producto" : "productos"}
          </p>
          <p className="text-muted-foreground text-xs">{formatCalendarDateString(saleDate)}</p>
        </div>
        {/* Subgrid: la columna del código toma el ancho del más largo y los nombres arrancan todos a la misma altura. */}
        <ul aria-label="Productos" className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-x-3 gap-y-1">
          {saleLines.map((line) => (
            <li key={line.id} className="col-span-3 grid grid-cols-subgrid items-baseline">
              <span className="product-code uppercase">{line.products.code}</span>
              {/* La cantidad va aparte para que no se corte cuando el nombre no cabe. */}
              <span className="text-muted-foreground flex min-w-0 gap-1">
                <span className="truncate">{line.products.description}</span>
                {line.quantity > 1 && <span className="tabular-value shrink-0">× {line.quantity}</span>}
              </span>
              <span className="data-value text-right">{formatCurrencyUSD(line.price_usd * line.quantity)}</span>
            </li>
          ))}
        </ul>
        {/* La raya separa la suma de los renglones: sin ella el total se leía como un producto más. */}
        <dl className="mt-1 flex justify-between gap-4 border-t pt-2">
          <dt className="font-semibold">Total de la venta</dt>
          <dd className="data-value text-right font-semibold">{formatCurrencyUSD(saleTotalUsd)}</dd>
        </dl>
      </section>

      <CasheaOrderFormCard orderForm={orderForm} disabled={attachMutation.isPending} />
    </ModalConfirmDialog>
  );
}
