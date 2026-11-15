import { CircleCheck } from "lucide-react";
import { CasheaLogoIcon } from "@/features/cashea/components/cashea-logo-icon";
import { cn } from "@/lib/utils";
import type { CasheaCollectionStatus } from "@/types";

export function CasheaStatusIndicator({ status }: { status?: CasheaCollectionStatus }) {
  if (!status) return null;

  const { orders_count, collected_count } = status;
  const isConfirmed = collected_count === orders_count;
  const label = isConfirmed
    ? "Cashea: depósito confirmado"
    : `Cashea: depósito pendiente, ${collected_count} de ${orders_count} órdenes cobradas`;

  return (
    <span role="img" aria-label={label} title={label} className="relative mx-auto block size-5">
      <CasheaLogoIcon className={cn("size-5", !isConfirmed && "opacity-60 grayscale dark:opacity-50")} />
      {isConfirmed && (
        <CircleCheck
          aria-hidden="true"
          strokeWidth={2.5}
          className="text-success fill-background absolute -right-1.5 -bottom-1.5 size-3.5"
        />
      )}
    </span>
  );
}
