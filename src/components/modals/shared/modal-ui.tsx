import type { ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";

type ModalConfirmDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  icon: ReactNode;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  pendingLabel: string;
  isSubmissionPending: boolean;
  onConfirmSubmit: () => void;
  contentClassName?: string;
  confirmDisabled?: boolean;
  children: ReactNode;
};

type ConfirmDialogSectionProps = {
  children: ReactNode;
  className?: string;
};

type ModalProductIdentityProps = {
  code: string;
  description: string;
  descriptionClassName?: string;
};

type ModalShortcutActionButtonProps = {
  icon: ReactNode;
  label: string;
  disabled?: boolean;
  onClick: () => void;
  className?: string;
};

type ModalFooterActionRowProps = {
  message: ReactNode;
  children: ReactNode;
};

export function ModalConfirmDialog({
  isOpen,
  onOpenChange,
  icon,
  title,
  description,
  confirmLabel,
  pendingLabel,
  isSubmissionPending,
  onConfirmSubmit,
  contentClassName,
  confirmDisabled = false,
  children,
}: ModalConfirmDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className={contentClassName}>
        <AlertDialogHeader>
          <AlertDialogMedia>{icon}</AlertDialogMedia>
          <div>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription className="mt-1">{description}</AlertDialogDescription>
          </div>
        </AlertDialogHeader>

        {children}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmissionPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirmSubmit} disabled={isSubmissionPending || confirmDisabled}>
            {isSubmissionPending ? pendingLabel : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function ConfirmDialogTableSection({ children, className }: ConfirmDialogSectionProps) {
  return (
    <section className={cn("custom-scrollbar overflow-auto rounded-md border text-xs", className)}>{children}</section>
  );
}

export function ConfirmDialogSummarySection({ children, className }: ConfirmDialogSectionProps) {
  return <section className={cn("bg-muted/30 space-y-1 rounded-md border p-3 text-xs", className)}>{children}</section>;
}

export function ModalProductIdentity({ code, description, descriptionClassName }: ModalProductIdentityProps) {
  return (
    <>
      <span className="product-code mr-1.5 uppercase">{code}</span>
      <span className={cn("text-muted-foreground inline-flex max-w-64 truncate", descriptionClassName)}>
        {description}
      </span>
    </>
  );
}

export function ModalShortcutActionButton({
  icon,
  label,
  disabled = false,
  onClick,
  className,
}: ModalShortcutActionButtonProps) {
  return (
    <Button disabled={disabled} onClick={onClick} className={cn("w-full shrink-0 gap-3 md:w-auto", className)}>
      {icon}
      <span className="truncate">{label}</span>
      <KbdGroup className="hidden opacity-60 md:flex" aria-hidden="true">
        <Kbd>Shift ⇧</Kbd>
        <span>+</span>
        <Kbd>Enter</Kbd>
      </KbdGroup>
    </Button>
  );
}

export function ModalFooterActionRow({ message, children }: ModalFooterActionRowProps) {
  return (
    <section className="flex w-full flex-col gap-2 md:flex-row md:items-center md:justify-between md:gap-3">
      <p className="text-muted-foreground hidden text-xs font-medium md:block">{message}</p>
      {children}
    </section>
  );
}
