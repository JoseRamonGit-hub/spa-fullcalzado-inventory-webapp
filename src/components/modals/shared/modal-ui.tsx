import { useRef, useState, type ReactNode } from "react";
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
import { ActiveBusinessContext } from "@/features/business/components/active-business-context";
import { OverflowTooltip } from "@/components/ui/overflow-tooltip";
import { cn } from "@/lib/utils";

type ModalConfirmDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  pendingLabel: string;
  submissionErrorMessage: string;
  isSubmissionPending: boolean;
  onConfirmSubmit: () => void | Promise<void>;
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
};

type ModalShortcutActionButtonProps = {
  icon: ReactNode;
  label: string;
  disabled?: boolean;
  onClick: () => void;
};

type ModalFooterActionRowProps = {
  message: ReactNode;
  children: ReactNode;
};

export function ModalConfirmDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancelar",
  pendingLabel,
  submissionErrorMessage,
  isSubmissionPending,
  onConfirmSubmit,
  contentClassName,
  confirmDisabled = false,
  children,
}: ModalConfirmDialogProps) {
  const [visibleSubmissionError, setVisibleSubmissionError] = useState<string | null>(null);
  const submissionLockRef = useRef(false);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && (isSubmissionPending || submissionLockRef.current)) return;
    if (!nextOpen) setVisibleSubmissionError(null);
    onOpenChange(nextOpen);
  };

  const handleConfirmSubmit = async () => {
    if (submissionLockRef.current) return;

    submissionLockRef.current = true;
    setVisibleSubmissionError(null);

    try {
      await onConfirmSubmit();
    } catch {
      setVisibleSubmissionError(submissionErrorMessage);
    } finally {
      submissionLockRef.current = false;
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent
        className={cn("max-h-[calc(100dvh-2rem)] gap-3 overflow-y-auto p-4 sm:gap-4 sm:p-5", contentClassName)}
      >
        <AlertDialogHeader className="flex flex-col items-stretch gap-0 text-left sm:place-items-start sm:text-left">
          <AlertDialogTitle className="text-base leading-tight">{title}</AlertDialogTitle>
          <ActiveBusinessContext className="mt-1" />
          <AlertDialogDescription className="mt-1 text-sm leading-snug">{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {visibleSubmissionError && (
          <div
            role="alert"
            className="border-destructive/30 bg-destructive/8 text-destructive rounded-md border px-3 py-2 text-xs font-medium"
          >
            {visibleSubmissionError}
          </div>
        )}

        {children}

        <AlertDialogFooter className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
          <AlertDialogCancel className="w-full sm:w-auto" disabled={isSubmissionPending}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            className="w-full sm:w-auto"
            onClick={(event) => {
              event.preventDefault();
              void handleConfirmSubmit();
            }}
            disabled={isSubmissionPending || confirmDisabled}
          >
            {isSubmissionPending ? pendingLabel : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function ConfirmDialogTableSection({ children, className }: ConfirmDialogSectionProps) {
  return (
    <section className={cn("custom-scrollbar overflow-x-hidden overflow-y-auto rounded-md border text-xs", className)}>
      {children}
    </section>
  );
}

export function ConfirmDialogSummarySection({ children, className }: ConfirmDialogSectionProps) {
  return (
    <section className={cn("bg-muted/30 flex flex-col gap-1 rounded-md border p-3 text-xs", className)}>
      {children}
    </section>
  );
}

export function ModalProductIdentity({ code, description }: ModalProductIdentityProps) {
  return (
    <span className="flex min-w-0 items-center gap-2 whitespace-nowrap">
      <span className="product-code shrink-0 uppercase">{code}</span>
      <OverflowTooltip className="text-muted-foreground max-w-52">{description}</OverflowTooltip>
    </span>
  );
}

export function ModalShortcutActionButton({ icon, label, disabled = false, onClick }: ModalShortcutActionButtonProps) {
  return (
    <Button disabled={disabled} onClick={onClick} className="w-full shrink-0 gap-3 md:w-auto">
      {icon}
      <span className="truncate">{label}</span>
      <kbd className="kbd hidden md:inline-flex">shift+&#9166;</kbd>
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
