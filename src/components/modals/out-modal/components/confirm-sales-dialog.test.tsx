import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import type { Business, User } from "@/types";
import { businessKeys } from "@/features/business/hooks/useBusinessQueries";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useBusinessStore } from "@/features/business/store/useBusinessStore";
import { ConfirmSalesDialog } from "./confirm-sales-dialog";
import type { PendingSale } from "../types";
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

const lines: PendingSale[] = [
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

describe("ConfirmSalesDialog", () => {
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

  it("presenta varios Productos como Renglones de una sola Venta", () => {
    render(
      <ConfirmSalesDialog
        isOpen
        onOpenChange={vi.fn()}
        pendingSales={lines}
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
    expect(screen.getByText("2 Renglones de venta")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Registrar venta" })).toBeInTheDocument();
  });
});
