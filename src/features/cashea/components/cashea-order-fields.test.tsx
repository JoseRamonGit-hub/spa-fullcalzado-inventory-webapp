import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { formatCurrencyUSD } from "@/utils/formatters";
import { useCasheaOrderForm } from "../hooks/use-cashea-order-form";
import { CasheaOrderFields } from "./cashea-order-fields";

function CasheaOrderFieldsHarness({ saleTotalUsd = 100 }: { saleTotalUsd?: number }) {
  const orderForm = useCasheaOrderForm(saleTotalUsd);
  return <CasheaOrderFields orderForm={orderForm} />;
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

  it("muestra el error de un campo después de salir de él", async () => {
    render(<CasheaOrderFieldsHarness />);

    const orderNumberInput = screen.getByLabelText("N° de orden");
    expect(screen.queryByText("Campo obligatorio")).not.toBeInTheDocument();

    fireEvent.blur(orderNumberInput);

    expect(await screen.findByText("Campo obligatorio")).toBeInTheDocument();
    expect(orderNumberInput).toHaveAttribute("aria-invalid", "true");
  });

  it("salir de un campo vacío no marca con error a los demás", async () => {
    render(<CasheaOrderFieldsHarness />);

    fireEvent.blur(screen.getByLabelText("N° de orden"));

    expect(await screen.findAllByText("Campo obligatorio")).toHaveLength(1);
    expect(screen.getByLabelText("N° de factura")).toHaveAttribute("aria-invalid", "false");
    expect(screen.getByLabelText("Monto financiado")).toHaveAttribute("aria-invalid", "false");
  });

  it("el error de un campo desaparece al corregirlo", async () => {
    render(<CasheaOrderFieldsHarness />);

    const orderNumberInput = screen.getByLabelText("N° de orden");
    fireEvent.blur(orderNumberInput);
    expect(await screen.findByText("Campo obligatorio")).toBeInTheDocument();

    fireEvent.change(orderNumberInput, { target: { value: "6400685" } });

    expect(screen.queryByText("Campo obligatorio")).not.toBeInTheDocument();
  });

  it("revalida el Monto financiado ya escrito cuando baja el total de la venta", async () => {
    const { rerender } = render(<CasheaOrderFieldsHarness saleTotalUsd={120} />);

    fireEvent.change(screen.getByLabelText("Monto financiado"), { target: { value: "60" } });
    expect(screen.queryByText("No puede superar el total de la venta")).not.toBeInTheDocument();

    rerender(<CasheaOrderFieldsHarness saleTotalUsd={50} />);

    expect(await screen.findByText("No puede superar el total de la venta")).toBeInTheDocument();
  });

  it("muestra el error de un monto mientras se escribe", async () => {
    render(<CasheaOrderFieldsHarness />);

    fireEvent.change(screen.getByLabelText("Cobrado hoy"), { target: { value: "92.805" } });

    expect(await screen.findByText("Máximo dos decimales")).toBeInTheDocument();
  });

  it("avisa que el total de la orden difiere del total de la venta", () => {
    render(<CasheaOrderFieldsHarness saleTotalUsd={120} />);

    fireEvent.change(screen.getByLabelText("Total de la orden"), { target: { value: "100" } });

    expect(screen.getByText(/difiere del total de la venta/)).toBeInTheDocument();
  });
});
