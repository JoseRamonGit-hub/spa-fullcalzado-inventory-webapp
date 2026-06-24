import { useEffect } from "react";
import { useIsFetching } from "@tanstack/react-query";
import { LoaderCircle, Store } from "lucide-react";
import { toast } from "sonner";
import { useBusinesses } from "@/features/business/hooks/useBusinessQueries";
import { useBusinessTransitionStore } from "@/features/business/store/useBusinessTransitionStore";
import { getBusinessDotStyle, getBusinessIconStyle, getBusinessTheme } from "@/features/business/utils/business-theme";

const MINIMUM_VISIBLE_TIME = 1000;
const MAXIMUM_VISIBLE_TIME = 3000;
const TENANT_QUERY_ROOTS = new Set(["products", "movements", "transactions", "returns", "cash-closes", "exchangeRate"]);

export function BusinessTransitionOverlay() {
  const targetBusinessId = useBusinessTransitionStore((state) => state.targetBusinessId);
  const targetBusinessName = useBusinessTransitionStore((state) => state.targetBusinessName);
  const startedAt = useBusinessTransitionStore((state) => state.startedAt);
  const finishTransition = useBusinessTransitionStore((state) => state.finishTransition);
  const { data: businesses = [] } = useBusinesses();
  const targetBusiness = businesses.find((business) => business.id === targetBusinessId) ?? null;
  const targetTheme = getBusinessTheme(targetBusiness);
  const activeBusinessFetches = useIsFetching({
    predicate: (query) =>
      !!targetBusinessId &&
      typeof query.queryKey[0] === "string" &&
      TENANT_QUERY_ROOTS.has(query.queryKey[0]) &&
      query.queryKey[1] === targetBusinessId,
  });

  useEffect(() => {
    if (!targetBusinessName || startedAt === null) return;

    let completed = false;
    const elapsed = Date.now() - startedAt;

    const completeTransition = () => {
      if (completed) return;
      completed = true;
      finishTransition();
      toast.success(`Ahora estás operando en ${targetBusinessName}`);
    };

    const minimumTimer =
      activeBusinessFetches === 0
        ? window.setTimeout(completeTransition, Math.max(0, MINIMUM_VISIBLE_TIME - elapsed))
        : undefined;
    const maximumTimer = window.setTimeout(completeTransition, Math.max(0, MAXIMUM_VISIBLE_TIME - elapsed));

    return () => {
      if (minimumTimer !== undefined) window.clearTimeout(minimumTimer);
      window.clearTimeout(maximumTimer);
    };
  }, [activeBusinessFetches, finishTransition, startedAt, targetBusinessName]);

  useEffect(() => () => finishTransition(), [finishTransition]);

  if (!targetBusinessName) return null;

  return (
    <div
      className="bg-background fixed inset-0 z-60 flex items-center justify-center px-6"
      role="status"
      aria-live="polite"
      aria-label={`Cambiando a ${targetBusinessName}`}
    >
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <div className="relative">
          <div
            className="flex size-14 items-center justify-center rounded-2xl"
            style={getBusinessIconStyle(targetTheme)}
          >
            <Store className="size-6" aria-hidden="true" />
          </div>
          <LoaderCircle
            className="bg-card absolute -right-2 -bottom-2 size-6 animate-spin rounded-full p-1 shadow-sm"
            style={{ color: targetTheme.accent }}
            aria-hidden="true"
          />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Cambiando de negocio</p>
          <div className="flex items-center justify-center gap-2">
            <span className="size-1.5 rounded-full" style={getBusinessDotStyle(targetTheme)} aria-hidden="true" />
            <p className="font-heading text-foreground text-base font-semibold">{targetBusinessName}</p>
          </div>
          <p className="text-muted-foreground text-xs">Preparando inventario y operaciones…</p>
        </div>
      </div>
    </div>
  );
}
