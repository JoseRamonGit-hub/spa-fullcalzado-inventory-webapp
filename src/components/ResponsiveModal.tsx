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
          <DrawerHeader className="border-b" style={{ borderColor: "var(--border-color)" }}>
            <DrawerTitle className="text-sm font-bold uppercase tracking-wide">{title}</DrawerTitle>
            {description && <DrawerDescription className="text-xs">{description}</DrawerDescription>}
          </DrawerHeader>
          <div className="px-4 py-2 overflow-y-auto max-h-[75dvh] custom-scrollbar">{children}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`p-0 gap-0 ${className ?? ""}`} showCloseButton>
        <DialogHeader className="px-4 pt-4 pb-2 border-b" style={{ borderColor: "var(--border-color)" }}>
          <DialogTitle className="text-sm font-bold uppercase tracking-wide">{title}</DialogTitle>
          {description && <DialogDescription className="text-xs">{description}</DialogDescription>}
        </DialogHeader>
        <div className="p-4 max-h-[75dvh] overflow-y-auto">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
