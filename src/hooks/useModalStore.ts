import { create } from "zustand";

type ModalState = {
  isInModalOpen: boolean;
  isOutModalOpen: boolean;
  setInModalOpen: (open: boolean) => void;
  setOutModalOpen: (open: boolean) => void;
};

export const useModalStore = create<ModalState>()((set) => ({
  isInModalOpen: false,
  isOutModalOpen: false,
  setInModalOpen: (state) => set({ isInModalOpen: state }),
  setOutModalOpen: (state) => set({ isOutModalOpen: state }),
}));
