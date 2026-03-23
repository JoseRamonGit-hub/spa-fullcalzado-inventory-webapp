import { describe, it, expect, beforeEach } from "vitest";
import { useModalStore } from "./useModalStore";

describe("useModalStore", () => {
  beforeEach(() => {
    useModalStore.setState({
      isInModalOpen: false,
      isOutModalOpen: false,
      isReturnModalOpen: false,
    });
  });

  describe("estado inicial", () => {
    it("todos los modales empiezan cerrados", () => {
      const state = useModalStore.getState();

      expect(state.isInModalOpen).toBe(false);
      expect(state.isOutModalOpen).toBe(false);
      expect(state.isReturnModalOpen).toBe(false);
    });
  });

  describe("setInModalOpen()", () => {
    it("abre el InModal", () => {
      useModalStore.getState().setInModalOpen(true);

      expect(useModalStore.getState().isInModalOpen).toBe(true);
    });

    it("cierra el InModal", () => {
      useModalStore.getState().setInModalOpen(true);
      useModalStore.getState().setInModalOpen(false);

      expect(useModalStore.getState().isInModalOpen).toBe(false);
    });

    it("no afecta a los otros modales", () => {
      useModalStore.getState().setInModalOpen(true);

      expect(useModalStore.getState().isOutModalOpen).toBe(false);
      expect(useModalStore.getState().isReturnModalOpen).toBe(false);
    });
  });

  describe("setOutModalOpen()", () => {
    it("abre el OutModal", () => {
      useModalStore.getState().setOutModalOpen(true);

      expect(useModalStore.getState().isOutModalOpen).toBe(true);
    });

    it("cierra el OutModal", () => {
      useModalStore.getState().setOutModalOpen(true);
      useModalStore.getState().setOutModalOpen(false);

      expect(useModalStore.getState().isOutModalOpen).toBe(false);
    });

    it("no afecta a los otros modales", () => {
      useModalStore.getState().setOutModalOpen(true);

      expect(useModalStore.getState().isInModalOpen).toBe(false);
      expect(useModalStore.getState().isReturnModalOpen).toBe(false);
    });
  });

  describe("setReturnModalOpen()", () => {
    it("abre el ReturnModal", () => {
      useModalStore.getState().setReturnModalOpen(true);

      expect(useModalStore.getState().isReturnModalOpen).toBe(true);
    });

    it("cierra el ReturnModal", () => {
      useModalStore.getState().setReturnModalOpen(true);
      useModalStore.getState().setReturnModalOpen(false);

      expect(useModalStore.getState().isReturnModalOpen).toBe(false);
    });

    it("no afecta a los otros modales", () => {
      useModalStore.getState().setReturnModalOpen(true);

      expect(useModalStore.getState().isInModalOpen).toBe(false);
      expect(useModalStore.getState().isOutModalOpen).toBe(false);
    });
  });

  describe("múltiples modales", () => {
    it("permite abrir varios modales simultáneamente", () => {
      useModalStore.getState().setInModalOpen(true);
      useModalStore.getState().setOutModalOpen(true);
      useModalStore.getState().setReturnModalOpen(true);

      const state = useModalStore.getState();
      expect(state.isInModalOpen).toBe(true);
      expect(state.isOutModalOpen).toBe(true);
      expect(state.isReturnModalOpen).toBe(true);
    });
  });
});
