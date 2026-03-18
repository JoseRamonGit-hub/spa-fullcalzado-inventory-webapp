import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface ResponsiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  avoidCloseFromOutsideClick?: boolean;
  avoidCloseFromEsc?: boolean;
  dialogClassName?: string;
  drawerClassName?: string;
  descriptionSrOnly?: boolean;
  footer?: React.ReactNode;
}

export function ResponsiveModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  avoidCloseFromOutsideClick,
  avoidCloseFromEsc,
  dialogClassName,
  drawerClassName,
  descriptionSrOnly,
  footer,
}: ResponsiveModalProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent
          className={cn("flex max-h-[88dvh]", drawerClassName ?? "")}
          onInteractOutside={avoidCloseFromOutsideClick ? (e) => e.preventDefault() : undefined}
        >
          <DrawerHeader className="border-b">
            <DrawerTitle className="text-sm font-bold tracking-wide uppercase">{title}</DrawerTitle>
            {description && (
              <DrawerDescription className={cn("text-xs", descriptionSrOnly && "sr-only")}>
                {description}
              </DrawerDescription>
            )}
          </DrawerHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2" data-vaul-no-drag>{children}</div>
          <DrawerFooter className="border-t">{footer}</DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn("grid max-h-[90dvh] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 p-0", dialogClassName ?? "")}
        showCloseButton
        onInteractOutside={avoidCloseFromOutsideClick ? (e) => e.preventDefault() : undefined}
        onEscapeKeyDown={avoidCloseFromEsc ? (e) => e.preventDefault() : undefined}
      >
        <DialogHeader className="border-b px-4 pt-4 pb-2">
          <DialogTitle className="text-sm font-bold tracking-wide uppercase">{title}</DialogTitle>
          {description && (
            <DialogDescription className={cn("text-xs", descriptionSrOnly && "sr-only")}>
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <DialogBody className="min-h-0">{children}</DialogBody>
        <DialogFooter>{footer}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
