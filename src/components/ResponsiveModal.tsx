import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
} from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
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
}: ResponsiveModalProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className={drawerClassName} onInteractOutside={(e) => e.preventDefault()}>
          <DrawerHeader className="border-b">
            <DrawerTitle className="text-sm font-bold tracking-wide uppercase">{title}</DrawerTitle>
            {description && <DrawerDescription className="text-xs">{description}</DrawerDescription>}
          </DrawerHeader>
          <div className="custom-scrollbar max-h-[75dvh] overflow-y-auto px-4 py-2">{children}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Test
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`gap-0 p-0 ${dialogClassName ?? ""}`}
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
        <DialogBody className="max-h-[75dvh]">{children}</DialogBody>
      </DialogContent>
    </Dialog>
  );
}
