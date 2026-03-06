import { create } from "zustand";

interface ModalState {
  ingresoOpen: boolean;
  ventaOpen: boolean;
  setIngresoOpen: (open: boolean) => void;
  setVentaOpen: (open: boolean) => void;
}

export const useModalStore = create<ModalState>()((set) => ({
  ingresoOpen: false,
  ventaOpen: false,
  setIngresoOpen: (open) => set({ ingresoOpen: open }),
  setVentaOpen: (open) => set({ ventaOpen: open }),
}));
