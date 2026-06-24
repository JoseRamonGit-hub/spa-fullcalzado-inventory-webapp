import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Business, User } from "@/types";

type BusinessState = {
  userId: string | null;
  activeBusinessId: string | null;
  selectedBusinessByUser: Record<string, string>;
  syncBusinessContext: (user: User, businesses: readonly Business[]) => void;
  setActiveBusiness: (businessId: string, businesses: readonly Business[]) => boolean;
  clear: () => void;
};

function resolvePreferredBusiness(
  user: User,
  businesses: readonly Business[],
  persistedBusinessId: string | undefined,
) {
  const accessibleIds = new Set(businesses.map((business) => business.id));

  if (persistedBusinessId && accessibleIds.has(persistedBusinessId)) {
    return persistedBusinessId;
  }

  if (user.default_business_id && accessibleIds.has(user.default_business_id)) {
    return user.default_business_id;
  }

  return businesses[0]?.id ?? null;
}

export const useBusinessStore = create<BusinessState>()(
  persist(
    (set, get) => ({
      userId: null,
      activeBusinessId: null,
      selectedBusinessByUser: {},

      syncBusinessContext: (user, businesses) => {
        const current = get();
        const selectedBusinessByUser = current.selectedBusinessByUser;
        const activeBusinessId = resolvePreferredBusiness(user, businesses, selectedBusinessByUser[user.id]);
        const selectionChanged = activeBusinessId !== null && selectedBusinessByUser[user.id] !== activeBusinessId;

        if (current.userId === user.id && current.activeBusinessId === activeBusinessId && !selectionChanged) {
          return;
        }

        set({
          userId: user.id,
          activeBusinessId,
          selectedBusinessByUser: selectionChanged
            ? { ...selectedBusinessByUser, [user.id]: activeBusinessId }
            : selectedBusinessByUser,
        });
      },

      setActiveBusiness: (businessId, businesses) => {
        const { userId, selectedBusinessByUser } = get();
        if (!userId || !businesses.some((business) => business.id === businessId)) {
          return false;
        }

        set({
          activeBusinessId: businessId,
          selectedBusinessByUser: { ...selectedBusinessByUser, [userId]: businessId },
        });
        return true;
      },

      clear: () => set({ userId: null, activeBusinessId: null }),
    }),
    {
      name: "business-selection",
      version: 1,
      storage: createJSONStorage(() => window.localStorage),
      partialize: ({ selectedBusinessByUser }) => ({ selectedBusinessByUser }),
    },
  ),
);

export function requireActiveBusinessId() {
  const businessId = useBusinessStore.getState().activeBusinessId;
  if (!businessId) {
    throw new Error("No hay un negocio activo.");
  }

  return businessId;
}
