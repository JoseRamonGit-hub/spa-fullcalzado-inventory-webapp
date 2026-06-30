import { useExchangeRate } from "@/features/exchange-rates/hooks/useExchangeRateQueries";
import { formatCurrencyVES } from "@/utils/formatters";

const MISSING_EXCHANGE_RATE_MESSAGE = "No hay una tasa de cambio vigente. Actualizala en Ajustes para continuar.";

export type ModalExchangeRate = {
  value: number;
  isReady: boolean;
  isLoading: boolean;
  displayValue: string;
  statusTitle: string;
  statusMessage: string;
};

export function useModalExchangeRate(): ModalExchangeRate {
  const { data, isLoading } = useExchangeRate();
  const value = data?.rate ?? 0;
  const isReady = value > 0;

  return {
    value,
    isReady,
    isLoading,
    displayValue: isReady ? formatCurrencyVES(value) : "Sin tasa vigente",
    statusTitle: isLoading ? "Cargando tasa" : "Tasa no disponible",
    statusMessage: isLoading ? "Cargando tasa de cambio vigente..." : MISSING_EXCHANGE_RATE_MESSAGE,
  };
}
