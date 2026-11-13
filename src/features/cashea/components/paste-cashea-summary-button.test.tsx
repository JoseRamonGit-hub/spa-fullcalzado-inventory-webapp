import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { toast } from "sonner";
import { useCasheaOrderForm } from "../hooks/use-cashea-order-form";
import { CasheaOrderFields } from "./cashea-order-fields";
import { PasteCasheaSummaryButton } from "./paste-cashea-summary-button";

function CasheaOrderFieldsHarness({ saleTotalUsd = 100 }: { saleTotalUsd?: number }) {
  const orderForm = useCasheaOrderForm(saleTotalUsd);
  return (
    <>
      <PasteCasheaSummaryButton orderForm={orderForm} />
      <CasheaOrderFields orderForm={orderForm} />
    </>
  );
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

describe("PasteCasheaSummaryButton", () => {
  beforeEach(() => {
    readClipboardText.mockReset();
    vi.mocked(toast.error).mockClear();
    Object.defineProperty(navigator, "clipboard", { value: { readText: readClipboardText }, configurable: true });
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
});
