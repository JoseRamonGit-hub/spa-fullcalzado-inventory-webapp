import { beforeEach, describe, expect, it, vi } from "vitest";
import { useBusinessTransitionStore } from "./useBusinessTransitionStore";

describe("useBusinessTransitionStore", () => {
  beforeEach(() => {
    useBusinessTransitionStore.getState().finishTransition();
  });

  it("registra y finaliza una transición", () => {
    vi.spyOn(Date, "now").mockReturnValueOnce(1234);

    useBusinessTransitionStore.getState().startTransition("business-2", "Zapatería Estilos C.A.");

    expect(useBusinessTransitionStore.getState()).toMatchObject({
      targetBusinessId: "business-2",
      targetBusinessName: "Zapatería Estilos C.A.",
      startedAt: 1234,
    });

    useBusinessTransitionStore.getState().finishTransition();

    expect(useBusinessTransitionStore.getState()).toMatchObject({
      targetBusinessId: null,
      targetBusinessName: null,
      startedAt: null,
    });
  });
});
