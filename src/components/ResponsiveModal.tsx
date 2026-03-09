import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";

interface ResponsiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveModal({ open, onOpenChange, title, description, children, className }: ResponsiveModalProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className={className}>
          <DrawerHeader className="border-b">
            <DrawerTitle className="text-sm font-bold tracking-wide uppercase">{title}</DrawerTitle>
            {description && <DrawerDescription className="text-xs">{description}</DrawerDescription>}
          </DrawerHeader>
          <div className="custom-scrollbar max-h-[75dvh] overflow-y-auto px-4 py-2">{children}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`gap-0 p-0 ${className ?? ""}`} showCloseButton>
        <DialogHeader className="border-b px-4 pt-4 pb-2">
          <DialogTitle className="text-sm font-bold tracking-wide uppercase">{title}</DialogTitle>
          {description && <DialogDescription className="text-xs">{description}</DialogDescription>}
        </DialogHeader>
        <div className="max-h-[75dvh] overflow-y-auto p-4">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
