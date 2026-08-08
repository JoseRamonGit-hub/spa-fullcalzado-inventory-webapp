import type { InventoryMovement } from "@/types";

export function getMovementTypeInfo(movement: Pick<InventoryMovement, "type" | "return_id">) {
  const { type, return_id } = movement;
  const isExchangeExit = type === "exit" && return_id;

  if (type === "entry") {
    return {
      variant: "success" as const,
      label: "Entrada",
      title: "Entrada de inventario",
    };
  }

  if (type === "return") {
    return {
      variant: "refund" as const,
      label: "Entrada",
      title: "Entrada por devolución",
      showReturnIcon: true,
    };
  }

  if (type === "edit") {
    return {
      variant: "edit" as const,
      label: "Ajuste",
      title: "Ajuste por edición",
    };
  }

  if (type === "activation") {
    return {
      variant: "success" as const,
      label: "Activación",
      title: "Producto activado",
    };
  }

  if (type === "deactivation") {
    return {
      variant: "secondary" as const,
      label: "Desactivación",
      title: "Producto desactivado",
    };
  }

  if (isExchangeExit) {
    return {
      variant: "exchange" as const,
      label: "Salida",
      title: "Salida por cambio",
      showReturnIcon: true,
    };
  }

  return {
    variant: "destructive" as const,
    label: "Salida",
    title: "Salida por venta",
  };
}
