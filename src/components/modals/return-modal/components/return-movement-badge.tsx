import { IterationCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type ReturnMovementBadgeKind = "entry" | "exit" | "refund" | "exchange";

const badgeConfig = {
  entry: {
    variant: "refund" as const,
    label: "Entrada",
    title: "Entrada por devolución",
  },
  exit: {
    variant: "exchange" as const,
    label: "Salida",
    title: "Salida por cambio",
  },
  refund: {
    variant: "refund" as const,
    label: "Devolución",
    title: "Devolución",
  },
  exchange: {
    variant: "exchange" as const,
    label: "Cambio",
    title: "Cambio",
  },
};

type ReturnMovementBadgeProps = {
  kind: ReturnMovementBadgeKind;
};

export function ReturnMovementBadge({ kind }: ReturnMovementBadgeProps) {
  const config = badgeConfig[kind];

  return (
    <Badge variant={config.variant} className="px-1.5 py-0.5 text-[9px]" title={config.title}>
      <IterationCcw aria-hidden="true" />
      {config.label}
    </Badge>
  );
}
