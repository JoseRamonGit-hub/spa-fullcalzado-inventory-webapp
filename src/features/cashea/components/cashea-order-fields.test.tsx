import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { formatCurrencyUSD } from "@/utils/formatters";
import { useCasheaOrderForm } from "../hooks/use-cashea-order-form";
import { CasheaOrderFields } from "./cashea-order-fields";
import { CasheaOrderSection } from "./cashea-order-section";

function CasheaOrderFieldsHarness({ saleTotalUsd = 100 }: { saleTotalUsd?: number }) {
  const orderForm = useCasheaOrderForm(saleTotalUsd);
  return <CasheaOrderFields orderForm={orderForm} />;
}

describe("CasheaOrderFields", () => {
  it("mantiene estable la banda de la venta hasta salir del importe", () => {
    function SaleHarness() {
      const orderForm = useCasheaOrderForm(100);
      return <CasheaOrderSection title="Pago con Cashea" orderForm={orderForm} />;
    }
    render(<SaleHarness />);
    const total = screen.getByLabelText("Total de la orden");
    fireEvent.focus(total);
    fireEvent.change(total, { target: { value: "10" } });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    fireEvent.blur(total);
    expect(screen.getByRole("status")).toHaveTextContent("$90.00");
    fireEvent.focus(total);
    fireEvent.change(total, { target: { value: "100" } });
    expect(screen.getByRole("status")).toHaveTextContent("$90.00");
    fireEvent.blur(total);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("captura los cinco datos de la Orden Cashea", () => {
    render(<CasheaOrderFieldsHarness />);

    expect(screen.getByLabelText("N° de orden")).toBeInTheDocument();
    expect(screen.getByLabelText("N° de factura")).toBeInTheDocument();
    expect(screen.getByLabelText("Total de la orden")).toBeInTheDocument();
    expect(screen.getByLabelText("Inicial")).toBeInTheDocument();
    expect(screen.getByLabelText("Monto financiado")).toBeInTheDocument();
  });

  it("no precarga el total de la orden con el total de la venta", () => {
    render(<CasheaOrderFieldsHarness saleTotalUsd={185.6} />);

    expect(screen.getByLabelText("Total de la orden")).toHaveValue("");
  });

  it("calcula el Monto financiado al escribir el total y la Inicial", () => {
    render(<CasheaOrderFieldsHarness saleTotalUsd={185.6} />);

    fireEvent.change(screen.getByLabelText("Total de la orden"), { target: { value: "185.60" } });
    fireEvent.change(screen.getByLabelText("Inicial"), { target: { value: "92.8" } });
    expect(screen.getByLabelText("Monto financiado")).toHaveValue("92.80");

    fireEvent.change(screen.getByLabelText("Total de la orden"), { target: { value: "150" } });
    expect(screen.getByLabelText("Monto financiado")).toHaveValue("57.20");
  });

  it("el Monto financiado calculado se puede corregir a mano", () => {
    render(<CasheaOrderFieldsHarness />);

    fireEvent.change(screen.getByLabelText("Total de la orden"), { target: { value: "100" } });
    fireEvent.change(screen.getByLabelText("Inicial"), { target: { value: "40" } });
    fireEvent.change(screen.getByLabelText("Monto financiado"), { target: { value: "59.99" } });

    expect(screen.getByLabelText("Monto financiado")).toHaveValue("59.99");
  });

  it("no menciona la suma mientras Inicial + Monto financiado cuadra con el total", () => {
    render(<CasheaOrderFieldsHarness />);

    fireEvent.change(screen.getByLabelText("Total de la orden"), { target: { value: "100" } });
    fireEvent.change(screen.getByLabelText("Inicial"), { target: { value: "40" } });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("avisa la diferencia cuando Inicial + Monto financiado no cuadra con el total", () => {
    render(<CasheaOrderFieldsHarness saleTotalUsd={120} />);

    fireEvent.change(screen.getByLabelText("Total de la orden"), { target: { value: "100" } });
    fireEvent.change(screen.getByLabelText("Inicial"), { target: { value: "40" } });
    fireEvent.change(screen.getByLabelText("Monto financiado"), { target: { value: "50" } });

    expect(screen.getByRole("alert")).toHaveTextContent(`Faltan ${formatCurrencyUSD(10)}`);
    expect(screen.queryByText(/menor que la venta/)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Monto financiado"), { target: { value: "60" } });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByText(/menor que la venta/)).toBeInTheDocument();
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

    fireEvent.change(screen.getByLabelText("Inicial"), { target: { value: "92.805" } });

    expect(await screen.findByText("Máximo dos decimales")).toBeInTheDocument();
  });

  it("avisa que el total de la orden difiere del total de la venta", () => {
    render(<CasheaOrderFieldsHarness saleTotalUsd={120} />);

    fireEvent.change(screen.getByLabelText("Total de la orden"), { target: { value: "100" } });

    expect(screen.getByText(/La orden es \$20\.00 menor que la venta/)).toBeInTheDocument();
  });
});
