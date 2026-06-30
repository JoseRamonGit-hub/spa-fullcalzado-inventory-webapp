import type { ReturnSummary } from "./types";

export type ReturnPresentation = {
  isExchange: boolean;
  operationLabel: "Cambio" | "Devolución";
  outcomeLabel: "Sin resultado" | "Tienda devuelve" | "Cliente paga" | "Cambio exacto";
  differenceUsd: number;
  differenceVes: number;
  differenceClassName: "text-success" | "text-destructive" | "text-foreground";
  actionLabel: "Registrar cambio" | "Registrar devolución";
  confirmTitle: "Confirmar cambio" | "Confirmar devolución";
};

export function getReturnPresentation(summary: ReturnSummary, hasReturnItems: boolean): ReturnPresentation {
  const isExchange = summary.returnType === "exchange";
  const outcomeLabel = !hasReturnItems
    ? "Sin resultado"
    : !isExchange || summary.differenceUsd < 0
      ? "Tienda devuelve"
      : summary.differenceUsd > 0
        ? "Cliente paga"
        : "Cambio exacto";
  const differenceClassName = !hasReturnItems
    ? "text-foreground"
    : summary.differenceUsd > 0
      ? "text-success"
      : summary.differenceUsd < 0
        ? "text-destructive"
        : "text-foreground";

  return {
    isExchange,
    operationLabel: isExchange ? "Cambio" : "Devolución",
    outcomeLabel,
    differenceUsd: hasReturnItems ? summary.differenceUsd : 0,
    differenceVes: hasReturnItems ? summary.differenceVes : 0,
    differenceClassName,
    actionLabel: isExchange ? "Registrar cambio" : "Registrar devolución",
    confirmTitle: isExchange ? "Confirmar cambio" : "Confirmar devolución",
  };
}
