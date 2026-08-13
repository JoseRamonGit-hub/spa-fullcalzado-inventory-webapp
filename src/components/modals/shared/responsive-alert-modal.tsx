import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { ActiveBusinessContext } from "@/features/business/components/active-business-context";
import type { ReactNode } from "react";

type ResponsiveAlertModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void | Promise<void>;
  confirmLabel: string;
  variant?: "default" | "danger";
  isPending: boolean;
  children?: ReactNode;
};

export function ResponsiveAlertModal({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmLabel,
  variant = "default",
  isPending,
  children,
}: ResponsiveAlertModalProps) {
  const isMobile = useIsMobile();
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isPending) return;
    onOpenChange(nextOpen);
  };

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerContent className="max-h-[calc(100dvh-1rem)]">
          <DrawerHeader className="shrink-0 text-left">
            <DrawerTitle className="text-sm font-bold tracking-wide uppercase">{title}</DrawerTitle>
            <ActiveBusinessContext />
            <DrawerDescription className="text-xs">{description}</DrawerDescription>
          </DrawerHeader>
          {children && <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-2">{children}</div>}
          <DrawerFooter className="bg-background shrink-0 flex-row gap-2 border-t pb-[max(1rem,env(safe-area-inset-bottom))]">
            <DrawerClose asChild>
              <Button variant="outline" className="flex-1" disabled={isPending}>
                Cancelar
              </Button>
            </DrawerClose>
            <Button
              onClick={() => void onConfirm()}
              disabled={isPending}
              variant={variant === "danger" ? "destructive" : "default"}
              className="flex-1 justify-center"
            >
              {isPending ? "Procesando..." : confirmLabel}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <ActiveBusinessContext />
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {children && <div>{children}</div>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant={variant === "danger" ? "destructive" : "default"}
            onClick={(event) => {
              event.preventDefault();
              void onConfirm();
            }}
            disabled={isPending}
          >
            {isPending ? "Procesando..." : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
