import { supabase } from "@/lib/supabase";
import type {
  DashboardDailyMetrics,
  DashboardSalesPeriod,
  DashboardSalesPeriodRequest,
  DashboardTopProduct,
  DashboardTopProductsRankMode,
  DashboardProductStockAlert,
  ProductStockAlertType,
} from "@/types";

export type DashboardServiceErrorKind = "network" | "access" | "invalid-response" | "unexpected";

export class DashboardServiceError extends Error {
  readonly kind: DashboardServiceErrorKind;

  constructor(message: string, kind: DashboardServiceErrorKind) {
    super(message);
    this.name = "DashboardServiceError";
    this.kind = kind;
  }
}

type ServiceErrorLike = {
  code?: string;
  message?: string;
};

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateOnly(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_ONLY_PATTERN.test(value)) return false;

  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

function isFiniteNonNegative(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return isFiniteNonNegative(value) && Number.isInteger(value);
}

function invalidResponse(detail: string): never {
  throw new DashboardServiceError(`Respuesta inválida del dashboard: ${detail}`, "invalid-response");
}

function throwServiceError(error: ServiceErrorLike): never {
  const message = error.message || "No se pudo consultar el dashboard";
  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes("failed to fetch") ||
    normalizedMessage.includes("network") ||
    normalizedMessage.includes("load failed")
  ) {
    throw new DashboardServiceError(message, "network");
  }

  if (error.code === "42501" || normalizedMessage.includes("permission denied")) {
    throw new DashboardServiceError(message, "access");
  }

  throw new DashboardServiceError(message, "unexpected");
}

function assertSalesPeriodResponse(data: unknown[]): void {
  const summary = data[0] as Record<string, unknown> | undefined;
  if (!summary) invalidResponse("falta el resumen del período");

  const dates = ["current_start", "current_end", "comparison_start", "comparison_end"] as const;
  if (dates.some((field) => !isValidDateOnly(summary[field]))) invalidResponse("el resumen contiene fechas inválidas");

  const amounts = [
    "current_total_usd",
    "previous_total_usd",
    "average_ticket_usd",
    "previous_average_ticket_usd",
  ] as const;
  if (amounts.some((field) => !isFiniteNonNegative(summary[field]))) {
    invalidResponse("el resumen contiene importes inválidos");
  }

  const operationCounts = ["current_operations", "previous_operations"] as const;
  if (operationCounts.some((field) => !isNonNegativeInteger(summary[field]))) {
    invalidResponse("el resumen contiene cantidades inválidas");
  }

  for (const entry of data) {
    const bucket = entry as Record<string, unknown>;
    if (!isNonNegativeInteger(bucket.bucket_index)) invalidResponse("un intervalo tiene un índice inválido");
    if (typeof bucket.bucket_label !== "string" || bucket.bucket_label.length === 0) {
      invalidResponse("un intervalo no tiene etiqueta");
    }
    if (
      !isValidDateOnly(bucket.bucket_start) ||
      !isValidDateOnly(bucket.bucket_end) ||
      !isValidDateOnly(bucket.comparison_bucket_start) ||
      !isValidDateOnly(bucket.comparison_bucket_end)
    ) {
      invalidResponse("un intervalo contiene fechas inválidas");
    }
    if (typeof bucket.is_available !== "boolean") invalidResponse("un intervalo no informa su disponibilidad");
    if (!isFiniteNonNegative(bucket.bucket_total_usd) || !isFiniteNonNegative(bucket.comparison_bucket_total_usd)) {
      invalidResponse("un intervalo contiene importes inválidos");
    }
  }
}

function assertTopProductsResponse(data: unknown[]): void {
  for (const entry of data) {
    const product = entry as Record<string, unknown>;
    if (!isNonNegativeInteger(product.rank) || product.rank < 1) invalidResponse("un producto tiene posición inválida");
    if (typeof product.product_id !== "string" || product.product_id.length === 0) {
      invalidResponse("un producto no tiene identificador");
    }
    if (typeof product.code !== "string" || product.code.length === 0) invalidResponse("un producto no tiene código");
    if (typeof product.description !== "string" || product.description.length === 0) {
      invalidResponse("un producto no tiene descripción");
    }
    if (!isNonNegativeInteger(product.units)) invalidResponse("un producto tiene unidades inválidas");
    if (!isFiniteNonNegative(product.gross_usd)) invalidResponse("un producto tiene un importe inválido");
    if (!isFiniteNonNegative(product.participation_percentage) || (product.participation_percentage as number) > 100) {
      invalidResponse("un producto tiene una participación inválida");
    }
  }
}

export const dashboardService = {
  getDailyMetrics: async (businessId: string, signal?: AbortSignal): Promise<DashboardDailyMetrics> => {
    let query = supabase.rpc("get_dashboard_daily_metrics", { p_business_id: businessId });
    if (signal) query = query.abortSignal(signal);

    const { data, error } = await query.single();

    if (error) throwServiceError(error);
    return data;
  },
  getSalesPeriod: async (
    businessId: string,
    request: DashboardSalesPeriodRequest,
    signal?: AbortSignal,
  ): Promise<DashboardSalesPeriod> => {
    let query = supabase.rpc("get_dashboard_sales_period", {
      p_business_id: businessId,
      p_period: request.preset,
      p_start_date: request.preset === "custom" ? request.startDate : undefined,
      p_end_date: request.preset === "custom" ? request.endDate : undefined,
    });
    if (signal) query = query.abortSignal(signal);

    const { data, error } = await query;

    if (error) throwServiceError(error);
    if (!Array.isArray(data)) invalidResponse("el período no es una lista");
    assertSalesPeriodResponse(data);
    const summary = data[0];

    return {
      preset: request.preset,
      currentStart: summary.current_start,
      currentEnd: summary.current_end,
      comparisonStart: summary.comparison_start,
      comparisonEnd: summary.comparison_end,
      totalUsd: summary.current_total_usd,
      previousTotalUsd: summary.previous_total_usd,
      operations: summary.current_operations,
      previousOperations: summary.previous_operations,
      averageTicketUsd: summary.average_ticket_usd,
      previousAverageTicketUsd: summary.previous_average_ticket_usd,
      buckets: data.map((bucket) => ({
        index: bucket.bucket_index,
        label: bucket.bucket_label,
        startDate: bucket.bucket_start,
        endDate: bucket.bucket_end,
        isAvailable: bucket.is_available,
        totalUsd: bucket.bucket_total_usd,
        comparisonStartDate: bucket.comparison_bucket_start,
        comparisonEndDate: bucket.comparison_bucket_end,
        comparisonTotalUsd: bucket.comparison_bucket_total_usd,
      })),
    };
  },
  getTopProducts: async (
    businessId: string,
    request: DashboardSalesPeriodRequest,
    rankBy: DashboardTopProductsRankMode,
    signal?: AbortSignal,
  ): Promise<DashboardTopProduct[]> => {
    let query = supabase.rpc("get_dashboard_top_products", {
      p_business_id: businessId,
      p_period: request.preset,
      p_rank_by: rankBy,
      p_start_date: request.preset === "custom" ? request.startDate : undefined,
      p_end_date: request.preset === "custom" ? request.endDate : undefined,
    });
    if (signal) query = query.abortSignal(signal);

    const { data, error } = await query;

    if (error) throwServiceError(error);
    if (!Array.isArray(data)) invalidResponse("los productos no son una lista");
    assertTopProductsResponse(data);
    return data.map((product) => ({
      rank: product.rank,
      productId: product.product_id,
      code: product.code,
      description: product.description,
      units: product.units,
      grossUsd: product.gross_usd,
      participationPercentage: product.participation_percentage,
    }));
  },
  getProductStockAlerts: async (
    businessId: string,
    type: ProductStockAlertType,
    signal?: AbortSignal,
  ): Promise<DashboardProductStockAlert[]> => {
    let query = supabase.rpc("get_product_stock_alerts", {
      p_business_id: businessId,
      p_alert_type: type,
      p_limit: 5,
    });
    if (signal) query = query.abortSignal(signal);

    const { data, error } = await query;

    if (error) throwServiceError(error);
    return data.map((product) => ({
      type: product.alert_type as ProductStockAlertType,
      rank: product.alert_rank,
      productId: product.product_id,
      code: product.code,
      description: product.description,
      stock: product.stock,
      active: product.active,
      stagnantSince: product.stagnant_since,
      stagnantDays: product.stagnant_days,
    }));
  },
};
