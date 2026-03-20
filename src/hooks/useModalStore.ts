import { create } from "zustand";

type ModalState = {
  isInModalOpen: boolean;
  isOutModalOpen: boolean;
  isReturnModalOpen: boolean;
  setInModalOpen: (open: boolean) => void;
  setOutModalOpen: (open: boolean) => void;
  setReturnModalOpen: (open: boolean) => void;
};

export const useModalStore = create<ModalState>()((set) => ({
  isInModalOpen: false,
  isOutModalOpen: false,
  isReturnModalOpen: false,
  setInModalOpen: (state) => set({ isInModalOpen: state }),
  setOutModalOpen: (state) => set({ isOutModalOpen: state }),
  setReturnModalOpen: (state) => set({ isReturnModalOpen: state }),
}));
