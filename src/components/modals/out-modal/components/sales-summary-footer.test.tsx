import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { ModalExchangeRate } from "@/components/modals/shared/use-modal-exchange-rate";
import type { PendingSaleLine } from "../types";
import { SalesSummaryFooter } from "./sales-summary-footer";

const exchangeRate: ModalExchangeRate = {
  value: 90,
  isReady: true,
  isLoading: false,
  displayValue: "Bs. 90,00",
  statusTitle: "",
  statusMessage: "",
};

const saleLine: PendingSaleLine = {
  tempId: "line-1",
  productId: "product-1",
  code: "FC-01",
  description: "Producto 1",
  quantity: 1,
  priceUsd: 50,
  priceVes: 4_500,
  totalUsd: 50,
  totalVes: 4_500,
  availableStock: 5,
};

function renderFooter(isCasheaIncomplete: boolean) {
  render(
    <TooltipProvider>
      <SalesSummaryFooter
        pendingSaleLines={[saleLine]}
        exchangeRate={exchangeRate}
        isSubmissionPending={false}
        isCasheaIncomplete={isCasheaIncomplete}
        onOpenConfirmDialog={vi.fn()}
      />
    </TooltipProvider>,
  );
}

describe("SalesSummaryFooter", () => {
  it("no deja abrir la confirmación mientras falten datos de la Orden Cashea", () => {
    renderFooter(true);

    expect(screen.getByRole("button", { name: /Registrar venta/ })).toBeDisabled();
    expect(screen.getByText("Completa los datos de la Orden Cashea")).toBeInTheDocument();
  });

  it("deja abrir la confirmación cuando la venta está lista", () => {
    renderFooter(false);

    expect(screen.getByRole("button", { name: /Registrar venta/ })).toBeEnabled();
    expect(screen.getByText("1 producto listo para confirmar")).toBeInTheDocument();
  });
});
