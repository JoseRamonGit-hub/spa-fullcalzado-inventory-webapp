import { create } from "zustand";

type OperationalModalState = {
  isInModalOpen: boolean;
  isOutModalOpen: boolean;
  isReturnModalOpen: boolean;
  setInModalOpen: (open: boolean) => void;
  setOutModalOpen: (open: boolean) => void;
  setReturnModalOpen: (open: boolean) => void;
};

export const useModalStore = create<OperationalModalState>()((set) => ({
  isInModalOpen: false,
  isOutModalOpen: false,
  isReturnModalOpen: false,
  setInModalOpen: (open) =>
    set({
      isInModalOpen: open,
      ...(open && { isOutModalOpen: false, isReturnModalOpen: false }),
    }),
  setOutModalOpen: (open) =>
    set({
      isOutModalOpen: open,
      ...(open && { isInModalOpen: false, isReturnModalOpen: false }),
    }),
  setReturnModalOpen: (open) =>
    set({
      isReturnModalOpen: open,
      ...(open && { isInModalOpen: false, isOutModalOpen: false }),
    }),
}));
