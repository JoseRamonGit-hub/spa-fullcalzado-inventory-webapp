import { Outlet } from "@tanstack/react-router";
import { Store } from "lucide-react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { BottomBar } from "@/components/layout/bottom-bar";
import { OfflineBanner } from "@/components/layout/offline-banner";
import { InModal } from "@/components/modals/in-modal";
import { OutModal } from "@/components/modals/out-modal";
import { ReturnModal } from "@/components/modals/return-modal";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { BusinessTransitionOverlay } from "@/features/business/components/business-transition-overlay";
import { useBusinessDocumentTitle } from "@/features/business/hooks/useBusinessDocumentTitle";
import { useBusinessStore } from "@/features/business/store/useBusinessStore";
import { useModalStore } from "@/components/modals/store/useModalStore";
import { useSidebarStore } from "@/components/layout/store/useSidebarStore";

export function AppLayout() {
  const isInModalOpen = useModalStore((state) => state.isInModalOpen);
  const isOutModalOpen = useModalStore((state) => state.isOutModalOpen);
  const isReturnModalOpen = useModalStore((state) => state.isReturnModalOpen);
  const setInModalOpen = useModalStore((state) => state.setInModalOpen);
  const setOutModalOpen = useModalStore((state) => state.setOutModalOpen);
  const setReturnModalOpen = useModalStore((state) => state.setReturnModalOpen);
  const sidebarOpen = useSidebarStore((state) => state.open);
  const setSidebarOpen = useSidebarStore((state) => state.setOpen);
  const hasActiveBusiness = useBusinessStore((state) => !!state.activeBusinessId);

  useBusinessDocumentTitle();

  return (
    <SidebarProvider className="h-dvh" open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <AppSidebar />
      <SidebarInset className="bg-card overflow-hidden shadow-sm">
        <AppTopbar />

        <OfflineBanner />

        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden pb-(--bottombar-height) md:pb-0">
          {hasActiveBusiness ? (
            <Outlet />
          ) : (
            <div className="flex flex-1 items-center justify-center p-6">
              <div className="flex max-w-md flex-col items-center gap-3 text-center">
                <div className="bg-muted flex size-12 items-center justify-center rounded-xl">
                  <Store className="text-muted-foreground" />
                </div>
                <div className="flex flex-col gap-1">
                  <h2 className="font-heading text-base font-semibold">Usuario sin negocio asignado</h2>
                  <p className="text-muted-foreground text-sm">
                    Un administrador debe asignarte un negocio antes de usar los módulos operativos.
                  </p>
                </div>
              </div>
            </div>
          )}
          <BusinessTransitionOverlay />
        </div>
      </SidebarInset>

      <BottomBar />

      {hasActiveBusiness ? (
        <>
          <InModal isOpen={isInModalOpen} onOpenChange={setInModalOpen} />
          <OutModal isOpen={isOutModalOpen} onOpenChange={setOutModalOpen} />
          <ReturnModal isOpen={isReturnModalOpen} onOpenChange={setReturnModalOpen} />
        </>
      ) : null}
    </SidebarProvider>
  );
}
