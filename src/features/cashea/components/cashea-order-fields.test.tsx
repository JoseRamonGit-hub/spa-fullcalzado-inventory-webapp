import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { toast } from "sonner";
import { formatCurrencyUSD } from "@/utils/formatters";
import { useCasheaOrderForm } from "../hooks/use-cashea-order-form";
import { CasheaOrderFields } from "./cashea-order-fields";

function CasheaOrderFieldsHarness({ saleTotalUsd = 100 }: { saleTotalUsd?: number }) {
  const orderForm = useCasheaOrderForm(saleTotalUsd);
  return <CasheaOrderFields orderForm={orderForm} />;
}

const DEBE_PAGAR = "# Orden\n6400685\nTotal\n$ 185.6\nCobrar hoy\n$ 92.80\nFinanciado\n$ 92.80\nID\n551-000738";

const readClipboardText = vi.fn<() => Promise<string>>();

/** Simula copiar `text` en el panel de Cashea y pulsar «Pegar resumen». */
async function pasteSummary(text: string) {
  readClipboardText.mockResolvedValueOnce(text);
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Pegar resumen" }));
  });
}

describe("CasheaOrderFields", () => {
  beforeEach(() => {
    readClipboardText.mockReset();
    vi.mocked(toast.error).mockClear();
    Object.defineProperty(navigator, "clipboard", { value: { readText: readClipboardText }, configurable: true });
  });

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

  it("calcula el Monto financiado al escribir el total y lo Cobrado hoy", () => {
    render(<CasheaOrderFieldsHarness saleTotalUsd={185.6} />);

    fireEvent.change(screen.getByLabelText("Total de la orden"), { target: { value: "185.60" } });
    fireEvent.change(screen.getByLabelText("Cobrado hoy"), { target: { value: "92.8" } });
    expect(screen.getByLabelText("Monto financiado")).toHaveValue("92.80");

    fireEvent.change(screen.getByLabelText("Total de la orden"), { target: { value: "150" } });
    expect(screen.getByLabelText("Monto financiado")).toHaveValue("57.20");
  });

  it("el Monto financiado calculado se puede corregir a mano", () => {
    render(<CasheaOrderFieldsHarness />);

    fireEvent.change(screen.getByLabelText("Total de la orden"), { target: { value: "100" } });
    fireEvent.change(screen.getByLabelText("Cobrado hoy"), { target: { value: "40" } });
    fireEvent.change(screen.getByLabelText("Monto financiado"), { target: { value: "59.99" } });

    expect(screen.getByLabelText("Monto financiado")).toHaveValue("59.99");
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

  it("rellena los campos reconocidos al pegar el resumen copiado", async () => {
    render(<CasheaOrderFieldsHarness saleTotalUsd={185.6} />);

    await pasteSummary(DEBE_PAGAR);

    expect(screen.getByLabelText("N° de orden")).toHaveValue("6400685");
    expect(screen.getByLabelText("N° de factura")).toHaveValue("551-000738");
    expect(screen.getByLabelText("Total de la orden")).toHaveValue("185.60");
    expect(screen.getByLabelText("Cobrado hoy")).toHaveValue("92.80");
    expect(screen.getByLabelText("Monto financiado")).toHaveValue("92.80");
  });

  it("un segundo pegado solo reemplaza los campos que reconoce", async () => {
    render(<CasheaOrderFieldsHarness saleTotalUsd={185.6} />);

    await pasteSummary("Total $ 185.6 Cobrar hoy $ 92.80 Financiado $ 92.80");
    fireEvent.change(screen.getByLabelText("N° de orden"), { target: { value: "6400685" } });
    fireEvent.change(screen.getByLabelText("N° de factura"), { target: { value: "551-000738" } });

    await pasteSummary("# Orden 6400700 Total $ 120");

    expect(screen.getByLabelText("N° de orden")).toHaveValue("6400700");
    expect(screen.getByLabelText("N° de factura")).toHaveValue("551-000738");
    expect(screen.getByLabelText("Total de la orden")).toHaveValue("120.00");
    expect(screen.getByLabelText("Cobrado hoy")).toHaveValue("92.80");
    expect(screen.getByLabelText("Monto financiado")).toHaveValue("92.80");
  });

  it("un texto irreconocible no cambia ni marca con error ningún campo", async () => {
    render(<CasheaOrderFieldsHarness />);

    fireEvent.change(screen.getByLabelText("N° de orden"), { target: { value: "6400685" } });
    await pasteSummary("hola");

    expect(screen.getByLabelText("N° de orden")).toHaveValue("6400685");
    expect(screen.getByLabelText("Total de la orden")).toHaveValue("");
    expect(screen.queryByText("Campo obligatorio")).not.toBeInTheDocument();
  });

  it("avisa si no puede leer el portapapeles y deja los campos como estaban", async () => {
    render(<CasheaOrderFieldsHarness />);
    readClipboardText.mockRejectedValueOnce(new DOMException("Denied", "NotAllowedError"));

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Pegar resumen" }));
    });

    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("portapapeles"));
    expect(screen.getByLabelText("Total de la orden")).toHaveValue("");
  });

  it("avisa que el total de la orden difiere del total de la venta", () => {
    render(<CasheaOrderFieldsHarness saleTotalUsd={120} />);

    fireEvent.change(screen.getByLabelText("Total de la orden"), { target: { value: "100" } });

    expect(screen.getByText(/difiere del total de la venta/)).toBeInTheDocument();
  });
});
