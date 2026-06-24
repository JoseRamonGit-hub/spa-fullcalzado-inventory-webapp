import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useBusinesses } from "@/features/business/hooks/useBusinessQueries";
import { useBusinessStore } from "@/features/business/store/useBusinessStore";
import { useBusinessTransitionStore } from "@/features/business/store/useBusinessTransitionStore";
import { useModalStore } from "@/components/modals/store/useModalStore";

export function useBusinessSwitcher() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const activeBusinessId = useBusinessStore((state) => state.activeBusinessId);
  const isTransitioning = useBusinessTransitionStore((state) => state.targetBusinessId !== null);
  const businessesQuery = useBusinesses();
  const businesses = businessesQuery.data ?? [];
  const activeBusiness = businesses.find((business) => business.id === activeBusinessId) ?? null;
  const canSwitch = businesses.length > 1;

  const selectBusiness = (businessId: string) => {
    if (businessId === activeBusinessId) {
      setOpen(false);
      return false;
    }

    if (queryClient.isMutating() > 0 || isTransitioning) {
      toast.warning("Espera a que termine la operación actual antes de cambiar de negocio.");
      return false;
    }

    const selectedBusiness = businesses.find((business) => business.id === businessId);
    if (!selectedBusiness) {
      toast.error("No tienes acceso al negocio seleccionado.");
      return false;
    }

    const modalStore = useModalStore.getState();
    modalStore.setInModalOpen(false);
    modalStore.setOutModalOpen(false);
    modalStore.setReturnModalOpen(false);

    const transitionStore = useBusinessTransitionStore.getState();
    transitionStore.startTransition(selectedBusiness.id, selectedBusiness.name);

    if (!useBusinessStore.getState().setActiveBusiness(selectedBusiness.id, businesses)) {
      transitionStore.finishTransition();
      toast.error("No tienes acceso al negocio seleccionado.");
      return false;
    }

    setOpen(false);
    return true;
  };

  return {
    activeBusiness,
    activeBusinessId,
    businesses,
    canSwitch,
    isPending: businessesQuery.isPending,
    isTransitioning,
    open,
    setOpen,
    selectBusiness,
  };
}
