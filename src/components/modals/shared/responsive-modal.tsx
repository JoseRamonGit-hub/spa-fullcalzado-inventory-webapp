import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { ActiveBusinessContext } from "@/features/business/components/active-business-context";

type ResponsiveModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: React.ReactNode;
  avoidCloseFromOutsideClick?: boolean;
  avoidCloseFromEsc?: boolean;
  dialogClassName?: string;
  headerClassName?: string;
  titleClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  footer: React.ReactNode;
};

export function ResponsiveModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  avoidCloseFromOutsideClick,
  avoidCloseFromEsc,
  dialogClassName,
  headerClassName,
  titleClassName,
  bodyClassName,
  footerClassName,
  footer,
}: ResponsiveModalProps) {
  const isMobile = useIsMobile();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "grid grid-rows-[auto_minmax(0,1fr)_auto] gap-0 p-0",
          isMobile ? "max-h-[90dvh] w-screen max-w-none rounded-none" : "max-h-[90dvh]",
          !isMobile && dialogClassName,
        )}
        animationClassName={
          isMobile
            ? "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 duration-150"
            : undefined
        }
        onInteractOutside={avoidCloseFromOutsideClick ? (e) => e.preventDefault() : undefined}
        onEscapeKeyDown={avoidCloseFromEsc ? (e) => e.preventDefault() : undefined}
      >
        <DialogHeader className={cn("border-b px-4 pt-4 pb-2", headerClassName)}>
          <DialogTitle className={cn("text-sm font-bold tracking-wide uppercase", titleClassName)}>{title}</DialogTitle>
          <ActiveBusinessContext />
          <DialogDescription className="sr-only text-xs">{description}</DialogDescription>
        </DialogHeader>
        <DialogBody className={cn("min-h-0", isMobile && "px-4 py-3", bodyClassName)}>{children}</DialogBody>
        <DialogFooter className={footerClassName}>{footer}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
