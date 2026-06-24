import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useActiveBusiness } from "@/features/business/hooks/useBusinessQueries";

const MODULE_TITLES: Record<string, string> = {
  "/inventory": "Inventario",
  "/movements": "Movimientos",
  "/transactions": "Ventas",
  "/returns": "Devoluciones",
  "/cash-closes": "Cierres de Caja",
  "/users": "Usuarios",
  "/settings": "Ajustes",
};

export function useBusinessDocumentTitle() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const business = useActiveBusiness();

  useEffect(() => {
    const moduleTitle =
      Object.entries(MODULE_TITLES).find(([route]) => pathname.startsWith(route))?.[1] ?? "Inventario";

    document.title = business ? `${moduleTitle} · ${business.name}` : moduleTitle;
  }, [business, pathname]);
}
