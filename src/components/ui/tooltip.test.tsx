import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

function TouchTooltip() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button">Ver ayuda</button>
        </TooltipTrigger>
        <TooltipContent>Detalle para leer</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

describe("Tooltip", () => {
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

  it("mantiene abierto el tooltip al terminar un tap y lo cierra con un segundo tap", async () => {
    render(<TouchTooltip />);

    const trigger = screen.getByRole("button", { name: "Ver ayuda" });
    fireEvent.pointerDown(trigger, { pointerType: "touch" });

    expect(await screen.findByRole("tooltip")).toHaveTextContent("Detalle para leer");

    fireEvent.pointerDown(trigger, { pointerType: "touch" });

    await waitFor(() => expect(screen.queryByRole("tooltip")).not.toBeInTheDocument());
  });

  it("cierra un tooltip táctil al tocar fuera", async () => {
    render(
      <>
        <TouchTooltip />
        <button type="button">Otra acción</button>
      </>,
    );

    fireEvent.pointerDown(screen.getByRole("button", { name: "Ver ayuda" }), { pointerType: "touch" });
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Detalle para leer");

    fireEvent.pointerDown(screen.getByRole("button", { name: "Otra acción" }), { pointerType: "touch" });

    await waitFor(() => expect(screen.queryByRole("tooltip")).not.toBeInTheDocument());
  });

  it("conserva la apertura por foco para teclado y escritorio", async () => {
    render(<TouchTooltip />);

    fireEvent.focus(screen.getByRole("button", { name: "Ver ayuda" }));

    expect(await screen.findByRole("tooltip")).toHaveTextContent("Detalle para leer");
  });
});
