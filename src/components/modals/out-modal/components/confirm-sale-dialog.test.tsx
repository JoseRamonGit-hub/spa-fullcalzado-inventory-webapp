import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import type { Business, CasheaOrderInput, User } from "@/types";
import { formatCurrencyUSD } from "@/utils/formatters";
import type { ModalExchangeRate } from "@/components/modals/shared/use-modal-exchange-rate";
import { businessKeys } from "@/features/business/hooks/useBusinessQueries";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useBusinessStore } from "@/features/business/store/useBusinessStore";
import { ConfirmSaleDialog } from "./confirm-sale-dialog";
import type { PendingSaleLine } from "../types";
import { TooltipProvider } from "@/components/ui/tooltip";

const USER_ID = "user-1";
const BUSINESS_ID = "business-1";

const user = {
  id: USER_ID,
  email: "cajero@example.com",
  fullname: "Cajero",
  role: "employee",
  is_active: true,
  default_business_id: BUSINESS_ID,
  created_at: "2026-08-08T00:00:00Z",
} as User;

const business = {
  id: BUSINESS_ID,
  name: "Full Calzado",
  slug: "full-calzado",
  is_active: true,
  created_at: "2026-08-08T00:00:00Z",
  updated_at: "2026-08-08T00:00:00Z",
} as Business;

const saleLines: PendingSaleLine[] = [
  {
    tempId: "line-1",
    productId: "product-1",
    code: "FC-01",
    description: "Producto 1",
    quantity: 2,
    priceUsd: 20,
    priceVes: 1_800,
    totalUsd: 40,
    totalVes: 3_600,
    availableStock: 5,
  },
  {
    tempId: "line-2",
    productId: "product-2",
    code: "FC-02",
    description: "Producto 2",
    quantity: 1,
    priceUsd: 35,
    priceVes: 3_150,
    totalUsd: 35,
    totalVes: 3_150,
    availableStock: 4,
  },
];

const exchangeRate: ModalExchangeRate = {
  value: 90,
  isReady: true,
  isLoading: false,
  displayValue: "Bs. 90,00",
  statusTitle: "",
  statusMessage: "",
};

const casheaOrder: CasheaOrderInput = {
  order_number: "6400685",
  invoice_number: "551-000738",
  total_usd: 75,
  paid_today_usd: 25,
  financed_usd: 50,
};

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  queryClient.setQueryData(businessKeys.accessible(USER_ID), [business]);

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>{children}</TooltipProvider>
      </QueryClientProvider>
    );
  };
}

describe("ConfirmSaleDialog", () => {
  beforeAll(() => {
    vi.stubGlobal(
      "ResizeObserver",
      class ResizeObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });

  beforeEach(() => {
    useAuthStore.setState({ user });
    useBusinessStore.setState({ userId: USER_ID, activeBusinessId: BUSINESS_ID });
  });

  it("presenta varios productos como renglones de venta", () => {
    render(
      <ConfirmSaleDialog
        isOpen
        onOpenChange={vi.fn()}
        pendingSaleLines={saleLines}
        exchangeRate={{
          value: 90,
          isReady: true,
          isLoading: false,
          displayValue: "Bs. 90,00",
          statusTitle: "",
          statusMessage: "",
        }}
        totalAmountUsd={75}
        totalAmountVes={6_750}
        isSubmissionPending={false}
        onConfirmSubmit={vi.fn()}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByRole("heading", { name: "Confirmar venta" })).toBeInTheDocument();
    expect(screen.getByText("2 renglones de venta")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Registrar venta" })).toBeInTheDocument();
  });

  describe("Venta Cashea", () => {
    function renderCasheaDialog(options: { casheaSaleTotalMismatch?: boolean; order?: CasheaOrderInput } = {}) {
      render(
        <ConfirmSaleDialog
          isOpen
          onOpenChange={vi.fn()}
          pendingSaleLines={saleLines}
          exchangeRate={exchangeRate}
          totalAmountUsd={75}
          totalAmountVes={6_750}
          casheaOrder={options.order ?? casheaOrder}
          casheaSaleTotalMismatch={options.casheaSaleTotalMismatch ?? false}
          isSubmissionPending={false}
          onConfirmSubmit={vi.fn()}
        />,
        { wrapper: createWrapper() },
      );
    }

    it("muestra por separado lo que entra a caja hoy y lo que queda por cobrar a Cashea", () => {
      renderCasheaDialog();

      const cashToday = screen.getByText("Entra a caja hoy").closest("div");
      const receivable = screen.getByText("Por cobrar a Cashea").closest("div");

      expect(within(cashToday!).getByText(formatCurrencyUSD(25))).toBeInTheDocument();
      expect(within(receivable!).getByText(formatCurrencyUSD(50))).toBeInTheDocument();
      expect(screen.getByText("6400685")).toBeInTheDocument();
      expect(screen.getByText("551-000738")).toBeInTheDocument();
    });

    it("permite registrar sin confirmación extra cuando el total de la orden coincide con la venta", () => {
      renderCasheaDialog();

      expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Registrar venta" })).toBeEnabled();
    });

    it("exige confirmar la advertencia cuando el total de la orden difiere del total de la venta", () => {
      renderCasheaDialog({
        casheaSaleTotalMismatch: true,
        order: { ...casheaOrder, total_usd: 80, paid_today_usd: 30 },
      });

      expect(screen.getByText(/difiere del total de la venta/)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Registrar venta" })).toBeDisabled();

      fireEvent.click(screen.getByRole("checkbox", { name: /Confirmo el total de la orden Cashea/ }));

      expect(screen.getByRole("button", { name: "Registrar venta" })).toBeEnabled();
    });
  });
});
