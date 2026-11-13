import { useState } from "react";
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { formatCurrencyUSD } from "@/utils/formatters";
import { EMPTY_CASHEA_ORDER_DRAFT, evaluateCasheaOrderDraft, type CasheaOrderDraft } from "../cashea-order-draft";
import { CasheaOrderFields } from "./cashea-order-fields";

function CasheaOrderFieldsHarness({
  initialDraft = EMPTY_CASHEA_ORDER_DRAFT,
  saleTotalUsd = 100,
}: {
  initialDraft?: CasheaOrderDraft;
  saleTotalUsd?: number;
}) {
  const [draft, setDraft] = useState(initialDraft);
  return (
    <CasheaOrderFields
      draft={draft}
      evaluation={evaluateCasheaOrderDraft(draft, saleTotalUsd)}
      onDraftChange={setDraft}
    />
  );
}

describe("CasheaOrderFields", () => {
  it("captura los cinco datos de la Orden Cashea", () => {
    render(<CasheaOrderFieldsHarness />);

    expect(screen.getByLabelText("N° de orden")).toBeInTheDocument();
    expect(screen.getByLabelText("N° de factura")).toBeInTheDocument();
    expect(screen.getByLabelText("Total de la orden")).toBeInTheDocument();
    expect(screen.getByLabelText("Cobrado hoy")).toBeInTheDocument();
    expect(screen.getByLabelText("Monto financiado")).toBeInTheDocument();
  });

  it("no precarga el total de la orden con el total de la venta", () => {
    render(<CasheaOrderFieldsHarness saleTotalUsd={185.6} />);

    expect(screen.getByLabelText("Total de la orden")).toHaveValue("");
  });

  it("muestra Cobrado hoy + Monto financiado junto al total y la diferencia cuando no cuadran", () => {
    render(<CasheaOrderFieldsHarness />);

    fireEvent.change(screen.getByLabelText("Total de la orden"), { target: { value: "100" } });
    fireEvent.change(screen.getByLabelText("Cobrado hoy"), { target: { value: "40" } });
    fireEvent.change(screen.getByLabelText("Monto financiado"), { target: { value: "50" } });

    expect(screen.getByTestId("cashea-sum")).toHaveTextContent(formatCurrencyUSD(90));
    expect(screen.getByTestId("cashea-order-total")).toHaveTextContent(formatCurrencyUSD(100));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Cobrado hoy + Monto financiado debe coincidir con el total de la orden",
    );
    expect(screen.getByRole("alert")).toHaveTextContent(formatCurrencyUSD(10));
  });

  it("muestra el error de un campo después de salir de él", () => {
    render(<CasheaOrderFieldsHarness />);

    const orderNumberInput = screen.getByLabelText("N° de orden");
    expect(screen.queryByText("Campo obligatorio")).not.toBeInTheDocument();

    fireEvent.blur(orderNumberInput);

    expect(screen.getByText("Campo obligatorio")).toBeInTheDocument();
    expect(orderNumberInput).toHaveAttribute("aria-invalid", "true");
  });

  it("avisa que el total de la orden difiere del total de la venta", () => {
    render(<CasheaOrderFieldsHarness saleTotalUsd={120} />);

    fireEvent.change(screen.getByLabelText("Total de la orden"), { target: { value: "100" } });

    expect(screen.getByText(/difiere del total de la venta/)).toBeInTheDocument();
  });
});
