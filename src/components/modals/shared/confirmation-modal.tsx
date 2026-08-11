import type { ReactNode } from "react";
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
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ActiveBusinessContext } from "@/features/business/components/active-business-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

type ConfirmationModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presentation: "direct" | "review";
  title: string;
  description: ReactNode;
  confirmLabel: string;
  pendingLabel: string;
  isPending: boolean;
  onConfirm: () => void | Promise<void>;
  cancelLabel?: string;
  variant?: "default" | "danger";
  contentClassName?: string;
  confirmDisabled?: boolean;
  children: ReactNode;
};

type ConfirmationProductIdentityProps = {
  code: string;
  description: string;
  className?: string;
};

export function ConfirmationModal({
  open,
  onOpenChange,
  presentation,
  title,
  description,
  confirmLabel,
  pendingLabel,
  isPending,
  onConfirm,
  cancelLabel = presentation === "review" ? "Volver a editar" : "Cancelar",
  variant = "default",
  contentClassName,
  confirmDisabled = false,
  children,
}: ConfirmationModalProps) {
  const isMobile = useIsMobile();

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isPending) return;
    onOpenChange(nextOpen);
  };

  if (presentation === "direct" && isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange} dismissible={!isPending}>
        <DrawerContent>
          <DrawerHeader className="items-stretch gap-0 text-left">
            <DrawerTitle className="text-base leading-tight">{title}</DrawerTitle>
            <ActiveBusinessContext className="mt-1" />
            <DrawerDescription className="mt-1 text-sm leading-snug">{description}</DrawerDescription>
          </DrawerHeader>

          <div className="min-h-0 overflow-y-auto px-4 pb-2">{children}</div>

          <DrawerFooter className="grid grid-cols-1 gap-2 pb-[max(1rem,env(safe-area-inset-bottom))] min-[360px]:grid-cols-2">
            <DrawerClose asChild>
              <Button variant="outline" className="h-11 w-full [@media(pointer:fine)]:h-9" disabled={isPending}>
                {cancelLabel}
              </Button>
            </DrawerClose>
            <Button
              type="button"
              variant={variant === "danger" ? "destructive" : "default"}
              className="h-11 w-full [@media(pointer:fine)]:h-9"
              onClick={() => void onConfirm()}
              disabled={isPending || confirmDisabled}
            >
              {isPending ? pendingLabel : confirmLabel}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent
        className={cn(
          "grid max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] gap-3 overflow-hidden p-4 sm:gap-4 sm:p-5",
          contentClassName,
        )}
      >
        <AlertDialogHeader className="flex flex-col items-stretch gap-0 text-left sm:place-items-start sm:text-left">
          <AlertDialogTitle className="text-base leading-tight">{title}</AlertDialogTitle>
          <ActiveBusinessContext className="mt-1" />
          <AlertDialogDescription className="mt-1 text-sm leading-snug">{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <div className="min-h-0 overflow-y-auto">{children}</div>

        <AlertDialogFooter className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2 sm:flex sm:justify-end">
          <AlertDialogCancel className="h-11 w-full sm:w-auto [@media(pointer:fine)]:h-9" disabled={isPending}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            variant={variant === "danger" ? "destructive" : "default"}
            className="h-11 w-full sm:w-auto [@media(pointer:fine)]:h-9"
            onClick={(event) => {
              event.preventDefault();
              void onConfirm();
            }}
            disabled={isPending || confirmDisabled}
          >
            {isPending ? pendingLabel : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function ConfirmationProductIdentity({ code, description, className }: ConfirmationProductIdentityProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-0.5", className)}>
      <p className="text-foreground text-sm font-medium break-words">{description}</p>
      <p className="product-code uppercase">{code}</p>
    </div>
  );
}
