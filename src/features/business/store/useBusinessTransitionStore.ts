import { create } from "zustand";

type BusinessTransitionState = {
  targetBusinessId: string | null;
  targetBusinessName: string | null;
  startedAt: number | null;
  startTransition: (businessId: string, businessName: string) => void;
  finishTransition: () => void;
};

export const useBusinessTransitionStore = create<BusinessTransitionState>()((set) => ({
  targetBusinessId: null,
  targetBusinessName: null,
  startedAt: null,
  startTransition: (targetBusinessId, targetBusinessName) =>
    set({ targetBusinessId, targetBusinessName, startedAt: Date.now() }),
  finishTransition: () => set({ targetBusinessId: null, targetBusinessName: null, startedAt: null }),
}));
