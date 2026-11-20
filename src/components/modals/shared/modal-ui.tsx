import { useRef, useState, type ComponentProps, type ReactNode } from "react";
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

import { cn } from "@/lib/utils";

type ModalConfirmDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  title: string;
  description?: ReactNode;
  media?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  pendingLabel: string;
  submissionErrorMessage: string | ((error: unknown) => string);
  isSubmissionPending: boolean;
  onConfirmSubmit: () => void | Promise<void>;
  contentClassName?: string;
  confirmDisabled?: boolean;
  variant?: "default" | "danger";
  children: ReactNode;
};

type ConfirmDialogSectionProps = {
  children: ReactNode;
  className?: string;
};

type ConfirmDialogLineTableProps = {
  header: ReactNode;
  children: ReactNode;
};

type ConfirmDialogLineRowProps = ComponentProps<"tr">;

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
  media,
  confirmLabel,
  cancelLabel = "Cancelar",
  pendingLabel,
  submissionErrorMessage,
  isSubmissionPending,
  onConfirmSubmit,
  contentClassName,
  confirmDisabled = false,
  variant = "default",
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
    } catch (error) {
      setVisibleSubmissionError(
        typeof submissionErrorMessage === "function" ? submissionErrorMessage(error) : submissionErrorMessage,
      );
    } finally {
      submissionLockRef.current = false;
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent
        className={cn("max-h-[calc(100dvh-2rem)] gap-3 overflow-y-auto p-4 sm:gap-4 sm:p-5", contentClassName)}
        {...(description ? {} : { "aria-describedby": undefined })}
      >
        <AlertDialogHeader className="flex flex-row items-center gap-3 text-left sm:text-left">
          {media}
          <div className="flex min-w-0 flex-1 flex-col">
            <AlertDialogTitle className="text-base leading-tight">{title}</AlertDialogTitle>
            <ActiveBusinessContext className="mt-1" />
            {description && (
              <AlertDialogDescription className="mt-1 text-sm leading-snug">{description}</AlertDialogDescription>
            )}
          </div>
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

        <AlertDialogFooter className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2 sm:flex sm:justify-end">
          <AlertDialogCancel className="w-full sm:w-auto" disabled={isSubmissionPending}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            variant={variant === "danger" ? "destructive" : "default"}
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
    <section
      className={cn(
        "custom-scrollbar [&_thead]:bg-muted/95 overflow-auto rounded-md border text-xs [&_td]:px-2 [&_td]:py-1.5 sm:[&_td]:px-3 [&_th]:py-1.5 max-sm:[&_th]:px-2 [&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function ConfirmDialogLineTable({ header, children }: ConfirmDialogLineTableProps) {
  return (
    <table className="w-full">
      <thead className="bg-muted">
        <tr className="text-muted-foreground border-b">{header}</tr>
      </thead>
      <tbody className="divide-border/60 divide-y">{children}</tbody>
    </table>
  );
}

export function ConfirmDialogLineRow({ className, ...props }: ConfirmDialogLineRowProps) {
  return <tr className={cn("bg-card", className)} {...props} />;
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
    <span className="block min-w-0 leading-snug [overflow-wrap:anywhere]">
      <span className="product-code mr-2 uppercase">{code}</span>
      <span className="text-foreground">{description}</span>
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
